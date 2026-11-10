// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's inspector for code (sprint 422; roadmap 2026-11-09-code-editor r8, E6; spec r6 §5 "Code",
// §5.0; D54, D81, D82, D85; frame 24a). Under `INSPECTOR <file>`, as the sheet draws them: OUTLINE (from
// the centre's syntax tree, the symbol around the caret lit) and CHANGES IN THIS FILE (the file's hunks
// against the base, each with its author) under plain headers; then, ruled, drawn open and folding (▾/▸; D85), ACTIVITY (this file in the record), HISTORY (every edit with its author), INFO
// (the file's facts). Data from the record (web/app/derive/inspector.ts) and the centre's read (the
// editor store). What needs work not yet built is not drawn (D6; BLACKBOARD 2026-11-09, the order after
// the centre): FIND / REPLACE and HISTORY's step-back keys come with saving (E4), ACTIVITY's ◂ with the
// record column (E5). The drawn counts go to the editor store for EDITOR_DRAWN and the pixel anchor;
// each drawn hunk is an EDITOR_HUNK_DRAWN.

import * as React from "react";
import { editor } from "../state/editor";
import { shell } from "../state/shell";
import { authorLabel, fileActivity, fileHistoryState, fileType, hunkAuthor, litRow, stepText } from "../derive/inspector";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorHunkDrawnAuthor, Signal } from "../../vm/signals.gen";
import { find, setHistoryStep, type FindChange } from "./Centre";
import { openSeq } from "./EditorView";

// Frame 24a's values, from the sheet of record (Substrate Shell Directions v11).
const CARD = "#212327";
const SELECT = "#2e3138";
const FAINT = "#4a4e55";
const DIM = "#62676f";
const MID = "#9aa0a8";
const TEXT = "#b9bec5";
const BRIGHT = "#e2e5e9";
const RULE = "1px solid rgba(255,255,255,.055)";
const HEAD: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 9.5, letterSpacing: ".12em", color: DIM, whiteSpace: "nowrap" };
const META: React.CSSProperties = { marginLeft: "auto", letterSpacing: 0, fontSize: 10, color: DIM };

/** OUTLINE and CHANGES: plain headers (24a draws them without a fold glyph; D85 names the ▸ sections). */
function Plain({ name, meta, children }: { name: string; meta?: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div data-inspector-section={name}>
      <div style={{ ...HEAD, padding: "10px 14px 5px" }}>{name.toUpperCase()}{meta && <span style={META}>{meta}</span>}</div>
      {children}
    </div>
  );
}

/** ACTIVITY, HISTORY, INFO: ruled above, drawn open, folding on ▾/▸ (D85). */
function Folding({ name, meta, children, openOn }: { name: string; meta?: string; children: React.ReactNode; openOn?: number }): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  // A key that goes to the section (⌘F for FIND / REPLACE) opens it.
  React.useEffect(() => { if (openOn) setOpen(true); }, [openOn]);
  return (
    <div data-inspector-section={name} data-open={open ? "1" : "0"} style={{ borderTop: RULE }}>
      <div onClick={() => setOpen(!open)} style={{ ...HEAD, padding: "9px 14px 4px", cursor: "pointer" }}>
        <span style={{ color: FAINT }}>{open ? "▾" : "▸"}</span>{name.toUpperCase()}{meta && <span style={META}>{meta}</span>}
      </div>
      {open && children}
    </div>
  );
}

function when(modified: number): string {
  const d = new Date(modified * 1000), now = new Date();
  const day = (x: Date) => x.toDateString();
  if (day(d) === day(now)) return "today";
  const y = new Date(now.getTime() - 86_400_000);
  return day(d) === day(y) ? "yesterday" : d.toISOString().slice(0, 10);
}

/** FIND / REPLACE (sprint 428; 24a): the query and its count, Aa and .*, the replacement with ↵ and all.
 *  ↵ in the query goes to the next match, ⇧↵ the previous; ↵ in the replacement replaces one; Escape
 *  returns to the code. */
