// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 035x — slash-command router.

   Replaces the 306-line chain-of-`if` `_slashRoute` that lived in
   web/terminal.ts. Each slash implements the `SlashCommand` contract
   from ../types; this index collects them into `SLASH_COMMANDS` and
   exposes `route(line, ctx)`. Adding a new slash: one new file, one
   new entry — no branch in a 300-line dispatcher.

   Landed per REVIEW-2026-08-28-piece-g-eod ARCH-1 + CQ-6. */

import type { SlashCommand, SlashContext } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

import { exitSlash } from "./exit";
import { helpSlash } from "./help";
import { modelSlash } from "./model";
import { toolsSlash } from "./tools";
import { bundleSlash } from "./bundle";
import { workspaceSlash } from "./workspace";
import { isolateSlash } from "./isolate";
import { nameSlash } from "./name";
import { contextSlash } from "./context";
import { inspectSlash, narrateSlash } from "./inspect";
import { tailSlash } from "./tail";
import { catSlash } from "./cat";
import { listSlash } from "./list";
import { replaySlash } from "./replay";
import { runSlash } from "./run";
import { diffSlash } from "./diff";
import { studioSlash } from "./studio";
import { setSlash } from "./set";
import { interruptSlash } from "./interrupt";

const COMMAND_LIST: SlashCommand[] = [
  exitSlash,
  helpSlash,
  modelSlash,
  toolsSlash,
  bundleSlash,
  workspaceSlash,
  isolateSlash,
  nameSlash,
  contextSlash,
  inspectSlash,
  narrateSlash,
  tailSlash,
  catSlash,
  listSlash,
  replaySlash,
  runSlash,
  diffSlash,
  studioSlash,
  setSlash,
  interruptSlash,
];

const SLASH_COMMANDS: Record<string, SlashCommand> = Object.fromEntries(
  COMMAND_LIST.map((c) => [c.name, c]),
);

export async function route(line: string, ctx: SlashContext): Promise<boolean> {
  const stripped = line.trim();
  if (!stripped.startsWith("/")) return false;
  const parts = stripped.split(/\s+/);
  const slash = parts[0];
  const args = parts.slice(1);
  const cmd = SLASH_COMMANDS[slash];
  if (!cmd) {
    push(ctx.body, `unknown slash: ${slash}. Try /help`, CLS.err);
    return true;
  }
  await cmd.execute(args, ctx);
  return true;
}
