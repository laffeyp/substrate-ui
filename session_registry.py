"""Session registry — the daemon-side name index + manifest catalog (sprint 211).

Piece C per TECH-SPEC-2026-08-25-round6 §5. Named standing sessions are the
daily-driver's identity: `substrate chat --name reviewer` opens a persistent
record under `~/.substrate/sessions/<session_id>/`, and every later resume
finds it by the same name. The registry:

  - **In-memory** name → session_id + per-session `asyncio.Lock` map + the
    manifest for every session on disk.
  - **Persistent** name index at `~/.substrate/sessions/by-name.json`. Atomic
    writes under `fcntl.flock` on the file itself so a second creator with a
    colliding name gets a 409 shape, never a corrupted index.
  - **Per-session manifest** at `~/.substrate/sessions/<session_id>/manifest.json`,
    rewritten on every state change. The record is the source of truth; the
    manifest is a hint the boot scan reads to rebuild the in-memory catalog.
  - **Boot scan** walks `~/.substrate/sessions/*/`, checks each record's status
    via `api.recover_open_segment` (hot segment → `interrupted`) and read_record
    (RunFinalised present → `ended`; otherwise → `parked`), and rewrites the
    manifest status field to match reality.

Canonical home registry (WORKING_AGREEMENT.md) lists:
  - Session manifest: `~/.substrate/sessions/<session_id>/manifest.json`
  - Name → session_id index: `~/.substrate/sessions/by-name.json`
  - Session registry (in-memory): this module.

Everything material rides the record. The manifest is recoverable from the
record's `substrate.RunStarted` payload alone (`runtime.py:_manifest:452-532`);
this module keeps it as a hint so a daemon boot does not need to open every
record's writer just to enumerate what exists.
"""

from __future__ import annotations

import asyncio
import fcntl
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Literal

from msgspec import Struct

from substrate import api

SessionStatus = Literal["running", "parked", "interrupted", "ended"]

_SESSIONS_BASE_DEFAULT = Path.home() / ".substrate" / "sessions"
_BY_NAME_FILENAME = "by-name.json"
_BY_NAME_LOCK_FILENAME = ".by-name.lock"
_MANIFEST_FILENAME = "manifest.json"


class SessionManifest(Struct, frozen=True):
    """The on-disk hint the boot scan reads to rebuild the in-memory registry.

    Fields match TECH-SPEC-2026-08-25-round6 §5. `status` is one of `running`
    (a daemon has a live Runtime on the record), `parked` (the record is at
    pause_await_input awaiting the next UserMessage), `interrupted` (the
    record has a torn hot segment — the daemon died mid-turn), `ended` (the
    record has a RunFinalised envelope).
    """

    session_id: str
    name: str | None
    created_at: float
    driver: str
    workspace: str
    workspace_shape: str
    record_root: str
    status: SessionStatus
    bundle: str | None
    seed: str


class NameCollision(Exception):
    """Raised when a create hits an existing name in the by-name.json index.

    Carries the existing session_id so the caller can shape a 409 response.
    """

    def __init__(self, name: str, existing_session_id: str) -> None:
        super().__init__(f"session name {name!r} already taken by {existing_session_id!r}")
        self.name = name
        self.existing_session_id = existing_session_id


