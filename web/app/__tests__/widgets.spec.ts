// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The widget registry (web/app/widgets.ts, sprint 347): a CodeMirror editor keeps its document, undo
// history and cursor when its host unmounts and another mounts, in jsdom with React 18.3.1.
//
// Run: `npm run test:unit`

import { before, test } from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

// react-dom and CodeMirror read the DOM when they load, so the DOM is set up first.
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
const globals = globalThis as unknown as Record<string, unknown>;
for (const name of ["window", "document", "navigator", "HTMLElement", "Node", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "DOMRect"]) {
  if (!(name in globals) || name === "window" || name === "document") globals[name] = (dom.window as unknown as Record<string, unknown>)[name];
}
globals.IS_REACT_ACT_ENVIRONMENT = true;

type Mods = {
  React: typeof import("react");
  client: typeof import("react-dom/client");
  view: typeof import("@codemirror/view");
  state: typeof import("@codemirror/state");
  commands: typeof import("@codemirror/commands");
  widgets: typeof import("../widgets");
};
let m: Mods;
before(async () => {
  m = {
    React: await import("react"), client: await import("react-dom/client"),
    view: await import("@codemirror/view"), state: await import("@codemirror/state"), commands: await import("@codemirror/commands"),
    widgets: await import("../widgets"),
  };
});

test("an editor keeps its document, undo history and cursor through an unmount and a remount", () => {
  const { React, client, view, state, commands, widgets } = m;
  let editor: InstanceType<typeof view.EditorView> | null = null;
  let made = 0;
  const make = () => {
    made += 1;
    editor = new view.EditorView({ state: state.EditorState.create({ doc: "one", extensions: [commands.history()] }) });
    return { dom: editor.dom, destroy: () => editor?.destroy() };
  };
  function Host() {
    const ref = widgets.useWidget("file:a.txt", make);
    return React.createElement("div", { ref, "data-host": "1" });
  }
  const box = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(box);
  const root = client.createRoot(box);
  React.act(() => { root.render(React.createElement(Host)); });
  const ed = editor!;
  // Two separate history events (edits within newGroupDelay would merge into one).
  ed.dispatch({ changes: { from: 3, insert: " two" }, annotations: commands.isolateHistory.of("full") });
  ed.dispatch({ changes: { from: 7, insert: " three" }, selection: { anchor: 4 }, annotations: commands.isolateHistory.of("full") });
  assert.strictEqual(commands.undoDepth(ed.state), 2);

  React.act(() => { root.render(React.createElement("p", null, "another view")); });
  assert.strictEqual(ed.dom.isConnected, false);
  assert.ok(widgets.hasWidget("file:a.txt"));
  React.act(() => { root.render(React.createElement(Host)); });

  assert.strictEqual(made, 1);
  assert.strictEqual(ed.dom.isConnected, true);
  assert.strictEqual(ed.state.doc.toString(), "one two three");
  assert.strictEqual(ed.state.selection.main.anchor, 4);
  assert.strictEqual(commands.undoDepth(ed.state), 2);
  commands.undo(ed);
  assert.strictEqual(ed.state.doc.toString(), "one two");

  widgets.dropWidget("file:a.txt");
  assert.strictEqual(widgets.hasWidget("file:a.txt"), false);
  React.act(() => { root.unmount(); });
});
