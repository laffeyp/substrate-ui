// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// First run's driver rows (sprint 219; plan PLAN-2026-11-04-shell-to-react-r5.md, B2).
//
// One row per driver in the controller's roster, in four groups: local ollama models, ollama cloud
// models (a `:cloud` suffix), CLIs, then the built-in deterministic driver, which is always last. The
// CLIs are the snapshot's "cli agents" driver group, the server's `cli` list of CLIs found on PATH
// (`cliAgents` below); the dc-runtime template (`web/reveal.html` at `d4322e1`) read a `cli` field no
// snapshot has and fell back to a fixed pair.

export interface FirstRunRow {
  name: string;
  meta: string;
  driver: string;
  /** The server's default driver: drawn bright, on a fill, with ↵. */
  preselected: boolean;
}

export function firstRunRows(roster: readonly string[], defaultDriver: string | null, clis: readonly string[]): FirstRunRow[] {
  const isCloud = (m: string) => /:cloud$/.test(m);
  const isCli = (m: string) => clis.includes(m);
  const rows: FirstRunRow[] = [];
  const add = (name: string, meta: string, driver: string) => rows.push({ name, meta, driver, preselected: driver === defaultDriver });
  for (const m of roster.filter((x) => !isCloud(x) && !isCli(x) && x !== "deterministic")) {
    add("ollama · " + m, "localhost:11434 · installed" + (m === defaultDriver ? " · preselected" : ""), m);
  }
  for (const m of roster.filter(isCloud)) add("ollama·cloud · " + m, (m === defaultDriver ? "default · " : "") + "cloud model", m);
  for (const m of roster.filter(isCli)) add(m + " (cli)", "found on PATH", m);
  add("deterministic", "built in · replay-stable · no network", "deterministic");
  return rows;
}

/** The CLIs the server found: the entries of the "cli agents" driver group. */
export function cliAgents(groups: readonly { label: string; entries: string[] }[]): string[] {
  return groups.find((grp) => grp.label === "cli agents")?.entries ?? [];
}
