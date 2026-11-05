// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A driver's label and the pane picker's model column (sprint 280; plan
// PLAN-2026-11-04-shell-to-react-r5.md, C6). Moved from reveal_component.ts (`_resolveDriverLabel`,
// `_buildDriverOpts`; sprints 087b, 087c, UI sprint 124) as functions of the controller's roster and
// CLI version trees. A row's actions are data; the caller carries them out.

import type { Snapshot } from "../../vm/types";

type CliVersions = NonNullable<Snapshot["cliVersions"]>;

/** The model a driver runs, lowercase: a CLI with versions reads "<cli> <family> <pin>" for the pick
 *  (an explicit version, else the CLI's default family and its default pin); anything else reads as
 *  its name. */
export function driverLabel(driver: string | null, cliVersions: CliVersions | null, driverVersion: Readonly<Record<string, string | null>>): string {
  const base = String(driver || "").toLowerCase();
  if (!driver || !base) return base;
  const tree = (cliVersions || {})[driver];
  if (!tree || !Array.isArray(tree.families) || tree.families.length === 0) return base;
  const picked = driverVersion[driver] || tree.default_family;
  if (!picked) return base;
  for (const fam of tree.families) {
    if (fam.id === picked) {
      const pin = (fam.pins || []).find((p) => p.id === fam.default_pin);
      return [base, String(fam.label || "").toLowerCase(), pin ? String(pin.label || "").toLowerCase() : ""].filter(Boolean).join(" ");
    }
    const pin = (fam.pins || []).find((p) => p.id === picked);
    if (pin) return [base, String(fam.label || "").toLowerCase(), String(pin.label || "").toLowerCase()].filter(Boolean).join(" ");
  }
  return base;
}

/** On a CLI's own Auto mode the chip names the CLI only; the model card says why (UI sprint 139). */
export function chipLabel(driver: string | null, label: string): string {
  const d = String(driver || "").toLowerCase();
  return /^auto\b/.test(label.slice(d.length).trim()) ? d : label;
}

export type ModelPick = { driver: string; version: string | null };
export type ModelToggle = { group: string } | { cli: string } | { family: string };

export interface ModelRow {
  label: string;
  indent: number;
  current: boolean;
  isGroup: boolean;
  expandable: boolean;
  expanded: boolean;
  /** A group's pick opens or folds it; every other row picks a driver, a family or a pin. */
  pick: ModelPick | ModelToggle;
  toggle: ModelToggle | null;
}

export interface ModelInput {
  groups: readonly { label: string; entries: string[] }[];
  roster: readonly string[];
  cliVersions: CliVersions | null;
  currentDriver: string | null;
  expandedGroups: Readonly<Record<string, boolean>>;
  expandedCli: string | null;
  /** `<cli>:<family id>`. */
  expandedFamily: string | null;
}

/** Each group a row of its own, folded at first, its drivers one level in; a CLI with versions opens
 *  to its families, a family to its pins. */
export function modelRows(input: ModelInput): ModelRow[] {
  const groups = input.groups.length ? input.groups : [{ label: "", entries: input.roster.length ? [...input.roster] : ["deterministic"] }];
  const rows: ModelRow[] = [];
  for (const grp of groups) {
    const grouped = !!grp.label;
    const open = !grouped || !!input.expandedGroups[grp.label];
    const step = grouped ? 16 : 0;
    if (grouped) rows.push({ label: grp.label, indent: 12, current: false, isGroup: true, expandable: true, expanded: open, pick: { group: grp.label }, toggle: { group: grp.label } });
    if (!open) continue;
    for (const cli of grp.entries) {
      const families = input.cliVersions?.[cli]?.families ?? [];
      const cliOpen = input.expandedCli === cli;
      rows.push({ label: String(cli).toLowerCase(), indent: 12 + step, current: cli === input.currentDriver, isGroup: false, expandable: families.length > 0, expanded: cliOpen, pick: { driver: cli, version: null }, toggle: families.length ? { cli } : null });
      if (!cliOpen) continue;
      for (const fam of families) {
        const key = cli + ":" + fam.id;
        const pins = fam.pins ?? [];
        const famOpen = input.expandedFamily === key;
        rows.push({ label: String(fam.label || "").toLowerCase(), indent: 28 + step, current: false, isGroup: false, expandable: pins.length > 0, expanded: famOpen, pick: { driver: cli, version: fam.id }, toggle: pins.length ? { family: key } : null });
        if (!famOpen) continue;
        for (const pin of pins) rows.push({ label: String(pin.label || "").toLowerCase(), indent: 44 + step, current: false, isGroup: false, expandable: false, expanded: false, pick: { driver: cli, version: pin.id }, toggle: null });
      }
    }
  }
  return rows;
}