def _atomic_write_json(path: Path, data: Any) -> None:
    """Write `data` to `path` atomically: write to a temp file in the same dir,
    fsync it, then rename. Rename-in-same-fs is atomic on POSIX; a crash mid-write
    leaves `path` at its prior good state or absent, never partially written.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_str = tempfile.mkstemp(prefix=".tmp.", dir=str(path.parent))
    tmp = Path(tmp_str)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fp:
            json.dump(data, fp, indent=2, sort_keys=True)
            fp.flush()
            os.fsync(fp.fileno())
        tmp.replace(path)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise


class SessionRegistry:
    """The daemon's in-memory session catalog + persistent name index.

    Owns three pieces of state:
      - `_by_name`: dict[str, str] mirroring `~/.substrate/sessions/by-name.json`.
      - `_manifests`: dict[str, SessionManifest] keyed by session_id.
      - `_locks`: dict[str, asyncio.Lock] — one lock per session for turn
        serialization (per product spec §6 "one turn at a time per session_id").

    Not thread-safe in the general sense; the daemon runs one event loop, and
    the process-level lock lives at `~/.substrate/daemon.pid`. `fcntl.flock`
    on `by-name.json` protects against corruption from ANY writer, including a
    stray script or a second daemon that snuck past the pidfile guard.
    """

    def __init__(self, base: Path | None = None) -> None:
        self._base = Path(base) if base is not None else _SESSIONS_BASE_DEFAULT
        self._by_name: dict[str, str] = {}
        self._manifests: dict[str, SessionManifest] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._base.mkdir(parents=True, exist_ok=True)

    # ── boot scan ──────────────────────────────────────────────────────────

    def boot_scan(self) -> None:
        """Rebuild the in-memory registry from disk. Called once at daemon start.

        Reads `by-name.json` under a shared flock (concurrent readers OK). Walks
        every `<session_id>/` under `base` and, for each manifest present,
        checks the record's true status: `api.recover_open_segment` returning
        non-None means the hot segment was torn (the daemon died mid-turn) →
        `interrupted`; `substrate.RunFinalised` present in the record →
        `ended`; otherwise the record is quiescent → `parked`.

        Rewrites each manifest whose on-disk status disagrees with reality.
        """
        self._by_name = self._read_by_name_index()
        for session_dir in sorted(self._base.iterdir()):
            if not session_dir.is_dir():
                continue
            if session_dir.name == "wt":  # git-worktree subtree; not a session
                continue
            manifest_path = session_dir / _MANIFEST_FILENAME
            if not manifest_path.exists():
                continue
            try:
                raw = json.loads(manifest_path.read_text(encoding="utf-8"))
                manifest = _manifest_from_dict(raw)
            except (OSError, json.JSONDecodeError, KeyError, TypeError):
                continue
            true_status = _scan_record_status(Path(manifest.record_root))
            if true_status != manifest.status:
                manifest = _replace(manifest, status=true_status)
                _atomic_write_json(manifest_path, _manifest_to_dict(manifest))
            self._manifests[manifest.session_id] = manifest
        # Prune stale by-name entries whose manifests dropped off disk.
        self._by_name = {
            name: sid for name, sid in self._by_name.items() if sid in self._manifests
        }
        self._write_by_name_index()

    # ── create / rename ────────────────────────────────────────────────────

    def create(
        self,
        *,
        session_id: str,
        name: str | None,
        driver: str,
        workspace: str,
        workspace_shape: str,
        bundle: str | None,
        seed: str,
        created_at: float | None = None,
    ) -> SessionManifest:
        """Register a new session. Atomic against by-name.json under `fcntl.flock`.

        If `name` is set and already in the index, raises `NameCollision` with
        the existing session_id. The caller shapes the 409 response.
        """
        manifest = SessionManifest(
            session_id=session_id,
            name=name,
            created_at=created_at if created_at is not None else time.time(),
            driver=driver,
            workspace=workspace,
            workspace_shape=workspace_shape,
            record_root=str(self._base / session_id / "record"),
            status="running",
            bundle=bundle,
            seed=seed,
        )
        if name is not None:
            with _flocked(self._base / _BY_NAME_FILENAME) as index:
                if name in index and index[name] != session_id:
                    raise NameCollision(name=name, existing_session_id=index[name])
                index[name] = session_id
                self._by_name = dict(index)
        session_dir = self._base / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        _atomic_write_json(session_dir / _MANIFEST_FILENAME, _manifest_to_dict(manifest))
        self._manifests[session_id] = manifest
        return manifest

    def set_name(self, session_id: str, name: str) -> SessionManifest:
        """Rename a session. Atomic against by-name.json. Raises `NameCollision`
        if the name is already in use by a different session.
        """
        if session_id not in self._manifests:
            raise KeyError(f"unknown session_id {session_id!r}")
        with _flocked(self._base / _BY_NAME_FILENAME) as index:
            if name in index and index[name] != session_id:
                raise NameCollision(name=name, existing_session_id=index[name])
            manifest = self._manifests[session_id]
            if manifest.name is not None and manifest.name in index:
                del index[manifest.name]
            index[name] = session_id
            self._by_name = dict(index)
        updated = _replace(manifest, name=name)
        _atomic_write_json(
            self._base / session_id / _MANIFEST_FILENAME, _manifest_to_dict(updated)
        )
        self._manifests[session_id] = updated
        return updated

    # ── lookups ────────────────────────────────────────────────────────────

    def by_name(self, name: str) -> str | None:
        return self._by_name.get(name)

    def get(self, session_id: str) -> SessionManifest | None:
        return self._manifests.get(session_id)

    def list_all(self) -> list[SessionManifest]:
        return list(self._manifests.values())

    def lock_for(self, session_id: str) -> asyncio.Lock:
        lock = self._locks.get(session_id)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[session_id] = lock
        return lock

    # ── status transitions ────────────────────────────────────────────────

    def update_status(self, session_id: str, status: SessionStatus) -> SessionManifest:
        manifest = self._manifests.get(session_id)
        if manifest is None:
            raise KeyError(f"unknown session_id {session_id!r}")
        updated = _replace(manifest, status=status)
        _atomic_write_json(
            self._base / session_id / _MANIFEST_FILENAME, _manifest_to_dict(updated)
        )
        self._manifests[session_id] = updated
        return updated

    # ── private ────────────────────────────────────────────────────────────

    def _read_by_name_index(self) -> dict[str, str]:
        path = self._base / _BY_NAME_FILENAME
        if not path.exists():
            return {}
        try:
            with path.open("r", encoding="utf-8") as fp:
                fcntl.flock(fp.fileno(), fcntl.LOCK_SH)
                try:
                    data = json.load(fp)
                finally:
                    fcntl.flock(fp.fileno(), fcntl.LOCK_UN)
        except (OSError, json.JSONDecodeError):
            return {}
        return {str(k): str(v) for k, v in data.items()} if isinstance(data, dict) else {}

    def _write_by_name_index(self) -> None:
        _atomic_write_json(self._base / _BY_NAME_FILENAME, dict(self._by_name))


# ── helpers ─────────────────────────────────────────────────────────────────


class _FlockedIndex:
    """Context manager: open the by-name index under an exclusive flock, hand
    the caller a mutable dict, write it back atomically on __exit__.

    The flock lives on a STABLE `.by-name.lock` sibling, not on `by-name.json`
    itself. `_atomic_write_json` writes to a tempfile then `os.replace`s it
    over `by-name.json` — the rename swaps inodes, so a flock on the JSON's fd
    is on the OLD inode and the next caller opens the NEW inode with no
    mutual exclusion. Locking a separate file that never gets replaced keeps
    concurrent writers serial. The read of `by-name.json` happens inside the
    critical section, after the flock is held.

    A second daemon (or any writer) trying to take the same exclusive lock
    blocks until this one releases. A crash inside the block leaves
    `by-name.json` at its prior good state (atomic write never partially
    landed) and the flock releases when the file descriptor closes.
    """

    def __init__(self, index_path: Path, lock_path: Path) -> None:
        self._index_path = index_path
        self._lock_path = lock_path
        self._index: dict[str, str] = {}
        self._lock_fp: Any = None

    def __enter__(self) -> dict[str, str]:
        self._lock_path.parent.mkdir(parents=True, exist_ok=True)
        # Touch the lock file if absent, then open for flock. The lock file
        # itself carries no content; only its inode's byte-range lock matters.
        self._lock_fp = self._lock_path.open("a", encoding="utf-8")
        fcntl.flock(self._lock_fp.fileno(), fcntl.LOCK_EX)
        # Under the exclusive lock, read the current index.
        if self._index_path.exists():
            try:
                with self._index_path.open("r", encoding="utf-8") as fp:
                    data = json.load(fp)
                if isinstance(data, dict):
                    self._index = {str(k): str(v) for k, v in data.items()}
            except (OSError, json.JSONDecodeError):
                self._index = {}
        return self._index

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        try:
            if exc is None:
                _atomic_write_json(self._index_path, dict(self._index))
        finally:
            fcntl.flock(self._lock_fp.fileno(), fcntl.LOCK_UN)
            self._lock_fp.close()


def _flocked(index_path: Path) -> _FlockedIndex:
    lock_path = index_path.parent / _BY_NAME_LOCK_FILENAME
    return _FlockedIndex(index_path=index_path, lock_path=lock_path)


def _scan_record_status(record_root: Path) -> SessionStatus:
    """Return the record's true status per §5.

    The boot scan runs while NO Runtime is live on the record — `running`
    never surfaces here. The discriminator is the last envelope:

      - record dir absent → `parked` (session created but never ran)
      - `read_record` raises (gap, torn seal, malformed frames) → `interrupted`
      - last envelope is `substrate.RunFinalised` → `ended`
      - last envelope is `substrate.TerminationMatched` with decision
        `pause-await-input` → `parked` (a clean session-topology pause)
      - anything else → `interrupted` (daemon died before either terminal
        landed; the record's tail is honest but the run is not resumable
        without a specific decision from the operator)

    `api.recover_open_segment` is deliberately NOT called here: it truncates a
    torn tail, which is a write operation the boot scan must not perform.
    """
    if not record_root.exists():
        return "parked"
    try:
        envelopes = list(api.read_record(record_root))
    except Exception:  # noqa: BLE001 — a corrupt record is a real state, not a crash
        return "interrupted"
    if not envelopes:
        return "interrupted"
    last = envelopes[-1]
    kind = last.get("kind", "")
    if kind == "substrate.RunFinalised":
        return "ended"
    if kind == "substrate.TerminationMatched":
        payload = last.get("payload") or {}
        if isinstance(payload, dict) and payload.get("decision") == "pause-await-input":
            return "parked"
    return "interrupted"


def _manifest_to_dict(m: SessionManifest) -> dict[str, Any]:
    return {
        "session_id": m.session_id,
        "name": m.name,
        "created_at": m.created_at,
        "driver": m.driver,
        "workspace": m.workspace,
        "workspace_shape": m.workspace_shape,
        "record_root": m.record_root,
        "status": m.status,
        "bundle": m.bundle,
        "seed": m.seed,
    }


def _manifest_from_dict(d: dict[str, Any]) -> SessionManifest:
    return SessionManifest(
        session_id=str(d["session_id"]),
        name=d.get("name") if d.get("name") is not None else None,
        created_at=float(d["created_at"]),
        driver=str(d["driver"]),
        workspace=str(d["workspace"]),
        workspace_shape=str(d["workspace_shape"]),
        record_root=str(d["record_root"]),
        status=str(d["status"]),  # type: ignore[arg-type]
        bundle=d.get("bundle") if d.get("bundle") is not None else None,
        seed=str(d["seed"]),
    )


def _replace(m: SessionManifest, **kwargs: Any) -> SessionManifest:
    """`msgspec.Struct` frozen instances have no built-in replace; build fresh."""
    data = _manifest_to_dict(m)
    data.update(kwargs)
    return _manifest_from_dict(data)


__all__ = [
    "NameCollision",
    "SessionManifest",
    "SessionRegistry",
    "SessionStatus",
]
