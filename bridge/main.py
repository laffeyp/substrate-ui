"""bridge/main.py — substrate desktop shell Python bridge.

Reads newline-delimited JSON on stdin, writes newline-delimited JSON on stdout.
Imports substrate in-process (D62 — the shell is one binary that imports substrate,
not a client talking to a daemon).

Every value that names a vocabulary member — envelope kinds, driver kinds,
reason strings, op names — comes from bridge/vocab.py. No raw strings appear
inline. `if kind == USER_MESSAGE` reads a substrate constant; `if op ==
BridgeOp.PING` reads a local StrEnum. A rename in substrate or in
signals/bridge-reasons.json flows through automatically.

Every request carries a `request_id` (uuid4 hex 12-char minted shell-side); every
reply carries the same `request_id`, `op:"reply"`, and either `ok:true` with a
`result` payload or `ok:false` with a `reason` string.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

try:
    import substrate  # type: ignore[import-not-found]
except Exception as e:  # noqa: BLE001
    # Vocab isn't loaded yet — this is the one place the halt reason string
    # appears in bare form, because a halt fires when the imports themselves
    # fail. Same string ratified in vocab.HaltReason.SUBSTRATE_IMPORT_FAILED.
    sys.stdout.write(
        json.dumps({"op": "halt", "reason": "substrate_import_failed", "detail": str(e)})
        + "\n"
    )
    sys.stdout.flush()
    sys.exit(1)

# Single-source vocabulary — substrate enums + bridge-reasons.json shared with
# the shell. Every kind name / reason string / secret pattern / op name lives
# in one place. Zero retyping.
import vocab
from vocab import (  # noqa: E402
    USER_MESSAGE, MODEL_REPLY, PARK, SESSION_ENDED, TRANSCRIPT_COMPACTED,
    TOOL_CALL, TOOL_RESULT, RATE_LIMITED_WAITING,
    VISIBLE_KINDS, ParkReason, SessionEndReason,
    DriverKind,
    SessionCreateFailedReason as SCR,
    ProbeDriverFailedReason as PDR,
    SessionResumeFailedReason as SRR,
    SessionEndFailedReason as SEF,
    TurnSubmitFailedReason as TSF,
    RecordReadFailedReason as RRR,
    BridgeOp, ReplyOp,
)


PROTOCOL = 1


_STDOUT_LOCK = threading.Lock()
_LONG_OP_POOL = ThreadPoolExecutor(max_workers=16, thread_name_prefix="bridge-long")


def emit(msg: dict) -> None:
    with _STDOUT_LOCK:
        sys.stdout.write(json.dumps(msg) + "\n")
        sys.stdout.flush()


def reply_ok(rid: str, result: object) -> None:
    emit({"op": ReplyOp.REPLY.value, "request_id": rid, "ok": True, "result": result})


def reply_err(rid: str, reason: str) -> None:
    emit({"op": ReplyOp.REPLY.value, "request_id": rid, "ok": False, "reason": reason})


def _long_op(rid: str, fn, msg: dict) -> None:  # noqa: ANN001
    """Run a long-op on the thread pool so concurrent turn_submit / session_end
    calls actually stack up on SessionRegistry's per-session lock — the bridge
    read loop stays free to admit the next request."""
    def _run() -> None:
        try:
            result = fn(msg)
            if isinstance(result, dict) and result.get("__error__"):
                reply_err(rid, result.get("reason", SCR.REGISTRY_ERROR.value))
            else:
                reply_ok(rid, result)
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
    _LONG_OP_POOL.submit(_run)


_REGISTRY_CACHE: object | None = None


def _build_session_topology_from_manifest(manifest, first_turn_user_message):  # noqa: ANN001, ANN202
    """Factory closure passed to SessionRegistry at construction. Routes on
    DriverKind: DETERMINISTIC → DeterministicResponder(seed=0); OLLAMA →
    OllamaResponder(model=<extracted>); other kinds fall back to
    Deterministic. Runs a real local LLM turn when the shell picks an
    ollama:* driver."""
    from substrate.topologies.session import session_topology
    from substrate.adapters import DeterministicResponder
    from pathlib import Path as _Path
    driver_name = manifest.driver
    driver_context_tokens = 4096
    if vocab.driver_kind(driver_name) is DriverKind.OLLAMA:
        from substrate.adapters.models import OllamaResponder
        driver = OllamaResponder(model=vocab.ollama_model(driver_name), num_ctx=8192, timeout=180.0)
        driver_context_tokens = 8192
    else:
        driver = DeterministicResponder(seed=0)
    return session_topology(
        driver=driver,
        driver_name=driver_name,
        driver_context_tokens=driver_context_tokens,
        seed=manifest.seed,
        tools={},
        session_id=manifest.session_id,
        workspace_path=manifest.workspace,
        workspace_shape=manifest.workspace_shape,
        bundle=manifest.bundle,
        record_root=_Path(manifest.record_root),
        first_turn_user_message=first_turn_user_message,
    )


def _registry() -> object:
    """Lazy SessionRegistry singleton with a session_topology_factory injected
    so turn_sync can drive /exit."""
    global _REGISTRY_CACHE
    if _REGISTRY_CACHE is None:
        from substrate.session_registry import SessionRegistry
        _REGISTRY_CACHE = SessionRegistry(
            auto_boot=True,
            session_topology_factory=_build_session_topology_from_manifest,
        )
    return _REGISTRY_CACHE


def op_session_create(payload: dict) -> dict:
    """Wrap SessionRegistry.create; return the manifest fields the shell needs."""
    from substrate.session_registry import NameCollision  # type: ignore[import-not-found]
    reg = _registry()
    try:
        manifest = reg.create(  # type: ignore[attr-defined]
            session_id=payload["session_id"],
            name=payload.get("name") or None,
            driver=payload["driver"],
            workspace=payload["workspace_path"],
            workspace_shape=payload["workspace_shape"],
            bundle=payload.get("bundle") or None,
            seed=payload.get("seed", ""),
        )
    except NameCollision as e:
        return {"__error__": True, "reason": SCR.NAME_COLLISION.value, "detail": str(e)}
    except (ValueError, KeyError) as e:
        return {"__error__": True, "reason": SCR.WORKSPACE_INVALID.value, "detail": str(e)}
    return {
        "session_id": manifest.session_id,
        "session_name": manifest.name,
        "manifest_path": f"{manifest.record_root.rsplit('/record', 1)[0]}/manifest.json",
        "workspace_path": manifest.workspace,
        "workspace_shape": manifest.workspace_shape,
    }


def op_probe_driver(payload: dict) -> dict:
    """Probe a driver's availability. Returns {available, context_tokens?,
    model_families?} on success; raises typed reason on failure."""
    driver_name = payload.get("driver_name", "")
    driver_params = payload.get("driver_params", {})
    _ = vocab.strip_secrets(driver_params)  # audit only — actual params come from caller

    kind = vocab.driver_kind(driver_name)
    if kind is DriverKind.DETERMINISTIC:
        return {"available": True, "context_tokens": None,
                "model_families": [DriverKind.DETERMINISTIC.value]}

    if kind is DriverKind.OLLAMA:
        model = vocab.ollama_model(driver_name)
        try:
            import urllib.request
            import urllib.error
            req = urllib.request.Request(
                "http://127.0.0.1:11434/api/show",
                data=json.dumps({"name": model}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=8) as resp:  # noqa: S310
                data = json.loads(resp.read().decode("utf-8"))
            return {
                "available": True,
                "context_tokens": data.get("model_info", {}).get("context_length"),
                "model_families": data.get("details", {}).get("families", []),
            }
        except urllib.error.HTTPError as e:  # noqa: F841
            return {"__error__": True, "reason": PDR.MODEL_MISSING.value, "detail": f"HTTP {e.code}"}
        except (urllib.error.URLError, TimeoutError, ConnectionRefusedError) as e:
            return {"__error__": True, "reason": PDR.NOT_INSTALLED.value, "detail": f"{type(e).__name__}"}

    if kind is DriverKind.CLI:
        import subprocess
        try:
            r = subprocess.run(  # noqa: S603
                [driver_name, "--version"], capture_output=True, timeout=5, text=True,
            )
            if r.returncode == 0:
                return {"available": True, "model_families": [driver_name]}
            return {"__error__": True, "reason": PDR.NOT_INSTALLED.value,
                    "detail": f"returncode {r.returncode}"}
        except FileNotFoundError:
            return {"__error__": True, "reason": PDR.NOT_INSTALLED.value, "detail": "binary not on PATH"}
        except subprocess.TimeoutExpired:
            return {"__error__": True, "reason": PDR.TIMEOUT.value, "detail": "cli --version exceeded 5s"}

    return {"__error__": True, "reason": PDR.NOT_INSTALLED.value,
            "detail": f"unknown driver kind: {driver_name}"}


def op_list_sessions() -> list[dict]:
    """List every registered session's manifest as a dict."""
    reg = _registry()
    manifests = reg.list_all()  # type: ignore[attr-defined]
    out = []
    for m in manifests:
        out.append({
            "session_id": m.session_id,
            "name": m.name,
            "status": str(m.status),
            "workspace": m.workspace,
            "workspace_shape": m.workspace_shape,
            "driver": m.driver,
            "bundle": m.bundle,
            "record_root": m.record_root,
        })
    return out


