// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's scene lens (sprint 305; plan PLAN-2026-11-04-shell-to-react-r5.md, D5): the latest 2-D grid
// on the focused session's record, or the template's line when there is none. Styles are the scene
// block's in the dc-runtime template (`web/reveal.html` at `d4322e1`); the grid comes from
// web/app/derive/scene.ts.

import * as React from "react";
import { useMemo, useSyncExternalStore } from "react";
import { sceneOf } from "./derive/scene";
import { stream } from "./state/stream";

const note: React.CSSProperties = { color: "#62676f", fontSize: 11.5 };

export function SceneLens(): React.ReactElement {
  const envs = useSyncExternalStore(stream.subscribe, stream.getSnapshot).envelopes;
  const scene = useMemo(() => sceneOf(envs), [envs]);
  return (
    <div style={{ padding: "10px 16px 16px" }}>
      {scene.kind === "grid" && <>
        <div style={{ fontSize: 12, color: "#9aa0a8" }}>scene · <span style={{ color: "#e2e5e9" }}>grid</span> <span style={{ color: "#62676f" }}>{scene.rows}×{scene.cols}</span></div>
        <div data-scene-grid={`${scene.rows}x${scene.cols}`} style={{ display: "grid", gridTemplateColumns: `repeat(${scene.cols || 12}, 1fr)`, gap: 3, maxWidth: 420, marginTop: 12 }}>
          {scene.cells.map((bg, at) => <div key={at} style={{ aspectRatio: "1", borderRadius: 3, background: bg, border: "1px solid rgba(255,255,255,.06)" }} />)}
        </div>
      </>}
      {scene.kind === "none" && <div style={note}>no 2-D grid on this record. the scene lens appears only when the record carries a renderable 2-D shape (e.g. game_of_life's Generation.grid).</div>}
    </div>
  );
}
