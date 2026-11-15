// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A tool card's text, formatted (sprint 505; roadmap 2026-11-14-editor-features r4 E7). Code is parsed with the
// language the editor gives a file of that name (`@codemirror/language-data`, as `editor/Centre.tsx` picks it) and
// drawn with `@lezer/highlight`'s `highlightCode`, once per text, in the editor's palette (`--syntax-<class>`, set by
// `transcriptVars` on each transcript container). A read's line numbers sit in a dim gutter. Text with escapes is
// drawn through the login card's terminal model (`ansi.ts`), its colours kept. The parse runs when the text lands, not
// on each draw: results are kept by text, since a card unmounts and mounts again when the view changes.

import * as React from "react";
import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { highlightCode, tagHighlighter, tags as t } from "@lezer/highlight";
import { AnsiTerminal, type Sgr } from "./ansi";
import { jsonText, needsTerminal, splitNumbered, type TextFormat } from "../tool_format";

/** Text past this many characters is drawn plain: a parse of it would hold the window. */
const HIGHLIGHT_MAX = 200_000;

/** The editor's classes (`editor/Centre.tsx` `highlightFor`), each a `--syntax-<class>` colour. */
const CLASSES = tagHighlighter([
  { tag: t.comment, class: "comment" },
  { tag: [t.keyword, t.modifier, t.self], class: "keyword" },
  { tag: [t.string, t.special(t.string), t.character, t.regexp], class: "string" },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit, t.escape], class: "number" },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], class: "type" },
  { tag: [t.definition(t.variableName), t.function(t.variableName), t.definition(t.function(t.variableName)), t.labelName], class: "name" },
  { tag: [t.propertyName, t.attributeName], class: "property" },
  { tag: [t.meta, t.annotation, t.processingInstruction], class: "meta" },
  { tag: [t.punctuation, t.bracket, t.operator, t.separator], class: "punctuation" },
  { tag: [t.heading, t.link, t.url], class: "keyword" },
]);

/** The fallbacks are sprint 481's palette, for a container that sets no variables. */
const FALLBACK: Record<string, string> = { comment: "#62676f", keyword: "#7da3ca", string: "#c7ade6", number: "#d496c3", type: "#b0bbd2", name: "#e8eaee", property: "#b9bec5", meta: "#948dc5", punctuation: "#8a9099" };
const colour = (cls: string) => `var(--syntax-${cls}, ${FALLBACK[cls]})`;

type Token = { t: string; cls?: string };
type Drawn = { key: string; lang: string | null; lines: Token[][] };

const CACHE = new Map<string, Drawn>();
const remember = (key: string, drawn: Drawn) => {
  if (CACHE.size > 300) CACHE.delete(CACHE.keys().next().value as string);
  CACHE.set(key, drawn);
};

/** The language description for a format: a file's by its name, shell's, JSON's; null for plain text. */
function descOf(format: TextFormat): LanguageDescription | null {
  const name = format.kind === "code" ? format.path.slice(format.path.lastIndexOf("/") + 1) : format.kind === "shell" ? "x.sh" : format.kind === "json" ? "x.json" : null;
  return name ? LanguageDescription.matchFilename(languages, name) : null;
}

function plainLines(text: string): Token[][] {
  return text.split("\n").map((l) => [{ t: l }]);
}

async function highlight(code: string, desc: LanguageDescription): Promise<Token[][]> {
  const support = desc.support ?? (await desc.load());
  const tree = support.language.parser.parse(code);
  const lines: Token[][] = [[]];
  highlightCode(code, tree, CLASSES, (text, classes) => { lines[lines.length - 1].push(classes ? { t: text, cls: classes.split(" ")[0] } : { t: text }); }, () => { lines.push([]); });
  return lines;
}

