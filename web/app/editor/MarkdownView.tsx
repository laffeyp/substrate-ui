// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A Markdown file shown rendered (sprint 503; roadmap 2026-11-14-editor-features r4 E5; the Architect, 2026-11-14:
// "We don't yet have the Markdown viewer … right click on the top of the tab … Put it in a menu there"). The blocks
// are the transcript's parser's (`web/reveal/markdown.ts`, with links read), drawn in the transcript's styles. A
// heading carries its anchor (`data-md-heading`); a link (`data-md-link`, its kind) follows on a click, as VS Code's
// preview follows one. The text is the buffer's when the view drew, unsaved edits included.

import * as React from "react";
import { mdBlocks, renderInline, type InlineSegment, type ParsedBlock } from "../../reveal/markdown";
import { EditorLinkFollowedView } from "../../vm/signals.gen";
import { headingSlug, linkKind } from "../derive/md_links";
import { followLink } from "./links";

const MONO = "ui-monospace,'SF Mono',Menlo,monospace";
const LINK = "#82a5c8";

function Inline({ seg, onLink }: { seg: InlineSegment; onLink: (href: string) => void }): React.ReactElement {
  const r = renderInline(seg);
  const style: React.CSSProperties = { fontFamily: r.font, background: r.bg, color: r.color, fontWeight: r.fw, fontStyle: r.fs, padding: r.pad, borderRadius: r.br };
  // An image draws as its alt text, marked; the view loads no images.
  if (seg.image !== undefined) return <span data-md-image="1" title={seg.image} style={{ ...style, color: "#9aa0a8", border: "1px solid #2d2f33", borderRadius: 4, padding: "1px 6px" }}>▣ {r.t || "image"}</span>;
  if (seg.href === undefined) return <span style={style}>{r.t}</span>;
  const href = seg.href;
  return (
    <span data-md-link={linkKind(href)} title={href} onClick={(e) => { e.preventDefault(); onLink(href); }}
      style={{ ...style, color: LINK, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(130,165,200,.4)", textUnderlineOffset: 2 }}>{r.t}</span>
  );
}

const inlines = (segs: InlineSegment[], onLink: (href: string) => void) => segs.map((s, i) => <Inline key={i} seg={s} onLink={onLink} />);
const textOf = (segs: InlineSegment[]) => segs.map((s) => s.t).join("");

function Block({ b, slug, onLink }: { b: ParsedBlock; slug?: string; onLink: (href: string) => void }): React.ReactElement {
  switch (b.kind) {
    case "heading": {
      const size = b.level === 1 ? 22 : b.level === 2 ? 18 : b.level === 3 ? 15 : 13;
      return <div data-md-heading={slug} style={{ fontSize: size, fontWeight: 600, color: "#e2e5e9", margin: "22px 0 8px", ...(b.level <= 2 ? { paddingBottom: 6, borderBottom: "1px solid #2d2f33" } : {}) }}>{inlines(b.inlines, onLink)}</div>;
    }
    case "code_block":
      return (
        <div data-md-code={b.lang || "1"} style={{ margin: "0 0 14px", background: "#1a1c20", borderRadius: 6, padding: "10px 14px", fontFamily: MONO, fontSize: 12, color: "#b9bec5", overflowX: "auto" }}>
          {b.lang ? <div style={{ color: "#62676f", fontSize: 10, marginBottom: 6 }}>{b.lang}</div> : null}
          <pre style={{ margin: 0, whiteSpace: "pre", font: "inherit", color: "inherit" }}>{b.text}</pre>
        </div>
      );
    case "ul":
    case "ol": {
      const Tag = b.kind;
      return <Tag style={{ margin: "0 0 12px", paddingLeft: 22 }}>{b.items.map((it, i) => <li key={i} style={{ margin: "0 0 4px" }}>{inlines(it.inlines, onLink)}</li>)}</Tag>;
    }
    case "table":
      return (
        <table style={{ margin: "0 0 14px", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{b.headers.map((c, i) => <th key={i} style={{ borderBottom: "1px solid #2e3138", padding: "4px 10px", textAlign: "left", fontWeight: 600, color: "#e2e5e9" }}>{inlines(c, onLink)}</th>)}</tr></thead>
          <tbody>{b.rows.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ borderBottom: "1px solid #1a1c20", padding: "4px 10px" }}>{inlines(c, onLink)}</td>)}</tr>)}</tbody>
        </table>
      );
    default:
      return <p style={{ margin: "0 0 12px" }}>{inlines(b.inlines, onLink)}</p>;
  }
}

export function MarkdownView({ text, paneId, sessionId, file }: { text: string; paneId: number; sessionId: string; file: string }): React.ReactElement {
  const root = React.useRef<HTMLDivElement>(null);
  const blocks = React.useMemo(() => mdBlocks(text, { links: true }), [text]);
  // Anchors as GitHub writes them: a repeated heading takes -1, -2.
  const slugs = React.useMemo(() => {
    const seen = new Map<string, number>();
    return blocks.map((b) => {
      if (b.kind !== "heading") return undefined;
      const base = headingSlug(textOf(b.inlines));
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      return n ? `${base}-${n}` : base;
    });
  }, [blocks]);
  const showHeading = (slug: string): boolean => {
    const el = root.current?.querySelector(`[data-md-heading="${CSS.escape(slug)}"]`);
    if (!el || !root.current) return false;
    root.current.scrollTop += el.getBoundingClientRect().top - root.current.getBoundingClientRect().top - 8;
    return true;
  };
  const onLink = (href: string) => { void followLink(href, { paneId, sessionId, file, text, view: EditorLinkFollowedView.RENDERED, showHeading }); };
  return (
    <div ref={root} data-md-view={file} style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "18px 28px 40px", color: "#c9ccd0", fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ maxWidth: 820, position: "relative" }}>
        {blocks.map((b, i) => <Block key={i} b={b} slug={slugs[i]} onLink={onLink} />)}
      </div>
    </div>
  );
}