function FindSection(): React.ReactElement {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const spec = st.find, count = st.findCount;
  const set = (patch: Partial<typeof spec>, how: FindChange) => find.set({ ...spec, ...patch }, how);
  const box: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, margin: "2px 14px 4px", padding: "4px 8px", borderRadius: 4, background: CARD, fontSize: 10.5 };
  const field: React.CSSProperties = { flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: BRIGHT, font: "inherit", fontSize: 10.5, padding: 0 };
  const toggle = (on: boolean): React.CSSProperties => ({ cursor: "pointer", color: on ? BRIGHT : DIM, userSelect: "none" });
  const label = !spec.search ? "" : count.total === 0 ? "no matches" : count.current > 0 ? `${count.current} of ${count.total}` : `${count.total} match${count.total === 1 ? "" : "es"}`;
  const keys = (onEnter: (shift: boolean) => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); onEnter(e.shiftKey); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); find.focusCode(); }
  };
  return (
    <Folding name="find / replace" openOn={st.findFocus}>
      <div style={box}>
        <input data-find-input="query" value={spec.search} placeholder="find" spellCheck={false} onChange={(e) => set({ search: e.target.value }, "typed")} onKeyDown={keys((shift) => find.step(shift))} style={field} />
        <span style={{ marginLeft: "auto", display: "flex", gap: 7, color: DIM, flex: "none" }}>
          <span data-find-count="1">{label}</span>
          <span data-find-toggle="case" data-on={spec.caseSensitive ? "1" : "0"} title="match case" onClick={() => set({ caseSensitive: !spec.caseSensitive }, "toggle")} style={toggle(spec.caseSensitive)}>Aa</span>
          <span data-find-toggle="regexp" data-on={spec.regexp ? "1" : "0"} title="regular expression" onClick={() => set({ regexp: !spec.regexp }, "toggle")} style={toggle(spec.regexp)}>.*</span>
        </span>
      </div>
      <div style={box}>
        <input data-find-input="replace" value={spec.replace} placeholder="replace" spellCheck={false} onChange={(e) => set({ replace: e.target.value }, "replace")} onKeyDown={keys(() => find.replace(false))} style={{ ...field, color: spec.replace ? BRIGHT : FAINT }} />
        <span style={{ marginLeft: "auto", display: "flex", gap: 7, color: DIM, flex: "none" }}>
          <span data-find-replace="one" title="replace this match (↵)" onClick={() => find.replace(false)} style={{ cursor: "pointer" }}>↵</span>
          <span data-find-replace="all" title="replace every match" onClick={() => find.replace(true)} style={{ cursor: "pointer" }}>all</span>
        </span>
      </div>
      <div style={{ height: 2 }} />
    </Folding>
  );
}