def _max_user_turn_index(record_root: Path) -> int:
    """Walk a record's envelopes; return the highest UserMessage.turn_index
    seen (or -1 if none). Shared between resume / turn_submit / session_end."""
    from substrate import api  # type: ignore[import-not-found]
    max_ti = -1
    try:
        if not record_root.exists():
            return -1
        for env in api.read_record(record_root):
            pl = env.get("payload") or {}
            if env.get("kind") == USER_MESSAGE and isinstance(pl, dict) and "turn_index" in pl:
                max_ti = max(max_ti, int(pl["turn_index"]))
    except Exception:  # noqa: BLE001
        pass
    return max_ti


def op_session_resume(payload: dict) -> dict:
    """Attach to an existing session — read the manifest, return the fields
    the shell needs to bind the pane. Raises typed reason on failure."""
    from substrate.session_registry import SessionStatus  # type: ignore[import-not-found]
    reg = _registry()
    session_id = payload.get("session_id", "")
    manifest = reg.get(session_id)  # type: ignore[attr-defined]
    if manifest is None:
        return {"__error__": True, "reason": SRR.NOT_FOUND.value}
    if manifest.status == SessionStatus.ENDED:
        return {"__error__": True, "reason": SRR.SESSION_ENDED.value}
    last_turn_index = _max_user_turn_index(Path(manifest.record_root))
    return {
        "session_id": manifest.session_id,
        "session_name": manifest.name,
        "workspace_path": manifest.workspace,
        "workspace_shape": manifest.workspace_shape,
        "driver": manifest.driver,
        "status": str(manifest.status),
        "record_root": manifest.record_root,
        "last_turn_index": last_turn_index,
    }


