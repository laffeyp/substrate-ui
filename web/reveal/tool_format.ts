// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// How a tool card draws its text (sprint 505; roadmap 2026-11-14-editor-features r4 E7; the Architect, 2026-11-14:
// "on the insets where we display like the tool output like for bash and all that, those aren't properly formatted.
// Like all code and all text needs to be properly formatted in there"). Pure: which language a call's args and its
// output are in, a read's line-number prefixes as a gutter, JSON, and which text the terminal model draws.

/** What a piece of tool text is drawn as: code of the file named `path` (its language by its name), shell, JSON, or
 *  text, whose ANSI colours the terminal model keeps. */
export type TextFormat = { kind: "code"; path: string } | { kind: "shell" } | { kind: "json" } | { kind: "text" };

const READS = new Set(["read_file", "Read", "NotebookRead"]);
const WRITES = new Set(["write_file", "Write"]);
const EDITS = new Set(["edit_file", "Edit", "MultiEdit"]);
const SHELLS = new Set(["bash", "Bash"]);
/** The arg keys that name a file, as the kernel's tools and Claude Code's name them. */
const PATH_KEYS = ["file_path", "path", "notebook_path"];
/** The arg keys whose value is the file's own text. */
const BODY_KEYS = new Set(["content", "text", "search", "replace", "old_string", "new_string"]);

/** An arg as the controller writes it: `key=value` for a harness call, the bare value for a kernel call. */
export function splitArg(arg: string): { key: string | null; value: string } {
  const m = /^([a-z_][a-z0-9_]*)=([\s\S]*)$/i.exec(arg);
  return m ? { key: m[1], value: m[2] } : { key: null, value: arg };
}

/** The file a call names: a harness call's `file_path`/`path`, or a kernel file tool's first arg. */
export function pathOf(toolName: string, args: readonly string[]): string | null {
  for (const a of args) {
    const { key, value } = splitArg(a);
    if (key && PATH_KEYS.includes(key)) return value;
  }
  if ((READS.has(toolName) || WRITES.has(toolName) || EDITS.has(toolName)) && args.length && splitArg(args[0]).key === null) return args[0];
  return null;
}

/** The format of arg `index` of a call. A file tool's body args are that file's code; a shell command is shell. */
export function argFormat(toolName: string, args: readonly string[], index: number): TextFormat {
  const { key } = splitArg(args[index] ?? "");
  const path = pathOf(toolName, args);
  if (SHELLS.has(toolName) && (key === "command" || (key === null && index === 0))) return { kind: "shell" };
  if (path && (WRITES.has(toolName) || EDITS.has(toolName))) {
    const body = key ? BODY_KEYS.has(key) : index > 0;
    if (body) return { kind: "code", path };
  }
  return { kind: "text" };
}

/** The format of a call's output: a read is its file's code; output that parses as JSON is JSON; the rest is text. */
export function outputFormat(toolName: string, args: readonly string[], output: string): TextFormat {
  const path = pathOf(toolName, args);
  if (path && READS.has(toolName)) return { kind: "code", path };
  if (jsonText(output) !== null) return { kind: "json" };
  return { kind: "text" };
}

/** A read's line-number prefixes (`     1→` from Claude Code, `1\t` from the kernel) split off as a gutter, when at
 *  least four lines in five carry one; null otherwise. The code keeps its own text, so a parser reads it as the file. */
export function splitNumbered(text: string): { numbers: string[]; code: string } | null {
  const lines = text.split("\n");
  const re = /^\s*(\d+)(?:→|\t)/;
  const filled = lines.filter((l) => l.length);
  if (filled.length < 2 || filled.filter((l) => re.test(l)).length * 5 < filled.length * 4) return null;
  const numbers: string[] = [];
  const code: string[] = [];
  for (const line of lines) {
    const m = re.exec(line);
    numbers.push(m ? m[1] : "");
    code.push(m ? line.slice(m[0].length) : line);
  }
  return { numbers, code: code.join("\n") };
}

/** The text pretty-printed when it is JSON (an object or an array, as tools return); null when it is not. Already
 *  laid out on several lines, it is kept as it is. */
export function jsonText(text: string): string | null {
  const t = text.trim();
  if (!(t.startsWith("{") && t.endsWith("}")) && !(t.startsWith("[") && t.endsWith("]"))) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(t); } catch { return null; }
  if (parsed === null || typeof parsed !== "object") return null;
  return t.includes("\n") ? t : JSON.stringify(parsed, null, 2);
}

/** Whether text needs the terminal model (`transcript/ansi.ts`, the login card's): it holds an escape, a carriage
 *  return or a backspace. Text without them is drawn as it is, since the terminal builds a cell per character. */
export function needsTerminal(text: string): boolean {
  return /[\x1b\r\b]/.test(text);
}

/** A kernel `bash` call's result, `{exit, stdout, stderr}` as JSON, read apart so the card draws what the command
 *  printed; null for any other output (Claude Code's `Bash` returns the printed text itself). */
export function shellResult(toolName: string, output: string): { exit: number | null; stdout: string; stderr: string } | null {
  if (!SHELLS.has(toolName)) return null;
  const t = output.trim();
  if (!t.startsWith("{")) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(t); } catch { return null; }
  if (!parsed || typeof parsed !== "object") return null;
  const r = parsed as Record<string, unknown>;
  if (typeof r.stdout !== "string" && typeof r.stderr !== "string") return null;
  return { exit: typeof r.exit === "number" ? r.exit : null, stdout: typeof r.stdout === "string" ? r.stdout : "", stderr: typeof r.stderr === "string" ? r.stderr : "" };
}
