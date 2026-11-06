// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Mounts React components into the divs dc-runtime draws (sprint 206; plan
// PLAN-2026-11-04-shell-to-react-r5.md, A6). Generalizes web/reveal.ts:192-240.
//
// dc-runtime treats a mount div as an empty leaf and clears its children on each commit, and may
// replace the div itself. The registry keeps one React root per (kind, key). When its host is cleared
// or replaced, the root's own element is put back into the host, so the component keeps its state:
// an editor's undo history and cursor, a player's position. reveal.ts makes a new root instead, which
// loses that state. A host gone from the page unmounts its root.
//
// A root renders once, synchronously, when it attaches. A component reads what changes from its store
// (web/app/state/), so a scan, which runs on every DOM change, does no rendering.

import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

export interface MountKind {
  /** A name for the kind; it and the key name one root. */
  name: string;
  /** The hosts of this kind, e.g. `[data-vm-transcript-mount="terminal"]`. */
  selector: string;
  /** Which root a host holds within its kind, e.g. its pane id. Hosts with one key share a root. */
  key(host: HTMLElement): string;
  /** The element the root renders, read from the host when it first attaches. */
  render(host: HTMLElement): ReactElement;
  /** The root's own element takes no box (`display: contents`), so the component's elements lay out
   *  as the host's children: a component that places itself in its pane's flex column needs this. */
  contents?: boolean;
}

export interface Mounted { name: string; key: string; host: HTMLElement; }

export interface MountRegistry {
  register(kind: MountKind): void;
  /** Attach, put back or unmount roots to match the page. */
  scan(): void;
  /** Scan now and after every DOM change; the returned function stops it and unmounts every root. */
  start(): () => void;
  mounted(): Mounted[];
}

interface Rec { root: Root; inner: HTMLElement; host: HTMLElement; name: string; key: string; }

export function createMountRegistry(doc: Document = document): MountRegistry {
  const kinds: MountKind[] = [];
  const recs = new Map<string, Rec>();
  const idOf = (name: string, key: string) => `${name}\u0000${key}`;

  const scan = () => {
    const seen = new Set<string>();
    for (const kind of kinds) {
      for (const host of Array.from(doc.querySelectorAll<HTMLElement>(kind.selector))) {
        const key = kind.key(host);
        const id = idOf(kind.name, key);
        if (seen.has(id)) continue;
        seen.add(id);
        const rec = recs.get(id);
        if (rec) {
          if (rec.inner.parentNode !== host) host.appendChild(rec.inner);
          rec.host = host;
          continue;
        }
        const inner = doc.createElement("div");
        inner.setAttribute("data-mount-root", kind.name);
        inner.setAttribute("data-mount-key", key);
        if (kind.contents) inner.style.display = "contents";
        host.appendChild(inner);
        const root = createRoot(inner);
        // Render now, not on React's next task: a scan runs as a microtask after dc-runtime's commit,
        // so the area is drawn in the same frame as its host, and no frame shows the host empty
        // (sprint 263).
        flushSync(() => root.render(kind.render(host)));
        recs.set(id, { root, inner, host, name: kind.name, key });
      }
    }
    for (const [id, rec] of recs) {
      if (seen.has(id)) continue;
      rec.root.unmount();
      rec.inner.remove();
      recs.delete(id);
    }
  };

  return {
    register(kind) { kinds.push(kind); },
    scan,
    start() {
      scan();
      const view = doc.defaultView;
      if (!view) throw new Error("mount registry: the document has no window");
      const observer = new view.MutationObserver(scan);
      observer.observe(doc.body, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        for (const rec of recs.values()) { rec.root.unmount(); rec.inner.remove(); }
        recs.clear();
      };
    },
    mounted: () => [...recs.values()].map(({ name, key, host }) => ({ name, key, host })),
  };
}
