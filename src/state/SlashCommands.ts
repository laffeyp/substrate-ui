// src/state/SlashCommands.ts — Sprint 030.
//
// The slash-router's command registry. Names begin with the leading
// slash: Layer 2 pins SLASH_COMMAND_ROUTED.command to the pattern
// `^/[a-z_-]+$`. The set of commands here reads off Layer 2's own
// note on SLASH_COMMAND_ROUTED — the vocabulary is the contract.
// Handlers land later (Epic K + Epic M); this sprint mounts the
// router surface and the routing act.

export interface SlashCommand {
  name: string;   // begins with "/" (Layer 2 pattern)
  hint: string;
}

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  { name: "/list",    hint: "list sessions" },
  { name: "/run",     hint: "run a topology" },
  { name: "/inspect", hint: "open the inspector on a seq" },
  { name: "/diff",    hint: "diff two records" },
  { name: "/context", hint: "show context state" },
  { name: "/model",   hint: "switch model" },
  { name: "/studio",  hint: "open the studio surface" },
  { name: "/export",  hint: "export a record" },
  { name: "/exit",    hint: "end the current session" },
] as const;

export function slashCommandNames(): readonly string[] {
  return SLASH_COMMANDS.map((c) => c.name);
}

export function filterByPrefix(prefix: string): SlashCommand[] {
  const p = prefix.toLowerCase();
  return SLASH_COMMANDS.filter((c) => c.name.startsWith(p));
}
