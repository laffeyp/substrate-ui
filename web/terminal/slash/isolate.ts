// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

export const isolateSlash: SlashCommand = {
  name: "/isolate",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length !== 1 || (args[0] !== "on" && args[0] !== "off")) {
      push(body, "/isolate on|off — enable Mode 3 (nested-by-directory child dirs) at create time", CLS.err);
      return;
    }
    if (h.sessionId) {
      push(body, "/isolate: isolate is create-only per spec §9c; end this session (/exit) first", CLS.err);
      return;
    }
    h.pendingCreate.isolate = args[0] === "on";
    push(body, `isolate → ${args[0]} (queued for next session)`, CLS.dim);
  },
};