def op_record_read(payload: dict) -> dict:
    """Return the ordered envelopes for a session's record. Only envelopes
    whose `kind` names a user-visible beat come back; framework brackets
    (RunStarted, ProducerStarted, TriggerFired, etc.) are elided.

    Payload accepts either `session_id` (looks up the manifest) or
    `record_root` (reads that path directly — used by Sprint 021's
    delegate-expand path to load a child session's transcript without
    going through the SessionRegistry, since a child session's record
    can live outside ~/.substrate/sessions/)."""
    from substrate import api  # type: ignore[import-not-found]
    record_root_str = payload.get("record_root")
    if record_root_str:
        root = Path(record_root_str)
        session_id = ""
    else:
        reg = _registry()
        session_id = payload.get("session_id", "")
        manifest = reg.get(session_id)  # type: ignore[attr-defined]
        if manifest is None:
            return {"__error__": True, "reason": RRR.NOT_FOUND.value}
        root = Path(manifest.record_root)
    out = []
    # Sprint 021 — first pass builds a call_id → child_root map from
    # ToolResult(tool="delegate") envelopes. delegate's ToolResult
    # carries {"child_root": <path>} on its output payload; the second
    # pass attaches that path to the matching parent ToolCall row, so
    # the shell can load the child transcript on expand.
    tool_call_id_to_child_root: dict[str, str] = {}
    try:
        for env in api.read_record(root):
            if env.get("kind") == TOOL_RESULT:
                pl = env.get("payload") or {}
                if isinstance(pl, dict):
                    call_id = pl.get("call_id")
                    output = pl.get("output")
                    if isinstance(call_id, str) and isinstance(output, dict):
                        child_root = output.get("child_root")
                        if isinstance(child_root, str):
                            tool_call_id_to_child_root[call_id] = child_root
        for env in api.read_record(root):
            kind = env.get("kind", "")
            if kind not in VISIBLE_KINDS:
                continue
            producer = env.get("producer") or {}
            producer_kind = producer.get("kind") if isinstance(producer, dict) else None
            pl = env.get("payload") or {}
            summary = ""
            park_reason = None
            end_reason = None
            tokens_before = None
            tokens_after = None
            compact_strategy = None
            retry_index = None
            retry_max = None
            retry_after_seconds = None
            tool_name = None
            tool_call_id = None
            if kind == USER_MESSAGE:
                summary = str(pl.get("assembled_prompt", ""))[:200]
            elif kind == MODEL_REPLY:
                summary = str(pl.get("text", ""))[:200]
            elif kind == PARK:
                # Propagate substrate's ParkReason enum verbatim.
                park_reason = pl.get("reason") if isinstance(pl, dict) else None
                summary = str(park_reason or "")
            elif kind == SESSION_ENDED:
                end_reason = pl.get("reason") if isinstance(pl, dict) else None
                summary = str(end_reason or "")
            elif kind == TRANSCRIPT_COMPACTED:
                tokens_before = pl.get("tokens_before") if isinstance(pl, dict) else None
                tokens_after = pl.get("tokens_after") if isinstance(pl, dict) else None
                compact_strategy = pl.get("strategy") if isinstance(pl, dict) else None
                summary = f"{tokens_before}→{tokens_after} via {compact_strategy}"
            elif kind == RATE_LIMITED_WAITING:
                retry_index = pl.get("retry_index") if isinstance(pl, dict) else None
                retry_max = pl.get("retry_max") if isinstance(pl, dict) else None
                retry_after_seconds = pl.get("retry_after_seconds") if isinstance(pl, dict) else None
                summary = f"retry {retry_index}/{retry_max} in {retry_after_seconds}s"
            elif kind == TOOL_CALL:
                tool_name = pl.get("tool") if isinstance(pl, dict) else None
                tool_call_id = pl.get("call_id") if isinstance(pl, dict) else None
                summary = str(tool_name or "")
            elif kind == TOOL_RESULT:
                # Sprint 021 — a delegate ToolResult carries the child
                # record_root; the shell folds the delegate flow on the
                # parent side when this envelope lands.
                tool_name = pl.get("tool") if isinstance(pl, dict) else None
                tool_call_id = pl.get("call_id") if isinstance(pl, dict) else None
                summary = f"{tool_name} → ok" if pl.get("ok") else f"{tool_name} → err"
            child_record_root = (
                tool_call_id_to_child_root.get(tool_call_id) if tool_call_id else None
            )
            out.append({
                "seq": int(env.get("seq", -1)),
                "kind": kind,
                "producer_kind": producer_kind or "?",
                "summary": summary,
                "turn_index": pl.get("turn_index") if isinstance(pl, dict) else None,
                "park_reason": park_reason,
                "end_reason": end_reason,
                "tokens_before": tokens_before,
                "tokens_after": tokens_after,
                "compact_strategy": compact_strategy,
                "retry_index": retry_index,
                "retry_max": retry_max,
                "retry_after_seconds": retry_after_seconds,
                "tool_name": tool_name,
                "tool_call_id": tool_call_id,
                "child_record_root": child_record_root,
            })
    except Exception as e:  # noqa: BLE001
        return {"__error__": True, "reason": f"{RRR.READ_ERROR.value}:{e}"}
    return {"session_id": session_id, "envelopes": out}


