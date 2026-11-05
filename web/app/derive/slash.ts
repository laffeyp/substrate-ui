// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The input bar's slash menu, its hint and Tab completion (sprint 258; plan
// PLAN-2026-11-04-shell-to-react-r5.md, C1). Moved from reveal_component.ts (UI sprints 162–166) as
// functions of the bar's text and the pane controller's `slashCatalog()`, the table `submitLine` runs
// and `/help` prints.

import type { SlashCatalogEntry } from "../../vm/session_controller";

/** A pick sends the line, or, for a command that takes free text, fills the bar with it. */
export type SlashAction = { send: string } | { fill: string };

export interface SlashRow {
  cmd: string;
  desc: string;
  /** The command's current choice. */
  current: boolean;
  /** A row of a command's choices, which the keys walk (UI sprint 164). */
  choice: boolean;
  action: SlashAction;
}

/** The menu over the bar: a command's choices once its name and a space are typed, else the commands
 *  the text starts; one matching command closes the menu (its hint shows instead). */
export function slashRows(raw: string, catalog: readonly SlashCatalogEntry[], notes: Readonly<Record<string, Readonly<Record<string, string>>>>): SlashRow[] {
  if (!raw.startsWith("/") || raw.includes("\n")) return [];
  const named = raw.match(/^\/(\S+)\s+(\S*)$/);
  if (named) {
    const word = named[1].toLowerCase();
    const cmd = catalog.find((e) => e.name === word || e.aliases.includes(word));
    if (!cmd || !cmd.choices) return [];
    const mine = notes[cmd.name] ?? {};
    return cmd.choices.filter((ch) => ch.startsWith(named[2].toLowerCase())).map((ch) => ({
      cmd: "/" + cmd.name + " " + ch,
      desc: [mine[ch], ch === cmd.current ? "current" : ""].filter(Boolean).join(" · "),
      current: ch === cmd.current,
      choice: true,
      action: { send: "/" + cmd.name + " " + ch },
    }));
  }
  const q = raw.trim().toLowerCase();
  const matches = catalog.filter((c) => ("/" + c.name).startsWith(q));
  if (matches.length === 1 && q.length > 1) return [];
  return matches.map((c) => ({
    cmd: "/" + c.name,
    desc: c.usage === "/" + c.name ? c.about : c.usage.slice(c.name.length + 2) + " · " + c.about,
    current: false,
    choice: false,
    action: c.usage === "/" + c.name ? { send: "/" + c.name } : { fill: "/" + c.name + " " },
  }));
}

/** The hint for the one command the text names: its argument part and description, never its name,
 *  in one column (in ch) right of the longest command with its longest choice, so typing never moves
 *  it; text that reaches the column hides it. */
export function slashHint(raw: string, catalog: readonly SlashCatalogEntry[]): { text: string; left: string } | null {
  if (!raw.startsWith("/") || raw.includes("\n")) return null;
  const col = Math.max(0, ...catalog.map((c) => c.name.length + 1 + (c.choices ? 1 + Math.max(...c.choices.map((ch) => ch.length)) : 0))) + 3;
  const named = raw.match(/^\/(\S+)\s/);
  const word = named ? named[1].toLowerCase() : raw.slice(1).toLowerCase();
  const matches = named ? catalog.filter((c) => c.name === word || c.aliases.includes(word)) : catalog.filter((c) => c.name.startsWith(word));
  if (matches.length !== 1 || raw.length >= col) return null;
  const c = matches[0];
  const args = c.usage.slice(c.name.length + 2);
  return { text: args ? args + " · " + c.about : c.about, left: col + "ch" };
}

/** Tab on "/<part>": one match becomes "/<name> "; several complete to their longest common prefix;
 *  null when the text stays as it is. */
export function tabComplete(raw: string, catalog: readonly SlashCatalogEntry[]): string | null {
  if (!/^\/\S*$/.test(raw)) return null;
  const typed = raw.slice(1).toLowerCase();
  const names = catalog.map((c) => c.name).filter((n) => n.startsWith(typed));
  if (names.length === 1) return "/" + names[0] + " ";
  if (names.length > 1) {
    let common = names[0];
    for (const n of names) while (!n.startsWith(common)) common = common.slice(0, -1);
    if (common.length > typed.length) return "/" + common;
  }
  return null;
}
