// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Links in a Markdown file (sprint 503; roadmap 2026-11-14-editor-features r4 E5; the Architect, 2026-11-14: "a link
// in Markdown, I should be able to command click that link and then it should open that up"). Pure: which link a
// column of a line falls in, what kind it is, the workspace path a relative one names, and a heading's anchor as
// GitHub writes it, so `#install` finds "## Install".

export type LinkKind = "external" | "file" | "heading";

/** A link's kind by its target: a scheme (`https:`, `mailto:`) is external; `#…` a heading in this file; anything
 *  else a path, which may carry its own `#heading`. */
export function linkKind(target: string): LinkKind {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return "external";
  if (target.startsWith("#")) return "heading";
  return "file";
}

const INLINE = /\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const ANGLE = /<((?:https?|mailto):[^>\s]+)>/g;
const BARE = /\bhttps?:\/\/[^\s<>()\]]+[^\s<>()\].,;:!?'"]/g;

/** The target of the link that column `col` (0-based) of `line` falls in: an inline `[text](target)` link when
 *  `markdown`, an `<https://…>` link, or a bare `https://…` address; null on none. */
export function linkAt(line: string, col: number, markdown = true): string | null {
  const patterns: [RegExp, number][] = [...(markdown ? [[INLINE, 2] as [RegExp, number]] : []), [ANGLE, 1], [BARE, 0]];
  for (const [re, group] of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (col >= m.index && col < m.index + m[0].length) return m[group];
    }
  }
  return null;
}

/** A heading's anchor as GitHub writes it: lower case, markup and punctuation gone, spaces as hyphens. */
export function headingSlug(text: string): string {
  return text
    .replace(/[`*_]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/** The 1-based line of the heading whose anchor is `slug` in Markdown `text`, or null. Lines in fenced code are
 *  not headings. Repeated headings take `-1`, `-2` as GitHub does. */
export function headingLine(text: string, slug: string): number | null {
  const seen = new Map<string, number>();
  let fenced = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^```/.test(t)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const head = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(t);
    if (!head) continue;
    const base = headingSlug(head[1]);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    if ((n ? `${base}-${n}` : base) === slug) return i + 1;
  }
  return null;
}

/** The workspace path a relative link in `fromFile` names, and its `#heading` if any; a path that climbs above the
 *  workspace is null. A leading `/` is the workspace's top. */
export function resolveLink(fromFile: string, target: string): { path: string; anchor: string | null } | null {
  const hash = target.indexOf("#");
  const raw = hash >= 0 ? target.slice(0, hash) : target;
  const anchor = hash >= 0 ? target.slice(hash + 1) || null : null;
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
  const parts = decoded.startsWith("/") ? [] : fromFile.split("/").slice(0, -1);
  for (const seg of decoded.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { if (!parts.length) return null; parts.pop(); continue; }
    parts.push(seg);
  }
  if (!parts.length) return null;
  return { path: parts.join("/"), anchor };
}
