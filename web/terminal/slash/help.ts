import type { SlashCommand } from "../types";
import { CLS, HELP_TEXT } from "../types";
import { push } from "../helpers";

export const helpSlash: SlashCommand = {
  name: "/help",
  async execute(_args, ctx) {
    for (const l of HELP_TEXT) push(ctx.body, l, CLS.dim);
  },
};
