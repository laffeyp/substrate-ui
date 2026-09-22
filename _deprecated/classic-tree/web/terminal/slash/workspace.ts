import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

export const workspaceSlash: SlashCommand = {
  name: "/workspace",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length !== 1) {
      push(body, "/workspace <path> — set workspace at create time (immutable per session)", CLS.err);
      return;
    }
    if (h.sessionId) {
      push(body, "/workspace: workspace is create-only per spec §9c; end this session (/exit) first", CLS.err);
      return;
    }
    h.pendingCreate.workspace = args[0];
    push(body, `workspace → ${args[0]} (queued for next session)`, CLS.dim);
  },
};