def op_turn_submit(payload: dict) -> dict:
    """Submit one turn against a bound session. Returns {turn_index} on ack;
    typed failure reasons on refusal."""
    from substrate.session_registry import (  # type: ignore[import-not-found]
        SessionEndedMidTurn, FreshSessionRequiresUserMessage, TornRecordOnResume,
    )
    from substrate.topologies.session import UserMessage  # type: ignore[import-not-found]
    reg = _registry()
    session_id = payload.get("session_id", "")
    text = payload.get("text", "")
    timeout_seconds = float(payload.get("timeout_seconds", 60))
    manifest = reg.get(session_id)  # type: ignore[attr-defined]
    if manifest is None:
        return {"__error__": True, "reason": SRR.NOT_FOUND.value}

    admitted, cap = reg.try_enqueue_turn(session_id)  # type: ignore[attr-defined]
    if not admitted:
        return {"__error__": True, "reason": TSF.QUEUE_FULL.value, "cap": cap}

    # Harness-only stall.
    _sleep_ms = int(os.environ.get("HARNESS_TURN_SLEEP_MS", "0"))
    if _sleep_ms > 0:
        time.sleep(_sleep_ms / 1000.0)

    def _turn_event_builder(m, root):  # noqa: ANN001, ANN202
        return UserMessage(
            text=text, turn_index=_max_user_turn_index(root) + 1,
            assembled_prompt=text, slash_source=None,
        )

    try:
        final_manifest, _root = reg.turn_sync(  # type: ignore[attr-defined]
            session_id, resume_event_builder=_turn_event_builder,
            timeout_seconds=timeout_seconds,
        )
    except SessionEndedMidTurn as e:
        return {"__error__": True, "reason": TSF.SESSION_ENDED.value, "detail": str(e)}
    except FreshSessionRequiresUserMessage as e:
        return {"__error__": True, "reason": TSF.FRESH_SESSION_REQUIRES_USER_MESSAGE.value, "detail": str(e)}
    except TornRecordOnResume as e:
        return {"__error__": True, "reason": TSF.TORN_RECORD_ON_RESUME.value, "detail": str(e)}
    except TimeoutError as e:
        return {"__error__": True, "reason": TSF.TIMEOUT.value, "detail": str(e)}
    except (RuntimeError, KeyError, ValueError) as e:
        return {"__error__": True, "reason": SCR.REGISTRY_ERROR.value, "detail": str(e)}
    finally:
        reg.dequeue_turn(session_id)  # type: ignore[attr-defined]

    max_ti = _max_user_turn_index(Path(final_manifest.record_root))
    return {"session_id": session_id, "turn_index": max_ti}


