// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The widget registry (sprint 347; plan process/planning/2026-11-05-editor-shared-work/, item 0(b)).
//
// Some views hold DOM of their own that React does not draw: a CodeMirror editor keeps its document,
// its undo history and its cursor in an EditorView. When the view's React host goes away (the window
// switches to another view and back, a pane moves in the grid) the widget must not be made again, or
// the history and the cursor are lost. The registry keeps one widget per key for the window's life;
// `useWidget` moves the widget's element into whichever host is showing it and takes it out, without
// destroying it, when the host unmounts. `dropWidget` destroys it, when its file closes.

import { useLayoutEffect, useRef, type RefObject } from "react";

export interface Widget {
  /** The element the widget draws in; the registry moves it between hosts. */
  dom: HTMLElement;
  destroy(): void;
}

const widgets = new Map<string, Widget>();

/** The widget for `key`, made by `make` on first use. */
export function widgetFor(key: string, make: () => Widget): Widget {
  let widget = widgets.get(key);
  if (!widget) { widget = make(); widgets.set(key, widget); }
  return widget;
}

/** Destroys the widget for `key` and forgets it. */
export function dropWidget(key: string): void {
  const widget = widgets.get(key);
  if (!widget) return;
  widgets.delete(key);
  widget.dom.remove();
  widget.destroy();
}

export function hasWidget(key: string): boolean {
  return widgets.has(key);
}

/** Attaches the widget for `key` to the returned ref's element while the component is mounted, and
 *  detaches it, keeping it, when the component unmounts. */
export function useWidget(key: string, make: () => Widget): RefObject<HTMLDivElement | null> {
  const host = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const widget = widgetFor(key, make);
    el.appendChild(widget.dom);
    return () => { if (widget.dom.parentNode === el) el.removeChild(widget.dom); };
    // `make` is used once per key; a new closure each render must not re-attach.
  }, [key]);
  return host;
}
