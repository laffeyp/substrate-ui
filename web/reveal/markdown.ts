// Sprint 073 — markdown parser and renderer, extracted verbatim from
// `reveal_component.ts:120-215` (methods `_mdInlines`, `_mdBlocks`,
// `_mdRenderInline`, `_mdRenderBlock`). Behaviour-preserving. Every
// branch is carried over; every regex is copied character-for-
// character. Unit tests at `web/reveal/__tests__/markdown.spec.ts`
// exercise every block kind and inline segment shape.
//
// The parser turns chat-markdown text into a block sequence. The
// renderer attaches per-kind boolean gates so the dc-runtime template
// and the React `<ModelReply>` component both flow one flat prop bag
// per block.

export type InlineSegment = { t: string; code?: true; bold?: true; italic?: true };

export type ParsedBlock =
  | { kind: "p"; inlines: InlineSegment[] }
  | { kind: "code_block"; lang: string; text: string }
  | { kind: "ul"; items: { inlines: InlineSegment[] }[] }
  | { kind: "ol"; items: { inlines: InlineSegment[] }[] }
  | { kind: "heading"; level: number; inlines: InlineSegment[] };

export interface RenderedInline {
  t: string;
  font: string;
  bg: string;
  color: string;
  fw: string;
  fs: string;
  pad: string;
  br: string;
}

export interface RenderedBlock {
  isP: boolean;
  isCode: boolean;
  isUl: boolean;
  isOl: boolean;
  isH: boolean;
  hasLang: boolean;
  lang: string;
  text: string;
  inlines: RenderedInline[];
  items: { inlines: RenderedInline[] }[];
  hSize: string;
}

export function mdInlines(text: string): InlineSegment[] {
  // Tokenize a single line of prose into inline segments so downstream
  // renderers can flow `code`, **bold**, and *italic* at their own
  // weights and fonts. No HTML injection — every segment renders as a
  // plain `<span>` with styling.
  const out: InlineSegment[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push({ t: text.slice(last, match.index) });
    if (match[1]) out.push({ t: match[1].slice(1, -1), code: true });
    else if (match[2]) out.push({ t: match[2].slice(2, -2), bold: true });
    else if (match[3]) out.push({ t: match[3].slice(1, -1), italic: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out.length ? out : [{ t: text }];
}

export function mdBlocks(text: string): ParsedBlock[] {
  // Standard chat-markdown blocks: paragraph, fenced code block,
  // unordered list, ordered list, heading. Anything unmatched falls
  // to a paragraph so no user input is ever dropped.
  if (!text || typeof text !== "string") return [];
  const lines = text.split("\n");
  const blocks: ParsedBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const fence = trimmed.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        body.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ kind: "code_block", lang, text: body.join("\n") });
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, inlines: mdInlines(heading[2]) });
      i++;
      continue;
    }
    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    const ordered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (bullet || ordered) {
      const kind: "ul" | "ol" = bullet ? "ul" : "ol";
      const items: { inlines: InlineSegment[] }[] = [];
      while (i < lines.length) {
        const rowTrim = lines[i].trim();
        const bulletRow = rowTrim.match(/^[-*+]\s+(.*)$/);
        const orderedRow = rowTrim.match(/^(\d+)\.\s+(.*)$/);
        if (kind === "ul" && bulletRow) items.push({ inlines: mdInlines(bulletRow[1]) });
        else if (kind === "ol" && orderedRow) items.push({ inlines: mdInlines(orderedRow[2]) });
        else break;
        i++;
      }
      blocks.push({ kind, items });
      continue;
    }
    if (trimmed === "") {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length) {
      const rowTrim = lines[i].trim();
      if (
        rowTrim === "" ||
        /^```/.test(rowTrim) ||
        /^#{1,4}\s+/.test(rowTrim) ||
        /^[-*+]\s+/.test(rowTrim) ||
        /^\d+\.\s+/.test(rowTrim)
      ) break;
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", inlines: mdInlines(buf.join(" ")) });
  }
  return blocks;
}

export function renderInline(seg: InlineSegment): RenderedInline {
  // Precompute the CSS variants a renderer flows. Every rendered span
  // reads all six style keys, so the template / component stays flat.
  const styled: RenderedInline = {
    t: seg.t || "",
    font: "inherit",
    bg: "transparent",
    color: "inherit",
    fw: "400",
    fs: "normal",
    pad: "0",
    br: "0",
  };
  if (seg.code) {
    styled.font = "ui-monospace,'SF Mono',Menlo,monospace";
    styled.bg = "#1a1c20";
    styled.color = "#d7dade";
    styled.pad = "1px 4px";
    styled.br = "3px";
  }
  if (seg.bold) {
    styled.fw = "600";
    styled.color = "#e2e5e9";
  }
  if (seg.italic) {
    styled.fs = "italic";
  }
  return styled;
}

export function renderBlock(blk: ParsedBlock): RenderedBlock {
  const rendered: RenderedBlock = {
    isP: false,
    isCode: false,
    isUl: false,
    isOl: false,
    isH: false,
    hasLang: false,
    lang: "",
    text: "",
    inlines: [],
    items: [],
    hSize: "13px",
  };
  if (blk.kind === "p") {
    rendered.isP = true;
    rendered.inlines = blk.inlines.map(renderInline);
  } else if (blk.kind === "code_block") {
    rendered.isCode = true;
    rendered.text = blk.text || "";
    rendered.lang = blk.lang || "";
    rendered.hasLang = !!blk.lang;
  } else if (blk.kind === "ul") {
    rendered.isUl = true;
    rendered.items = blk.items.map((item) => ({ inlines: item.inlines.map(renderInline) }));
  } else if (blk.kind === "ol") {
    rendered.isOl = true;
    rendered.items = blk.items.map((item) => ({ inlines: item.inlines.map(renderInline) }));
  } else if (blk.kind === "heading") {
    rendered.isH = true;
    rendered.inlines = blk.inlines.map(renderInline);
    rendered.hSize = blk.level === 1 ? "17px" : blk.level === 2 ? "15px" : "13px";
  }
  return rendered;
}