def op_session_end(payload: dict) -> dict:
    """Fire an /exit turn through the injected topology factory. Returns
    {end_reason, record_finalised, envelope_seq}."""
    from substrate.session_registry import SessionEndedMidTurn, SessionStatus  # type: ignore[import-not-found]
    from substrate.topologies.session import UserMessage, END_ON_EXIT_SENTINEL  # type: ignore[import-not-found]
    from substrate import api  # type: ignore[import-not-found]
    reg = _registry()
    session_id = payload.get("session_id", "")
    manifest = reg.get(session_id)  # type: ignore[attr-defined]
    if manifest is None:
        return {"__error__": True, "reason": SEF.NOT_FOUND.value}
    if manifest.status == SessionStatus.ENDED:
        return {"__error__": True, "reason": SEF.SESSION_ALREADY_ENDED.value}

    def _end_event_builder(m, root):  # noqa: ANN001, ANN202
        return UserMessage(
            text=END_ON_EXIT_SENTINEL,
            turn_index=_max_user_turn_index(root) + 1,
            assembled_prompt=END_ON_EXIT_SENTINEL, slash_source="menu:end",
        )

    try:
        final_manifest, record_root = reg.turn_sync(  # type: ignore[attr-defined]
            session_id, resume_event_builder=_end_event_builder, timeout_seconds=30.0,
        )
    except SessionEndedMidTurn as e:
        return {"__error__": True, "reason": SEF.SESSION_ALREADY_ENDED.value, "detail": str(e)}
    except (RuntimeError, KeyError, ValueError) as e:
        return {"__error__": True, "reason": SEF.REGISTRY_ERROR.value, "detail": str(e)}

    # Scan the record for the SessionEnded envelope. Default reason is
    # substrate's USER_END — the ratified value the session_end producer
    # emits when the shell drives /exit via the menu path.
    envelope_seq = -1
    end_reason = SessionEndReason.USER_END.value
    try:
        for env in api.read_record(record_root):
            if env.get("kind") == SESSION_ENDED:
                envelope_seq = int(env.get("seq", -1))
                pl = env.get("payload") or {}
                if isinstance(pl, dict) and "reason" in pl:
                    end_reason = str(pl["reason"])
                break
    except Exception:  # noqa: BLE001
        pass

    return {
        "session_id": session_id,
        "end_reason": end_reason,
        "record_finalised": final_manifest.status == SessionStatus.ENDED,
        "envelope_seq": envelope_seq,
    }


