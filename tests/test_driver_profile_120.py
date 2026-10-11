"""UI sprint 120: the Claude driver profile, and the attribution and e-mail gate.

Substrate never writes model attribution and never handles an e-mail address. A harness driver
runs with its own setup switched off: for `claude`, its tools, MCP servers and settings sources
(CLAUDE.md, hooks, output style, memory), and its git instructions, where its attribution trailer
lives.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest
from substrate import api
from substrate.adapters import CliResponder

import server

ROOT = Path(__file__).resolve().parents[1]
KERNEL = ROOT.parent / "substrate" / "src" / "substrate"
_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_ATTRIBUTION = re.compile(r"co-authored-by|generated with|noreply@anthropic|noreply@openai", re.I)


def _sources() -> list[Path]:
    files = [p for p in KERNEL.rglob("*") if p.suffix in {".py", ".md", ".toml"}]
    files.append(ROOT / "server.py")
    for sub in ("web/vm", "web/reveal"):
        files += [p for p in (ROOT / sub).rglob("*.ts")]
    return [p for p in files if p.is_file() and "/records/" not in str(p)]


# The one passage allowed to name the forbidden strings is the rule that forbids them: the copied
# CLAUDE.md section in the default guidance (kernel K275), from its heading to the next heading.
_BAN = "# No Claude attribution in git, ever"


def _without_the_ban(text: str) -> str:
    if _BAN not in text:
        return text
    start = text.index(_BAN)
    end = text.find("\n# ", start + len(_BAN))
    return text[:start] + (text[end:] if end != -1 else "")


def test_no_email_or_attribution_in_substrate_code_or_texts() -> None:
    hits = []
    for path in _sources():
        text = _without_the_ban(path.read_text(encoding="utf-8", errors="replace"))
        for pattern in (_EMAIL, _ATTRIBUTION):
            for m in pattern.finditer(text):
                hits.append(f"{path.relative_to(ROOT.parent)}: {m.group(0)}")
    # This file names the patterns it looks for; it lives under tests/ and is not scanned.
    assert hits == []


def test_the_claude_profile_switches_off_its_own_setup() -> None:
    entry = server.KNOWN_CLI_ADAPTERS["claude"]
    flags = entry["isolation_flags"]
    assert flags == ["--tools", "", "--strict-mcp-config", "--setting-sources", ""]
    assert entry["system_flag"] == ["--system-prompt"]
    assert entry["env"] == {"CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS": "1"}
    assert "--disable-slash-commands" not in flags  # it blocks `/context` (UI sprint 123)


def test_the_daemon_builds_claude_with_the_profile(app: server.App) -> None:
    responder = server._daemon_driver_resolver(app, "claude", workspace="/tmp")
    assert isinstance(responder, CliResponder)
    assert responder.command[:2] == ("claude", "-p")
    assert responder.command[2:7] == ("--tools", "", "--strict-mcp-config", "--setting-sources", "")
    assert responder.system_channel
    assert responder._argv("P", "")[-3:] == ["--system-prompt", "", "P"]


def test_the_daemon_builds_codex_to_run_outside_a_git_repo(app: server.App) -> None:
    """A per-session sandbox is a plain directory. `codex exec` without --skip-git-repo-check
    exits 1 there: "Not inside a trusted directory" (found 2026-10-10 in the installed app)."""
    responder = server._daemon_driver_resolver(app, "codex", workspace="/tmp")
    assert isinstance(responder, CliResponder)
    assert responder.command[:3] == ("codex", "exec", "--skip-git-repo-check")


@pytest.mark.skipif(
    os.environ.get("SUBSTRATE_LIVE_DRIVER_TESTS") != "1" or shutil.which("codex") is None,
    reason="a real Codex turn; run on demand with SUBSTRATE_LIVE_DRIVER_TESTS=1",
)
def test_codex_answers_in_a_plain_directory(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import pwd

    monkeypatch.setenv("HOME", pwd.getpwuid(os.getuid()).pw_dir)  # the real Codex login
    responder = server._daemon_driver_resolver(app, "codex", workspace=str(tmp_path))
    assert "ready" in responder.respond("Reply with the single word: ready").lower()


_live = pytest.mark.skipif(shutil.which("claude") is None, reason="claude CLI not installed")


@_live
def test_claude_through_the_profile_loads_nothing_from_this_machine(app: server.App) -> None:
    """`/context` runs locally (no model turn). Through the profile it lists no memory files,
    skills, MCP tools, custom agents or system prompt; measured 2026-10-10, the whole context is
    0 to 21 tokens."""
    responder = server._daemon_driver_resolver(app, "claude", workspace="/tmp")
    argv = responder._argv("/context", "")
    argv[-1:-1] = ["--output-format", "json"]  # the prompt stays last
    out = subprocess.run(argv, capture_output=True, text=True, timeout=120, cwd="/tmp")
    report = json.loads(out.stdout)["result"]
    for absent in ("Memory files", "Skills", "MCP tools", "Custom agents", "System prompt"):
        assert absent not in report, report
    tokens = re.search(r"\*\*Tokens:\*\* ([0-9.]+)(k?) /", report)
    assert tokens is not None and tokens.group(2) == "" and float(tokens.group(1)) < 100, report


@pytest.mark.skipif(
    os.environ.get("SUBSTRATE_LIVE_DRIVER_TESTS") != "1",
    reason="a real Claude turn and commit; run on demand with SUBSTRATE_LIVE_DRIVER_TESTS=1",
)
@_live
def test_a_commit_through_the_claude_driver_has_no_trailer(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A real Claude turn through Substrate commits in a scratch repo with the `bash` tool; the
    commit message carries no attribution. The suite's conftest gives every test a temp HOME, where
    `claude` is logged out; this test runs on the operator's real login."""
    import pwd

    from _serving import call, serving

    monkeypatch.setenv("HOME", pwd.getpwuid(os.getuid()).pw_dir)

    ws = tmp_path / "repo"
    ws.mkdir()
    for cmd in (
        ["git", "init", "-q"],
        ["git", "config", "user.name", "probe"],
        ["git", "config", "user.email", "probe@localhost.invalid"],
    ):
        subprocess.run(cmd, cwd=ws, check=True)
    (ws / "a.txt").write_text("a\n", encoding="utf-8")
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST",
            base + "/api/session",
            {"driver": "claude", "workspace": str(ws), "bundle": "harness"},
        )
        assert status == 200, body
        sid = body["session_id"]
        status, body = call(
            "POST",
            base + f"/api/session/{sid}/turn",
            {
                "text": "Stage a.txt and commit it, with a one-line message you choose. Then say done."
            },
            timeout=300,
        )
        assert status == 200, body
        record = Path(app.registry.get(sid).record_root)
    started = next(e for e in api.read_record(record) if e["kind"] == "SessionStarted")
    assert started["payload"]["driver_command"][:7] == [
        "claude",
        "-p",
        "--tools",
        "",
        "--strict-mcp-config",
        "--setting-sources",
        "",
    ]
    log = subprocess.run(
        ["git", "log", "--format=%B"], cwd=ws, capture_output=True, text=True, check=True
    ).stdout
    assert log.strip(), "no commit was made"
    assert not _ATTRIBUTION.search(log), log
