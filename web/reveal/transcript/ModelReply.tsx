// Sprint 073 — model-reply block renderer.
//
// Consumes `mdBlocks` + `renderBlock` from `web/reveal/markdown.ts`
// and emits the block markup byte-for-byte with reveal.html:96-108.
// Wrapped in `React.memo` so a re-render only happens when the raw
// text changes.

import * as React from "react";
import { mdBlocks, renderBlock } from "../markdown";
import type { RenderedBlock, RenderedInline } from "../markdown";

interface Props { text: string }

function inlineSpan(inline: RenderedInline, key: number) {
  return (
    <span
      key={key}
      style={{
        fontFamily: inline.font,
        background: inline.bg,
        color: inline.color,
        fontWeight: inline.fw,
        fontStyle: inline.fs,
        padding: inline.pad,
        borderRadius: inline.br,
      }}
    >
      {inline.t}
    </span>
  );
}

function blockElement(block: RenderedBlock, key: number): React.ReactElement | null {
  if (block.isP) {
    return (
      <div key={key} style={{ margin: "0 0 10px" }}>
        {block.inlines.map(inlineSpan)}
      </div>
    );
  }
  if (block.isCode) {
    return (
      <div key={key} style={{
        margin: "0 0 12px",
        background: "#1a1c20",
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
        fontSize: 12,
        color: "#b9bec5",
        overflowX: "auto",
      }}>
        {block.hasLang ? (
          <div style={{ color: "#62676f", fontSize: 10, textTransform: "lowercase", marginBottom: 6 }}>{block.lang}</div>
        ) : null}
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", font: "inherit", color: "inherit" }}>{block.text}</pre>
      </div>
    );
  }
  if (block.isUl) {
    return (
      <ul key={key} style={{ margin: "0 0 10px", paddingLeft: 20 }}>
        {block.items.map((item, itemKey) => (
          <li key={itemKey} style={{ margin: "0 0 4px" }}>
            {item.inlines.map(inlineSpan)}
          </li>
        ))}
      </ul>
    );
  }
  if (block.isOl) {
    return (
      <ol key={key} style={{ margin: "0 0 10px", paddingLeft: 22 }}>
        {block.items.map((item, itemKey) => (
          <li key={itemKey} style={{ margin: "0 0 4px" }}>
            {item.inlines.map(inlineSpan)}
          </li>
        ))}
      </ol>
    );
  }
  if (block.isH) {
    return (
      <div key={key} style={{ fontSize: block.hSize, fontWeight: 600, color: "#e2e5e9", margin: "16px 0 6px" }}>
        {block.inlines.map(inlineSpan)}
      </div>
    );
  }
  return null;
}

const ModelReplyInner: React.FC<Props> = ({ text }) => {
  const blocks = mdBlocks(text).map(renderBlock);
  return (
    <span style={{ display: "inline-block", verticalAlign: "top", maxWidth: "calc(100% - 24px)" }}>
      {blocks.map((block, key) => blockElement(block, key))}
    </span>
  );
};

export const ModelReply = React.memo(ModelReplyInner);
