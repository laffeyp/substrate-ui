// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

export const nameSlash: SlashCommand = {
  name: "/name",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length !== 1) {
      push(body, "/name <name> — register the next session under a name", CLS.err);
      return;
    }
    if (h.sessionId) {
      push(body, "/name: name registration is at create time; end this session (/exit) first", CLS.err);
      return;
    }
    h.pendingCreate.name = args[0];
    push(body, `name → ${args[0]} (queued for next session)`, CLS.dim);
  },
};