def op_read_recent_workspaces() -> list[dict]:
    """Return the recent-workspaces roster; empty list on absence or read error."""
    path = Path.home() / ".substrate" / "recent-workspaces.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
    except Exception:
        return []
    if not isinstance(data, list):
        return []
    out = []
    for row in data:
        if not isinstance(row, dict):
            continue
        p = row.get("path")
        s = row.get("shape")
        if not isinstance(p, str) or not isinstance(s, str):
            continue
        out.append({"path": p, "shape": s, "last_used": row.get("last_used")})
    return out


def _handle_short_op(op: BridgeOp, msg: dict, rid: str) -> None:
    """Dispatch a short (synchronous) op. Long ops (turn_submit, session_end)
    take the thread-pool path."""
    if op is BridgeOp.PING:
        emit({"op": ReplyOp.PONG.value, "request_id": rid, "t": int(time.time() * 1000)})
        return
    if op is BridgeOp.READ_RECENT_WORKSPACES:
        try:
            reply_ok(rid, op_read_recent_workspaces())
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
        return
    if op is BridgeOp.LIST_SESSIONS:
        try:
            reply_ok(rid, op_list_sessions())
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
        return
    if op is BridgeOp.SESSION_RESUME:
        try:
            result = op_session_resume(msg)
            if result.get("__error__"):
                reply_err(rid, result.get("reason", SCR.REGISTRY_ERROR.value))
            else:
                reply_ok(rid, result)
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
        return
    if op is BridgeOp.PROBE_DRIVER:
        try:
            result = op_probe_driver(msg)
            if result.get("__error__"):
                reply_err(rid, result.get("reason", PDR.NOT_INSTALLED.value))
            else:
                reply_ok(rid, result)
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
        return
    if op is BridgeOp.RECORD_READ:
        try:
            result = op_record_read(msg)
            if result.get("__error__"):
                reply_err(rid, result.get("reason", RRR.READ_ERROR.value))
            else:
                reply_ok(rid, result)
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
        return
    if op is BridgeOp.SESSION_CREATE:
        try:
            result = op_session_create(msg)
            if result.get("__error__"):
                reply_err(rid, result.get("reason", SCR.REGISTRY_ERROR.value))
            else:
                reply_ok(rid, result)
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"{SCR.REGISTRY_ERROR.value}:{e}")
        return


def main() -> int:
    emit({"op": "hello", "substrate": substrate.__version__, "protocol": PROTOCOL})
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError as e:
            print(f"bridge: bad json ({e}): {line[:120]}", file=sys.stderr)
            continue
        op_str = msg.get("op")
        rid = msg.get("request_id") or msg.get("id")
        try:
            op = BridgeOp(op_str)
        except ValueError:
            reply_err(rid, f"unknown_op:{op_str}")
            continue

        if op is BridgeOp.TURN_SUBMIT:
            _long_op(rid, op_turn_submit, msg)
        elif op is BridgeOp.SESSION_END:
            _long_op(rid, op_session_end, msg)
        else:
            _handle_short_op(op, msg, rid)
    return 0


if __name__ == "__main__":
    _ = os  # reserved for later use
    sys.exit(main())