export function Inspector({ paneId, workspace }: { paneId: number; workspace: string | null }): React.ReactElement | null {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const paneSnap = React.useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot).snapshots[paneId];
  const envs = paneSnap?.rawEnvelopes ?? [];
  const sessionId = paneSnap?.sessionId ?? null;
  const [openRow, setOpenRow] = React.useState<number | null>(null);
  const file = st.file && st.file.path === st.active ? st.file : null;
  const path = file?.path ?? null;
  const activity = React.useMemo(() => (path ? fileActivity(envs, path, workspace) : []), [envs, path, workspace]);
  const state = React.useMemo(() => (path ? fileHistoryState(envs, path, workspace, file?.text ?? null) : null), [envs, path, workspace, file?.text]);
  const history = state?.rows ?? [];
  // Sprint 429: the lit row is the one the file's text now is; ⌘Z and ⌘⇧Z step from it.
  const lit = state ? litRow(state.rows, state.opened, file?.text ?? null) : null;
  React.useEffect(() => {
    setHistoryStep(state ? (back) => stepText(state.rows, state.opened, lit, back) : null);
    return () => setHistoryStep(null);
  }, [state, lit]);
  const hunks = file ? st.hunks : [];
  const outline = file ? st.outline : [];
  const lineAuthors = state?.authors ?? { lines: [], gaps: [] };
  const authors = hunks.map((hunk) => hunkAuthor(hunk, lineAuthors, history));

  // The drawn counts, for EDITOR_DRAWN and the anchor's second row; each newly drawn hunk set is written.
  const counts = { outlineRows: outline.length, hunks: hunks.length, activityRows: activity.length, historyRows: file ? history.length + 1 : 0 };
  const key = JSON.stringify(counts);
  React.useEffect(() => { editor.set({ inspector: counts }); }, [key]);
  const hunkKey = path ? JSON.stringify([path, hunks.map((hunk) => [hunk.new_start, hunk.new_count, hunk.old_count]), authors.map((a) => a?.seq ?? null)]) : "";
  React.useEffect(() => {
    if (!path) return;
    hunks.forEach((hunk, i) => {
      const a = authors[i];
      emitSignal(Signal.EDITOR_HUNK_DRAWN, { author: a ? (a.author === "hand" ? EditorHunkDrawnAuthor.HAND : EditorHunkDrawnAuthor.SESSION) : EditorHunkDrawnAuthor.UNATTRIBUTED, line_count: hunk.lines.length }, { pane_id: paneId });
    });
  }, [hunkKey]);
  React.useEffect(() => () => editor.set({ inspector: { outlineRows: 0, hunks: 0, activityRows: 0, historyRows: 0 } }), []);

  if (!file) return null;
  const lines = file.text === null ? null : file.text === "" ? 0 : file.text.replace(/\n$/, "").split("\n").length;
  const latest = history[0] ?? null;
  // OUTLINE's current symbol: the innermost one whose lines hold the caret (24a: `lineTotal … 85`).
  let current = -1;
  outline.forEach((row, i) => { if (row.line <= st.caretLine && st.caretLine <= row.end) current = i; });
  return (
    <div data-inspector="1" style={{ flex: 1, overflowY: "auto", minHeight: 0, fontSize: 11, paddingBottom: 8 }}>
      {outline.length > 0 && (
        <Plain name="outline">
          {outline.map((row, i) => (
            <div key={i} data-outline-row={row.name} data-current={i === current ? "1" : undefined}
              style={{ display: "flex", gap: 8, padding: `2px 14px 2px ${14 + row.depth * 14}px`, background: i === current ? SELECT : undefined, whiteSpace: "nowrap" }}>
              <span style={{ color: FAINT, width: 34, flex: "none" }}>{row.kind}</span>
              <span style={{ color: i === current ? BRIGHT : MID, overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
              {i === current && <span data-current-line="1" style={{ marginLeft: "auto", color: DIM }}>{row.line}</span>}
            </div>
          ))}
        </Plain>
      )}
      <Plain name="changes in this file" meta="vs main">
        {hunks.length === 0 && <div style={{ padding: "2px 14px 6px", color: DIM, fontSize: 10.5 }}>no changes against the base</div>}
        {hunks.map((hunk, i) => {
          const end = hunk.new_count > 0 ? hunk.new_start + hunk.new_count - 1 : hunk.new_start;
          const plus = hunk.lines.filter((l) => l.startsWith("+")).length, minus = hunk.lines.filter((l) => l.startsWith("-")).length;
          return (
            <div key={i} data-hunk-card={`${hunk.new_start}`} style={{ margin: "2px 14px", padding: "8px 10px", background: CARD, borderRadius: 5, fontSize: 10.5, lineHeight: 1.7 }}>
              <div style={{ display: "flex" }}><span style={{ color: TEXT }}>@@ {hunk.new_start}{end !== hunk.new_start ? `–${end}` : ""}</span><span style={{ marginLeft: "auto", color: DIM }}>+{plus} −{minus}</span></div>
              <div data-hunk-author="1" style={{ color: DIM }}>{authorLabel(authors[i])}</div>
            </div>
          );
        })}
        <div style={{ height: 6 }} />
      </Plain>
      <FindSection />
      <Folding name="activity" meta="this file in the record">
        {activity.length === 0 && <div style={{ padding: "2px 14px", color: DIM, fontSize: 10.5 }}>no calls on this file</div>}
        {activity.map((r) => (
          <React.Fragment key={r.seq}>
            <div data-activity-row={r.seq} style={{ display: "flex", gap: 8, padding: "2px 14px", fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden" }}>
              <span style={{ color: FAINT, flex: "none" }}>{r.turn !== null ? `t${r.turn}` : ""}</span>
              <span style={{ color: DIM, flex: "none", width: 30 }}>{r.seq}</span>
              <span style={{ color: MID, overflow: "hidden", textOverflow: "ellipsis" }}>{r.gist}</span>
              <span data-activity-open={r.seq} onClick={() => setOpenRow(openRow === r.seq ? null : r.seq)} style={{ marginLeft: "auto", color: FAINT, flex: "none", cursor: "pointer" }}>{openRow === r.seq ? "▾" : "◂"}</span>
            </div>
            {openRow === r.seq && (
              <div data-activity-payload={r.seq} style={{ margin: "2px 14px 6px" }}>
                <pre style={{ margin: 0, padding: "6px 9px", background: CARD, borderRadius: 4, fontFamily: "inherit", fontSize: 10.5, color: MID, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(envs.find((e) => e.seq === r.seq)?.payload ?? null, null, 2)}</pre>
                <div style={{ textAlign: "right" }}><span data-activity-meta={r.seq} title={`seq ${r.seq} in meta (⌘M)`} onClick={() => openSeq(r.seq, paneId, sessionId)} style={{ color: DIM, fontSize: 10, cursor: "pointer" }}>meta ›</span></div>
              </div>
            )}
          </React.Fragment>
        ))}
        <div style={{ height: 4 }} />
      </Folding>
      <Folding name="history">
        {history.map((r, i) => (
          <div key={r.seq} data-history-row={r.seq} title={r.stepBack ? undefined : "the record does not hold the text before this edit"}
            data-lit={lit === i ? "1" : undefined}
            style={{ display: "flex", gap: 8, padding: "3px 14px", background: lit === i ? SELECT : undefined, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ color: lit === i ? BRIGHT : MID, flex: "none" }}>{r.tool ?? "saved"} +{r.plus} −{r.minus}</span>
            <span style={{ marginLeft: "auto", color: DIM, overflow: "hidden", textOverflow: "ellipsis" }}>{r.author === "hand" ? "by hand" : `by the session · seq ${r.seq}`}</span>
          </div>
        ))}
        <div data-history-row="opened" data-lit={lit === "opened" || history.length === 0 ? "1" : undefined} style={{ display: "flex", gap: 8, padding: "3px 14px", background: lit === "opened" || history.length === 0 ? SELECT : undefined }}>
          <span style={{ color: lit === "opened" || history.length === 0 ? BRIGHT : MID }}>opened</span><span style={{ marginLeft: "auto", color: DIM }}>start of session</span>
        </div>
        {history.length > 0 && <div data-history-footer="1" style={{ padding: "3px 14px", fontSize: 10, color: FAINT }}>⌘Z steps back · ⌘⇧Z forward</div>}
        <div style={{ height: 4 }} />
      </Folding>
      <Folding name="info">
        {([
          ["path", file.path],
          ["size", `${(file.size / 1024).toFixed(1)} KB${lines !== null ? ` · ${lines} lines` : ""}`],
          ["modified", `${when(file.modified)}${latest ? ` · ${latest.author === "hand" ? "by hand" : "by the session"}` : ""}`],
          ["encoding", file.encoding === "utf-8" ? "UTF-8" : file.encoding ?? "binary"],
          ["line ends", file.lineEndings ? file.lineEndings.toUpperCase() : "—"],
          ["type", fileType(file.path)],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} data-info-row={k} style={{ display: "flex", gap: 10, padding: "2px 14px" }}>
            <span style={{ color: DIM, width: 78, flex: "none" }}>{k}</span>
            <span style={{ color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
      </Folding>
    </div>
  );
}
