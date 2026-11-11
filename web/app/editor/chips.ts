// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's things as chips for the message (sprint 457; D94; ADD-TO-MESSAGE-2026-11-10-r3): one place that
// names a file, a folder or a line as a chip, adds it to the pane's input bar, and writes EDITOR_CHIP_ADDED with
// the gesture. The tree's ⌥-click, the code's ⌥A and every right-click › Add to message come through here.
// Sprint 458 (BLACKBOARD 2026-11-11, what a drag carries): a drag carries the chip as JSON under CHIP_TYPE and the
// path as text/plain, last (MDN, "Recommended drag types"); the input bar takes a drop of CHIP_TYPE as the chip.

import { addChip, type Chip } from "../state/input_bar";
import type { MenuItem } from "../state/context_menu";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorChipAddedHow, EditorChipAddedKind, Signal } from "../../vm/signals.gen";

const nameOf = (rel: string) => rel.slice(rel.lastIndexOf("/") + 1);

export const fileChip = (rel: string): Chip => ({ kind: "file", label: nameOf(rel), ref: rel });
/** A folder's label ends in "/", as the tree draws it. */
export const folderChip = (rel: string): Chip => ({ kind: "folder", label: `${nameOf(rel)}/`, ref: rel });
/** One line by its number, without text: the server reads it from the file when the message goes (`server.py`
 *  `_attachment_text`), after the buffers are saved (sprint 444). */
export const lineChip = (rel: string, line: number): Chip => ({ kind: "lines", label: `${nameOf(rel)} ${line}`, ref: rel, span: [line, line] });

/** The chip added to the pane's bar; EDITOR_CHIP_ADDED unless it was there already. */
export function addFrom(paneId: number, chip: Chip, how: EditorChipAddedHow): boolean {
  if (!addChip(paneId, chip)) return false;
  const kind = chip.kind === "lines" ? EditorChipAddedKind.RANGE : chip.kind === "folder" ? EditorChipAddedKind.FOLDER : EditorChipAddedKind.FILE;
  emitSignal(Signal.EDITOR_CHIP_ADDED, { kind, how }, { pane_id: paneId });
  return true;
}

/** Right-click › Add to message, with the chip's label beside it. */
export const ADD_TO_MESSAGE = "Add to message";
export const addItem = (paneId: number, chip: Chip): MenuItem => ({ label: ADD_TO_MESSAGE, detail: chip.label, run: () => { addFrom(paneId, chip, EditorChipAddedHow.MENU); } });

/** A drag's chip, for the input bar; text/plain carries the path for any other target. */
export const CHIP_TYPE = "application/x-substrate-chip";
export function dragChip(ev: { dataTransfer: DataTransfer | null }, chip: Chip): void {
  if (!ev.dataTransfer) return;
  ev.dataTransfer.setData(CHIP_TYPE, JSON.stringify(chip));
  ev.dataTransfer.setData("text/plain", chip.ref);
  ev.dataTransfer.effectAllowed = "copy";
}
/** The drag carries a chip (its types are readable while it is over a target; its data only on the drop). */
export const carriesChip = (dt: DataTransfer | null): boolean => !!dt && Array.from(dt.types).includes(CHIP_TYPE);
/** A dropped chip added to the pane's bar (how drag); false when the data is not a chip or it is there already. */
export function dropChip(paneId: number, dt: DataTransfer | null): boolean {
  let chip: unknown;
  try { chip = JSON.parse(dt?.getData(CHIP_TYPE) || "null"); } catch { return false; }
  const c = chip as Partial<Chip> | null;
  const ok = !!c && (c.kind === "file" || c.kind === "folder" || c.kind === "lines") && typeof c.label === "string" && typeof c.ref === "string"
    && (c.span === undefined || (Array.isArray(c.span) && c.span.every((n) => typeof n === "number")));
  return ok ? addFrom(paneId, c as Chip, EditorChipAddedHow.DRAG) : false;
}
