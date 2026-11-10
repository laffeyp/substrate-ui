// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// EditorShell (web/app/editor/EditorShell.tsx, sprints 389–400): prop-driven layout in jsdom.
//
// Run: `npm run test:unit`

import { before, test } from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
const globals = globalThis as unknown as Record<string, unknown>;
for (const name of ["window", "document", "navigator", "HTMLElement", "Node", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "DOMRect"]) {
  if (!(name in globals) || name === "window" || name === "document") globals[name] = (dom.window as unknown as Record<string, unknown>)[name];
}
globals.IS_REACT_ACT_ENVIRONMENT = true;
// localStorage stub for column width persistence.
const store = new Map<string, string>();
const lsStub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (_i: number) => null as string | null,
};
Object.defineProperty(dom.window, "localStorage", { value: lsStub, writable: true, configurable: true });
globals.localStorage = lsStub;

type Mods = {
  React: typeof import("react");
  client: typeof import("react-dom/client");
  EditorShell: typeof import("../editor/EditorShell");
};
let m: Mods;
before(async () => {
  m = {
    React: await import("react"),
    client: await import("react-dom/client"),
    EditorShell: await import("../editor/EditorShell"),
  };
});

function renderShell(props: Partial<import("../editor/EditorShell").EditorShellProps> = {}) {
  const { React, client, EditorShell } = m;
  const box = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(box);
  const root = client.createRoot(box);
  const defaults: import("../editor/EditorShell").EditorShellProps = {
    paneId: 1,
    workspacePath: null,
    readOnly: false,
    readOnlyReason: null,
    leftFolded: false,
    rightFolded: false,
    bottomFolded: false,
    dockPosition: "bottom",
    sidesSwapped: false,
    onToggleColumn: () => {},
    onToggleDock: () => {},
    onToggleSides: () => {},
    bottom: React.createElement("div", { "data-test-bottom": "" }),
  };
  React.act(() => { root.render(React.createElement(EditorShell.EditorShell, { ...defaults, ...props })); });
  return { box, root, React };
}

test("three columns render when nothing is folded", () => {
  const { box, root, React } = renderShell();
  assert.strictEqual(box.querySelectorAll('[data-editor-column="left"]').length, 1);
  assert.strictEqual(box.querySelectorAll('[data-editor-column="centre"]').length, 1);
  assert.strictEqual(box.querySelectorAll('[data-editor-column="right"]').length, 1);
  assert.strictEqual(box.querySelectorAll('[data-editor-rail]').length, 0);
  React.act(() => { root.unmount(); });
});

test("leftFolded replaces left column with a rail", () => {
  const { box, root, React } = renderShell({ leftFolded: true });
  assert.strictEqual(box.querySelectorAll('[data-editor-column="left"]').length, 0);
  assert.strictEqual(box.querySelectorAll('[data-editor-rail="left"]').length, 1);
  assert.strictEqual(box.querySelectorAll('[data-editor-column="right"]').length, 1);
  React.act(() => { root.unmount(); });
});

test("rightFolded replaces right column with a rail", () => {
  const { box, root, React } = renderShell({ rightFolded: true });
  assert.strictEqual(box.querySelectorAll('[data-editor-column="right"]').length, 0);
  assert.strictEqual(box.querySelectorAll('[data-editor-rail="right"]').length, 1);
  assert.strictEqual(box.querySelectorAll('[data-editor-column="left"]').length, 1);
  React.act(() => { root.unmount(); });
});

test("bottomFolded replaces bottom column with a rail", () => {
  const { box, root, React } = renderShell({ bottomFolded: true });
  assert.strictEqual(box.querySelectorAll('[data-editor-column="bottom"]').length, 0);
  assert.strictEqual(box.querySelectorAll('[data-editor-rail="bottom"]').length, 1);
  React.act(() => { root.unmount(); });
});

test("dockPosition right renders bottom column in the row instead of below", () => {
  const { box, root, React } = renderShell({ dockPosition: "right" });
  assert.strictEqual(box.querySelectorAll('[data-dock="right"]').length, 1);
  assert.strictEqual(box.querySelectorAll('[data-editor-column="bottom"]').length, 1);
  React.act(() => { root.unmount(); });
});

test("readOnly renders the read-only bar with reason", () => {
  const { box, root, React } = renderShell({ readOnly: true, readOnlyReason: "session ended" });
  const bar = box.querySelector("[data-editor-readonly]");
  assert.ok(bar);
  assert.ok(bar!.textContent!.includes("session ended"));
  React.act(() => { root.unmount(); });
});

test("readOnly without reason renders the bar without a reason suffix", () => {
  const { box, root, React } = renderShell({ readOnly: true, readOnlyReason: null });
  const bar = box.querySelector("[data-editor-readonly]");
  assert.ok(bar);
  assert.strictEqual(bar!.textContent, "Read-only");
  React.act(() => { root.unmount(); });
});