/** Text drawn through the terminal model: its colours kept, carriage returns and cursor moves applied. */
export function TerminalText({ text }: { text: string }): React.ReactElement {
  const rows = React.useMemo(() => { const term = new AnsiTerminal(); term.write(text.replace(/\r?\n/g, "\r\n")); return term.snapshot().rows; }, [text]);
  const style = (s: Sgr): React.CSSProperties => ({ color: s.fg, background: s.bg, fontWeight: s.bold ? 600 : undefined, opacity: s.dim ? 0.6 : undefined });
  return (
    <div data-tool-text="terminal">
      {rows.map((row, i) => <div key={i} style={{ minHeight: "1.7em" }}>{row.runs.map((run, j) => <span key={j} style={style(run.sgr)}>{run.text}</span>)}</div>)}
    </div>
  );
}

/** `code`'s tokens in `format`: plain until its parse lands, then highlighted; kept by text across remounts. */
function useDrawn(code: string, format: TextFormat): Drawn {
  const desc = code.length <= HIGHLIGHT_MAX ? descOf(format) : null;
  const key = `${desc?.name ?? "-"}\u0000${code}`;
  const [made, setDrawn] = React.useState<Drawn | null>(() => CACHE.get(key) ?? null);
  // A drawing made for other text is never shown: until this text's parse lands, it is drawn plain.
  const drawn = made && made.key === key ? made : CACHE.get(key) ?? { key, lang: null, lines: plainLines(code) };
  React.useEffect(() => {
    const kept = CACHE.get(key);
    if (kept) { setDrawn(kept); return; }
    if (!desc) return;
    let live = true;
    highlight(code, desc).then((lines) => {
      const next = { key, lang: desc.name, lines };
      remember(key, next);
      if (live) setDrawn(next);
    }, () => { /* no parser: the text stays plain */ });
    return () => { live = false; };
  }, [key]);
  return drawn;
}

const tokenSpan = (tok: Token, j: number) => tok.cls
  ? <span key={j} data-tk={tok.cls} style={{ color: colour(tok.cls), fontStyle: tok.cls === "comment" ? "italic" : undefined }}>{tok.t}</span>
  : <span key={j}>{tok.t}</span>;

/** A closed card's summary text (sprint 509), inline so the summary's three-line clamp holds: a shell command in the
 *  editor's palette, a path with its folders dim and its name bright, anything else in the preview's grey. */
export function SummaryText({ text, format }: { text: string; format: "shell" | "path" | "text" }): React.ReactElement {
  const drawn = useDrawn(text, format === "shell" ? { kind: "shell" } : { kind: "text" });
  if (format === "path") {
    const cut = text.lastIndexOf("/") + 1;
    return (
      <span data-tool-summary-text="path">
        <span data-tk="dir" style={{ color: "#62676f" }}>{text.slice(0, cut)}</span>
        <span data-tk="file" style={{ color: "#e2e5e9" }}>{text.slice(cut)}</span>
      </span>
    );
  }
  return (
    <span data-tool-summary-text={format} data-tool-lang={drawn.lang ?? ""} style={{ color: format === "shell" ? "#d7dade" : "#b9bec5" }}>
      {drawn.lines.map((line, i) => <React.Fragment key={i}>{i ? "\n" : null}{line.map(tokenSpan)}</React.Fragment>)}
    </span>
  );
}

/** One piece of a tool card's text, drawn in its format. */
export function ToolText({ text, format }: { text: string; format: TextFormat }): React.ReactElement {
  const numbered = format.kind === "code" ? splitNumbered(text) : null;
  const code = format.kind === "json" ? jsonText(text) ?? text : numbered ? numbered.code : text;
  const drawn = useDrawn(code, format);
  if (format.kind === "text" && needsTerminal(text)) return <TerminalText text={text} />;
  return (
    <div data-tool-text={format.kind} data-tool-lang={drawn.lang ?? ""} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: format.kind === "text" ? undefined : "#d7dade" }}>
      {drawn.lines.map((line, i) => (
        <div key={i} style={{ display: "flex", minHeight: "1.7em" }}>
          {numbered ? <span data-tool-gutter="1" style={{ flex: "none", width: "3.5em", textAlign: "right", paddingRight: 10, color: "#4a4e55", userSelect: "none" }}>{numbered.numbers[i]}</span> : null}
          <span style={{ minWidth: 0 }}>{line.map(tokenSpan)}</span>
        </div>
      ))}
    </div>
  );
}
