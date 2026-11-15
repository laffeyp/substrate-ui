// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// How a tool card draws its text (sprint 505; roadmap 2026-11-14-editor-features r4 E7; the Architect, 2026-11-14:
// "on the insets where we display like the tool output like for bash and all that, those aren't properly formatted.
// Like all code and all text needs to be properly formatted in there"). Pure: which language a call's args and its
// output are in, a read's line-number prefixes as a gutter, JSON, and which text the terminal model draws.

/** What a piece of tool text is drawn as: code of the file named `path` (its language by its name), shell, JSON, or
 *  text, whose ANSI colours the terminal model keeps. */
export type TextFormat = { kind: "code"; path: string } | { kind: "shell" } | { kind: "json" } | { kind: "diff" } | { kind: "grep" } | { kind: "text" };

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

/** The format of a call's output: a read is its file's code; a shell command's output is what that command prints
 *  (sprint 510, `commandFormat`) when the output has that shape; output that parses as JSON is JSON; the rest is text. */
export function outputFormat(toolName: string, args: readonly string[], output: string): TextFormat {
  const path = pathOf(toolName, args);
  if (path && READS.has(toolName)) return { kind: "code", path };
  if (SHELLS.has(toolName)) {
    const cmd = args.map(splitArg).find((a) => a.key === "command" || a.key === null);
    const fmt = cmd ? commandFormat(cmd.value) : null;
    // A JSON file shown by `cat` is laid out as JSON is, not left on its one line.
    if (fmt?.kind === "code") return /\.json$/i.test(fmt.path) && jsonText(output) !== null ? { kind: "json" } : fmt;
    if (fmt?.kind === "diff" && isDiff(output)) return fmt;
    if (fmt?.kind === "grep" && grepLines(output) !== null) return fmt;
  }
  if (jsonText(output) !== null) return { kind: "json" };
  return { kind: "text" };
}

/** A command line's words, quotes removed; enough of the shell's rules to find a command's name and its file. */
export function shellWords(cmd: string): string[] {
  const out: string[] = [];
  const re = /'([^']*)'|"((?:[^"\\]|\\.)*)"|((?:\\.|[^\s'"\\])+)/g;
  let word: string | null = null;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd)) !== null) {
    if (m.index > last && /\s/.test(cmd.slice(last, m.index)) && word !== null) { out.push(word); word = null; }
    word = (word ?? "") + (m[1] ?? m[2]?.replace(/\\(.)/g, "$1") ?? m[3].replace(/\\(.)/g, "$1"));
    last = m.index + m[0].length;
  }
  if (word !== null) out.push(word);
  return out;
}

/** Commands whose output is a file's text, and the flags of each that take a value. */
const SHOWS: Record<string, Set<string>> = {
  cat: new Set(), bat: new Set(["-l", "--language", "-r", "--line-range"]), less: new Set(), nl: new Set(),
  head: new Set(["-n", "-c"]), tail: new Set(["-n", "-c"]), sed: new Set(["-e"]),
};
const DIFFS = (words: string[]) => words[0] === "diff" || (words[0] === "git" && ["diff", "show", "log"].includes(words[1] ?? ""));
const GREPS = (words: string[]) => ["grep", "egrep", "rg", "ag"].includes(words[0]) || (words[0] === "git" && words[1] === "grep");

/** What a shell command prints (sprint 510): `cat`, `head`, `tail`, `sed -n`, `less`, `nl` or `bat` of one file is that
 *  file's code; `git diff`, `git show`, `git log -p` and `diff` a diff; `grep`, `rg`, `git grep` hits; null for any other
 *  command. A list (`&&`, `;`, `||`) is read by its last command and a pipeline by its last stage; a `head` or `tail`
 *  reading a pipe takes the file of the stage before it. */
export function commandFormat(cmd: string): TextFormat | null {
  const last = cmd.split(/&&|\|\||;|\n/).map((s) => s.trim()).filter(Boolean).pop() ?? "";
  const stages = last.split(/\|(?!\|)/).map((s) => shellWords(s.trim()));
  let file: string | null = null;
  for (const words of stages) {
    while (words.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]) || ["sudo", "command", "env", "time"].includes(words[0]))) words.shift();
    if (!words.length) continue;
    const name = words[0].slice(words[0].lastIndexOf("/") + 1);
    if (DIFFS([name, ...words.slice(1)])) return { kind: "diff" };
    if (GREPS([name, ...words.slice(1)])) { file = null; if (words === stages[stages.length - 1]) return { kind: "grep" }; continue; }
    const takes = SHOWS[name];
    if (!takes) { file = null; continue; }
    const rest: string[] = [];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      if (takes.has(word)) { i++; continue; }
      if (word.startsWith("-")) continue;
      rest.push(word);
    }
    // `sed -n '1,40p' f`: the script is the first word left, the file after it.
    if (name === "sed") rest.shift();
    if (rest.length === 1) file = rest[0];
    else if (rest.length > 1) file = null;
  }
  return file ? { kind: "code", path: file } : null;
}

/** Whether text reads as a unified diff: a hunk header, or a file header pair. */
export function isDiff(text: string): boolean {
  return /^@@ -\d/m.test(text) || (/^--- /m.test(text) && /^\+\+\+ /m.test(text));
}

/** Grep hits, `path:line:text` (or `path:text`, `path-line-text` for context), each line split apart; null when fewer
 *  than four lines in five read as hits. `--` separators and blank lines stay as they are. */
export function grepLines(text: string): { path: string | null; line: string | null; sep: string; text: string }[] | null {
  const rows = text.replace(/\n$/, "").split("\n");
  const out = rows.map((r) => {
    const m = /^([^\s:][^:\n]*?)([:-])(\d+)\2(.*)$/.exec(r) ?? null;
    if (m) return { path: m[1], line: m[3], sep: m[2], text: m[4] };
    const p = /^([^\s:][^:\n]*\.[A-Za-z0-9]+):(.*)$/.exec(r);
    if (p) return { path: p[1], line: null, sep: ":", text: p[2] };
    return { path: null, line: null, sep: "", text: r };
  });
  const filled = out.filter((row) => row.text.length || row.path);
  const hits = out.filter((row) => row.path).length;
  if (!hits || hits * 5 < filled.filter((row) => row.text !== "--").length * 4) return null;
  return out;
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

/** What a closed card's summary shows after the tool's name (sprint 509): a shell call's command, a file tool's path,
 *  any other call's first arg, each without the `key=` a harness call carries (before, a Claude Code `Bash` card read
 *  `command=ls -la`). */
export function summaryOf(toolName: string, args: readonly string[]): { text: string; format: "shell" | "path" | "text" } {
  if (SHELLS.has(toolName)) {
    const cmd = args.map(splitArg).find((a) => a.key === "command" || a.key === null);
    if (cmd) return { text: cmd.value, format: "shell" };
  }
  const path = READS.has(toolName) || WRITES.has(toolName) || EDITS.has(toolName) ? pathOf(toolName, args) : null;
  if (path) return { text: path, format: "path" };
  // A search shows what it looks for (`Grep`, `Glob`), not where.
  const pattern = args.map(splitArg).find((a) => a.key === "pattern");
  if (pattern) return { text: pattern.value, format: "text" };
  return { text: args.length ? splitArg(args[0]).value : "", format: "text" };
}
