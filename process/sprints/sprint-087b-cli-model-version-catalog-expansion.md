# Sprint 087b — CLI model-version catalog expansion

```yaml
---
id: 087b
status: pending
opened_at: 2026-09-27
opened_by: agent
phase: 9-followup
pass_kind: catalog
---
```

## scope

Sprint 087 landed the caret + version picker with a short curated
list per CLI. Peter live-inspected and asked for two changes:

1. The list is too shallow. For every CLI whose API exposes
   pinned versions per model family, the picker must carry every
   supported version from oldest to newest, not just the family
   alias. Anthropic lets a caller pin `claude-opus-4-5-20250929`,
   `claude-opus-4-1-20250805`, `claude-opus-4-20250514`, and so
   on; the `claude` CLI accepts each. Codex and cursor-agent are
   the same shape wherever their API exposes dated pins.
2. The default is wrong. Latest Opus is the strongest Claude for
   coding; that must be the default when the CLI is picked.
   Verify the defaults for codex and cursor-agent against the
   same criterion (strongest supported model at pick time).

## work

1. Pull every pinned model id per family from each CLI's own
   API. For Claude, `GET https://api.anthropic.com/v1/models`
   with the current key returns the exhaustive supported list.
   Codex and cursor-agent expose comparable list endpoints; take
   what's there and drop what isn't.
2. Restructure `KNOWN_CLI_ADAPTERS[<cli>].versions` into two
   dimensions — family (opus, sonnet, haiku, gpt-5, ...) and
   pinned id under each family. UI groups by family in the
   expand; latest of each family is first.
3. Set `default_version` per CLI to the latest pin of the
   strongest family:
   - claude → latest Opus pin.
   - codex → strongest gpt-5 pin (codex-specific if there is one).
   - cursor-agent → strongest coding pin (sonnet-4-thinking or
     the current successor).
4. `_daemon_driver_resolver` unchanged — it already threads
   `params.driver_version` through.
5. `_build_driver_opts` renders the family label as a nested
   subheader when the expanded row has more than one family.

## verification

- Each pinned id passes the CLI's own `--model` check without
  error (dry-run: `claude -p --model <id> ''` returns a
  well-formed error, not "unknown model").
- The `default_version` field, when the client sends no explicit
  pick, produces the strongest pin per the criterion above.
- cli_discovery smoke opens one session per (CLI, family latest)
  pair; all get non-empty ModelReply.

## non-work

- No new CLIs. Catalog expansion for the existing three.
- No client caching layer for the models endpoint. One call at
  server startup, refresh on SIGHUP later if it matters.
