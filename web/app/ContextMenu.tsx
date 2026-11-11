// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's right-click menu, drawn (sprint 457; roadmap r13 E10.4; D94). One for the whole window, mounted
// once by App; its state and keys are state/context_menu.ts. It opens at the pointer, moved left or up to stay in
// the window, over everything else. Each item reads its words with what it acts on dim beside it ("Add to message
// cart.ts 85–89"). The pointer lights an item and a click picks it; a press anywhere else, or the window losing
// focus, closes the menu. Colours are the editor's: the card #212327, the lit row #2e3138.

import * as React from "react";
import { closeMenu, contextMenu, lightMenu, pickMenu } from "./state/context_menu";
import { ContextMenuClosedOutcome } from "../vm/signals.gen";

const EDGE = 4;

export function ContextMenu(): React.ReactElement | null {
  const s = React.useSyncExternalStore(contextMenu.subscribe, contextMenu.getSnapshot, contextMenu.getSnapshot);
  const box = React.useRef<HTMLDivElement>(null);
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null);

  // Placed once it is drawn and its size known; focused so ↑ ↓ ↵ and Escape come to the window from it.
  React.useLayoutEffect(() => {
    if (!s.open || !box.current) { setAt(null); return; }
    const r = box.current.getBoundingClientRect();
    setAt({ x: Math.max(EDGE, Math.min(s.x, window.innerWidth - r.width - EDGE)), y: Math.max(EDGE, Math.min(s.y, window.innerHeight - r.height - EDGE)) });
    box.current.focus({ preventScroll: true });
  }, [s.open, s.x, s.y, s.items]);

  React.useEffect(() => {
    if (!s.open) return;
    const press = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) closeMenu(ContextMenuClosedOutcome.OUTSIDE); };
    const blur = () => closeMenu(ContextMenuClosedOutcome.BLUR);
    window.addEventListener("pointerdown", press, true);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("pointerdown", press, true); window.removeEventListener("blur", blur); };
  }, [s.open]);

  if (!s.open) return null;
  return (
    <div ref={box} data-context-menu={s.source ?? ""} tabIndex={-1} role="menu" onContextMenu={(e) => e.preventDefault()}
      style={{ position: "fixed", left: at?.x ?? s.x, top: at?.y ?? s.y, visibility: at ? "visible" : "hidden", zIndex: 1000, minWidth: 180, padding: "4px 0", borderRadius: 6, background: "#212327", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 6px 20px rgba(0,0,0,.45)", fontSize: 12, outline: "none" }}>
      {s.items.map((item, k) => (
        <div key={k} data-context-item={item.label} data-lit={k === s.lit ? "1" : "0"} role="menuitem"
          onPointerMove={() => lightMenu(k)} onClick={() => pickMenu(k)}
          style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "3px 12px", cursor: "default", whiteSpace: "nowrap", color: "#d7dade", background: k === s.lit ? "#2e3138" : undefined }}>
          <span>{item.label}</span>
          {item.detail ? <span data-context-detail="1" style={{ marginLeft: "auto", color: "#62676f", fontSize: 11 }}>{item.detail}</span> : null}
        </div>
      ))}
    </div>
  );
}
