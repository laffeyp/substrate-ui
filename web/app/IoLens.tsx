// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's i/o lens (sprint 305; plan PLAN-2026-11-04-shell-to-react-r5.md, D5): each input and output
// document on the focused session's record, titled, with its seq. Styles are the i/o block's
// in the dc-runtime template (`web/reveal.html` at `d4322e1`); the documents come from web/app/derive/io.ts.

import * as React from "react";
import { useMemo, useSyncExternalStore } from "react";
import { ioDocs } from "./derive/io";
import { stream } from "./state/stream";

export function IoLens(): React.ReactElement {
  const envs = useSyncExternalStore(stream.subscribe, stream.getSnapshot).envelopes;
  const docs = useMemo(() => ioDocs(envs), [envs]);
  return (
    <div style={{ padding: "6px 16px 16px" }}>
      {docs.map((doc) => (
        <div key={doc.seq} style={{ marginTop: 12, border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, overflow: "hidden" }}>
          <div style={{ padding: "8px 13px", background: "#26292e", fontSize: 11.5, color: "#9aa0a8" }}>{doc.title}<span style={{ float: "right", color: "#62676f", fontSize: 11 }}>seq {doc.seq}</span></div>
          <pre style={{ margin: 0, padding: "11px 13px", fontFamily: "inherit", fontSize: 12, color: "#b9bec5", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{doc.text}</pre>
        </div>
      ))}
      <div style={{ marginTop: 12, fontSize: 11, color: "#62676f" }}>inputs &amp; outputs — the application documents on this record, in seq order</div>
    </div>
  );
}
