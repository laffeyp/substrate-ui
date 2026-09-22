import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

export const studioSlash: SlashCommand = {
  name: "/studio",
  async execute(_args, ctx) {
    window.open("/studio.html", "_blank");
    push(ctx.body, "studio opened in a new tab", CLS.dim);
  },
};
