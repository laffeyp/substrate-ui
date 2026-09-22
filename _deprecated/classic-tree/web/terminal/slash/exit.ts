import type { SlashCommand } from "../types";

export const exitSlash: SlashCommand = {
  name: "/exit",
  async execute(_args, ctx) {
    await ctx.h.endSession("user_end");
  },
};
