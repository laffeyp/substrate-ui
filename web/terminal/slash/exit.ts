// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";

export const exitSlash: SlashCommand = {
  name: "/exit",
  async execute(_args, ctx) {
    await ctx.h.endSession("user_end");
  },
};
