"""bridge/main.py — substrate desktop shell Python bridge.

Reads newline-delimited JSON on stdin, writes newline-delimited JSON on stdout.
Imports substrate in-process (D62 — the shell is one binary that imports substrate,
not a client talking to a daemon).

On start: emits {"op":"hello","substrate":"<version>","protocol":1}.

Every request carries a `request_id` (uuid4 hex 12-char minted shell-side); every
reply carries the same `request_id`, `op:"reply"`, and either `ok:true` with a
`result` payload or `ok:false` with a `reason` string.

Ops currently handled:
  ping                       → pong
  read_recent_workspaces     → list of {path, shape, last_used} rows read from
                                ~/.substrate/recent-workspaces.json (empty on miss)

Every unknown op replies {"op":"reply","request_id":<rid>,"ok":false,
"reason":"unknown_op:<op>"}.
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
    sys.stdout.write(
        json.dumps({"op": "halt", "reason": "substrate_import_failed", "detail": str(e)})
        + "\n"
    )
    sys.stdout.flush()
    sys.exit(1)


PROTOCOL = 1


_STDOUT_LOCK = threading.Lock()
_LONG_OP_POOL = ThreadPoolExecutor(max_workers=16, thread_name_prefix="bridge-long")


def emit(msg: dict) -> None:
    with _STDOUT_LOCK:
        sys.stdout.write(json.dumps(msg) + "\n")
        sys.stdout.flush()


def reply_ok(rid: str, result: object) -> None:
    emit({"op": "reply", "request_id": rid, "ok": True, "result": result})


def reply_err(rid: str, reason: str) -> None:
    emit({"op": "reply", "request_id": rid, "ok": False, "reason": reason})


def _long_op(rid: str, fn, msg: dict) -> None:  # noqa: ANN001
    """Run a long-op on the thread pool so concurrent turn_submit / session_end
    calls actually stack up on SessionRegistry's per-session lock — the bridge
    read loop stays free to admit the next request."""
    def _run() -> None:
        try:
            result = fn(msg)
            if isinstance(result, dict) and result.get("__error__"):
                reply_err(rid, result.get("reason", "registry_error"))
            else:
                reply_ok(rid, result)
        except Exception as e:  # noqa: BLE001
            reply_err(rid, f"registry_error:{e}")
    _LONG_OP_POOL.submit(_run)


_REGISTRY_CACHE: object | None = None


def _build_session_topology_from_manifest(manifest, first_turn_user_message):  # noqa: ANN001, ANN202
    """Factory closure passed to SessionRegistry at construction. Routes on
    manifest.driver: 'deterministic' → DeterministicResponder(seed=0);
    'ollama:<model>' → OllamaResponder(model=<model>); other prefixes fall
    back to Deterministic with a stderr note. Runs a real local LLM turn
    when the shell picks an ollama:* driver."""
    from substrate.topologies.session import session_topology
    from substrate.adapters import DeterministicResponder
    from pathlib import Path as _Path
    driver_name = manifest.driver
    driver_context_tokens = 4096
    if driver_name.startswith("ollama:"):
        model = driver_name.split(":", 1)[1]
        from substrate.adapters.models import OllamaResponder
        driver = OllamaResponder(model=model, num_ctx=8192, timeout=180.0)
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
        return {"__error__": True, "reason": "name_collision", "detail": str(e)}
    except (ValueError, KeyError) as e:
        return {"__error__": True, "reason": "workspace_invalid", "detail": str(e)}
    return {
        "session_id": manifest.session_id,
        "session_name": manifest.name,
        "manifest_path": f"{manifest.record_root.rsplit('/record', 1)[0]}/manifest.json",
        "workspace_path": manifest.workspace,
        "workspace_shape": manifest.workspace_shape,
    }


_SECRET_KEY_RX = None  # lazily compiled


def _strip_secrets(obj: object) -> object:
    """Strip any key at any depth matching /key|token|secret|password/i from
    a nested dict. Per signals/0.1.json § layer_7 constraint on driver_params."""
    import re
    global _SECRET_KEY_RX
    if _SECRET_KEY_RX is None:
        _SECRET_KEY_RX = re.compile(r"key|token|secret|password", re.IGNORECASE)
    if isinstance(obj, dict):
        return {k: ("<stripped>" if _SECRET_KEY_RX.search(k) else _strip_secrets(v))
                for k, v in obj.items()}
    if isinstance(obj, list):
        return [_strip_secrets(v) for v in obj]
    return obj


def op_probe_driver(payload: dict) -> dict:
    """Probe a driver's availability. Returns {available, context_tokens?,
    model_families?} on success; raises typed reason on failure."""
    driver_name = payload.get("driver_name", "")
    driver_params = payload.get("driver_params", {})
    _ = _strip_secrets(driver_params)  # (audit only — actual params come from caller)

    if driver_name == "deterministic":
        return {"available": True, "context_tokens": None, "model_families": ["deterministic"]}

    if driver_name.startswith("ollama:"):
        model = driver_name.split(":", 1)[1]
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
            return {"__error__": True, "reason": "model_missing", "detail": f"HTTP {e.code}"}
        except (urllib.error.URLError, TimeoutError, ConnectionRefusedError) as e:
            return {"__error__": True, "reason": "not_installed", "detail": f"{type(e).__name__}"}

    if driver_name in ("claude", "gemini"):
        import subprocess
        try:
            r = subprocess.run(  # noqa: S603
                [driver_name, "--version"], capture_output=True, timeout=5, text=True,
            )
            if r.returncode == 0:
                return {"available": True, "model_families": [driver_name]}
            return {"__error__": True, "reason": "not_installed", "detail": f"returncode {r.returncode}"}
        except FileNotFoundError:
            return {"__error__": True, "reason": "not_installed", "detail": "binary not on PATH"}
        except subprocess.TimeoutExpired:
            return {"__error__": True, "reason": "timeout", "detail": "cli --version exceeded 5s"}

    return {"__error__": True, "reason": "not_installed", "detail": f"unknown driver kind: {driver_name}"}


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


def op_session_resume(payload: dict) -> dict:
    """Attach to an existing session — read the manifest, return the fields
    the shell needs to bind the pane. Raises typed reason on failure."""
    from substrate.session_registry import SessionStatus  # type: ignore[import-not-found]
    reg = _registry()
    session_id = payload.get("session_id", "")
    manifest = reg.get(session_id)  # type: ignore[attr-defined]
    if manifest is None:
        return {"__error__": True, "reason": "not_found"}
    if manifest.status == SessionStatus.ENDED:
        return {"__error__": True, "reason": "session_ended"}
    # A fresh session (no turns run yet) has no record_root on disk — that is not
    # a tear, that is fresh. Real torn-record detection lives in Sprint 013.
    from substrate import api  # type: ignore[import-not-found]
    last_turn_index = -1
    try:
        rec_root = Path(manifest.record_root)
        if rec_root.exists():
            for env in api.read_record(rec_root):
                pl = env.get("payload") or {}
                if env.get("kind") == "UserMessage" and isinstance(pl, dict) and "turn_index" in pl:
                    last_turn_index = max(last_turn_index, int(pl["turn_index"]))
    except Exception:  # noqa: BLE001
        pass
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


_VISIBLE_KINDS = frozenset({
    "UserMessage", "ModelReply", "Park", "SessionEnded", "SessionWarning",
    "PromptFragment", "TranscriptCompacted", "RateLimitedWaiting",
    "ToolCall", "ToolResult",
    "ProducerFailed", "PredicateQuarantined", "ProducerEmittedInvalidEvent",
})


def op_record_read(payload: dict) -> dict:
    """Return the ordered envelopes for a session's record. Only envelopes
    whose `kind` names a user-visible beat come back; framework brackets
    (RunStarted, ProducerStarted, TriggerFired, etc.) are elided."""
    from substrate import api  # type: ignore[import-not-found]
    reg = _registry()
    session_id = payload.get("session_id", "")
    manifest = reg.get(session_id)  # type: ignore[attr-defined]
    if manifest is None:
        return {"__error__": True, "reason": "not_found"}
    root = Path(manifest.record_root)
    out = []
    try:
        for env in api.read_record(root):
            kind = env.get("kind", "")
            if kind not in _VISIBLE_KINDS:
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
            if kind == "UserMessage":
                summary = str(pl.get("assembled_prompt", ""))[:200]
            elif kind == "ModelReply":
                summary = str(pl.get("text", ""))[:200]
            elif kind == "Park":
                # Propagate substrate's ParkReason enum verbatim (final_answer /
                # model_error / interrupt) rather than fuzzy-match on prose.
                park_reason = pl.get("reason") if isinstance(pl, dict) else None
                summary = str(park_reason or "")
            elif kind == "SessionEnded":
                end_reason = pl.get("reason") if isinstance(pl, dict) else None
                summary = str(end_reason or "")
            elif kind == "TranscriptCompacted":
                tokens_before = pl.get("tokens_before") if isinstance(pl, dict) else None
                tokens_after = pl.get("tokens_after") if isinstance(pl, dict) else None
                compact_strategy = pl.get("strategy") if isinstance(pl, dict) else None
                summary = f"{tokens_before}→{tokens_after} via {compact_strategy}"
            elif kind == "RateLimitedWaiting":
                retry_index = pl.get("retry_index") if isinstance(pl, dict) else None
                retry_max = pl.get("retry_max") if isinstance(pl, dict) else None
                retry_after_seconds = pl.get("retry_after_seconds") if isinstance(pl, dict) else None
                summary = f"retry {retry_index}/{retry_max} in {retry_after_seconds}s"
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
            })
    except Exception as e:  # noqa: BLE001
        return {"__error__": True, "reason": f"read_error:{e}"}
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
        return {"__error__": True, "reason": "not_found"}

    # Queue-cap check per session_registry.py:878-888.
    admitted, cap = reg.try_enqueue_turn(session_id)  # type: ignore[attr-defined]
    if not admitted:
        return {"__error__": True, "reason": "queue_full", "cap": cap}

    # Harness-only stall: when HARNESS_TURN_SLEEP_MS is set, hold the admitted
    # slot for the named duration BEFORE turn_sync. Lets the queue-cap test drive
    # five concurrent op_turn_submit calls whose try_enqueue_turns all race to
    # increment depth before any dequeue fires. Deterministic turns finish in a
    # few ms; without this stall the fifth call always slots into a freshly-
    # dequeued slot and admits.
    _sleep_ms = int(os.environ.get("HARNESS_TURN_SLEEP_MS", "0"))
    if _sleep_ms > 0:
        time.sleep(_sleep_ms / 1000.0)

    def _turn_event_builder(m, root):  # noqa: ANN001, ANN202
        from substrate import api  # type: ignore[import-not-found]
        max_ti = -1
        try:
            for env in api.read_record(root):
                pl = env.get("payload") or {}
                if env.get("kind") == "UserMessage" and "turn_index" in pl:
                    max_ti = max(max_ti, int(pl["turn_index"]))
        except Exception:  # noqa: BLE001
            max_ti = -1
        return UserMessage(
            text=text, turn_index=max_ti + 1,
            assembled_prompt=text, slash_source=None,
        )

    try:
        final_manifest, _root = reg.turn_sync(  # type: ignore[attr-defined]
            session_id, resume_event_builder=_turn_event_builder,
            timeout_seconds=timeout_seconds,
        )
    except SessionEndedMidTurn as e:
        return {"__error__": True, "reason": "session_ended", "detail": str(e)}
    except FreshSessionRequiresUserMessage as e:
        return {"__error__": True, "reason": "fresh_session_requires_user_message", "detail": str(e)}
    except TornRecordOnResume as e:
        return {"__error__": True, "reason": "torn_record_on_resume", "detail": str(e)}
    except TimeoutError as e:
        return {"__error__": True, "reason": "timeout", "detail": str(e)}
    except (RuntimeError, KeyError, ValueError) as e:
        return {"__error__": True, "reason": "registry_error", "detail": str(e)}
    finally:
        reg.dequeue_turn(session_id)  # type: ignore[attr-defined]

    # Scan the record tail for the highest turn_index (the one this call just wrote).
    from substrate import api  # type: ignore[import-not-found]
    max_ti = -1
    try:
        from pathlib import Path as _Path
        for env in api.read_record(_Path(final_manifest.record_root)):
            pl = env.get("payload") or {}
            if env.get("kind") == "UserMessage" and "turn_index" in pl:
                max_ti = max(max_ti, int(pl["turn_index"]))
    except Exception:  # noqa: BLE001
        pass
    return {"session_id": session_id, "turn_index": max_ti}


def op_session_end(payload: dict) -> dict:
    """Fire an /exit turn through the injected topology factory. Returns
    {end_reason, record_finalised, envelope_seq} where envelope_seq is the
    record position of the SessionEnded envelope (or -1 if not found)."""
    from substrate.session_registry import SessionEndedMidTurn, SessionStatus  # type: ignore[import-not-found]
    from substrate.topologies.session import UserMessage, END_ON_EXIT_SENTINEL  # type: ignore[import-not-found]
    from substrate import api  # type: ignore[import-not-found]
    reg = _registry()
    session_id = payload.get("session_id", "")
    manifest = reg.get(session_id)  # type: ignore[attr-defined]
    if manifest is None:
        return {"__error__": True, "reason": "not_found"}
    if manifest.status == SessionStatus.ENDED:
        return {"__error__": True, "reason": "session_already_ended"}

    def _end_event_builder(m, root):  # noqa: ANN001, ANN202
        max_ti = -1
        try:
            for env in api.read_record(root):
                pl = env.get("payload") or {}
                if env.get("kind") == "UserMessage" and "turn_index" in pl:
                    max_ti = max(max_ti, int(pl["turn_index"]))
        except Exception:  # noqa: BLE001
            max_ti = -1
        next_ti = max_ti + 1
        return UserMessage(
            text=END_ON_EXIT_SENTINEL, turn_index=next_ti,
            assembled_prompt=END_ON_EXIT_SENTINEL, slash_source="menu:end",
        )

    try:
        final_manifest, record_root = reg.turn_sync(  # type: ignore[attr-defined]
            session_id, resume_event_builder=_end_event_builder, timeout_seconds=30.0,
        )
    except SessionEndedMidTurn as e:
        return {"__error__": True, "reason": "session_ended", "detail": str(e)}
    except (RuntimeError, KeyError, ValueError) as e:
        return {"__error__": True, "reason": "registry_error", "detail": str(e)}

    # Scan the record for the SessionEnded envelope's seq.
    envelope_seq = -1
    end_reason = "user_end"
    try:
        for env in api.read_record(record_root):
            if env.get("kind") == "SessionEnded":
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
        out.append({
            "path": p,
            "shape": s,
            "last_used": row.get("last_used"),
        })
    return out


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
        op = msg.get("op")
        rid = msg.get("request_id") or msg.get("id")

        if op == "ping":
            emit({"op": "pong", "request_id": rid, "t": int(time.time() * 1000)})
        elif op == "read_recent_workspaces":
            try:
                reply_ok(rid, op_read_recent_workspaces())
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
        elif op == "list_sessions":
            try:
                reply_ok(rid, op_list_sessions())
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
        elif op == "session_resume":
            try:
                result = op_session_resume(msg)
                if result.get("__error__"):
                    reply_err(rid, result.get("reason", "registry_error"))
                else:
                    reply_ok(rid, result)
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
        elif op == "probe_driver":
            try:
                result = op_probe_driver(msg)
                if result.get("__error__"):
                    reply_err(rid, result.get("reason", "not_installed"))
                else:
                    reply_ok(rid, result)
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
        elif op == "record_read":
            try:
                result = op_record_read(msg)
                if result.get("__error__"):
                    reply_err(rid, result.get("reason", "read_error"))
                else:
                    reply_ok(rid, result)
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
        elif op == "turn_submit":
            _long_op(rid, op_turn_submit, msg)
        elif op == "session_end":
            _long_op(rid, op_session_end, msg)
        elif op == "session_create":
            try:
                result = op_session_create(msg)
                if result.get("__error__"):
                    reply_err(rid, result.get("reason", "registry_error"))
                else:
                    reply_ok(rid, result)
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
        else:
            reply_err(rid, f"unknown_op:{op}")
    return 0


if __name__ == "__main__":
    _ = os  # reserved for later use
    sys.exit(main())
