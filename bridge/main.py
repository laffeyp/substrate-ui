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
import time
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


def emit(msg: dict) -> None:
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


def reply_ok(rid: str, result: object) -> None:
    emit({"op": "reply", "request_id": rid, "ok": True, "result": result})


def reply_err(rid: str, reason: str) -> None:
    emit({"op": "reply", "request_id": rid, "ok": False, "reason": reason})


_REGISTRY_CACHE: object | None = None


def _build_session_topology_from_manifest(manifest, first_turn_user_message):  # noqa: ANN001, ANN202
    """Factory closure passed to SessionRegistry at construction. Rebuilds a
    session_topology bound to the manifest each time turn_sync fires. The
    deterministic driver runs every session for Sprint 010's purposes —
    Ollama and CLI drivers wire in at later sprints when the shell owns a
    Responder-per-manifest resolver.
    """
    from substrate.topologies.session import session_topology
    from substrate.adapters import DeterministicResponder
    from pathlib import Path as _Path
    return session_topology(
        driver=DeterministicResponder(seed=0),
        driver_name=manifest.driver,
        driver_context_tokens=4096,
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
    return {
        "session_id": manifest.session_id,
        "session_name": manifest.name,
        "workspace_path": manifest.workspace,
        "workspace_shape": manifest.workspace_shape,
        "driver": manifest.driver,
        "status": str(manifest.status),
        "record_root": manifest.record_root,
        "last_turn_index": 0,  # Sprint 014 wires the real value via record scan.
    }


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
        elif op == "session_end":
            try:
                result = op_session_end(msg)
                if result.get("__error__"):
                    reply_err(rid, result.get("reason", "registry_error"))
                else:
                    reply_ok(rid, result)
            except Exception as e:  # noqa: BLE001
                reply_err(rid, f"registry_error:{e}")
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
