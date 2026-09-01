// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

export const replaySlash: SlashCommand = {
  name: "/replay",
  async execute(_args, ctx) {
    // Decisions 2026-08-28 (SPEC-6): terminal-view /replay stays as
    // validation-hint; the desktop-view transport (#play/#seq/#speedsel
    // in app.ts) is the scrub-and-play surface.
    push(ctx.body, "/replay — replay-verification is not exposed via the daemon; run `substrate replay <record>` at the CLI", CLS.err);
  },
};
