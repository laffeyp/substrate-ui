// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The mount registry (web/app/mount.ts, sprint 206), in jsdom with React 18.3.1.
//
// Run: `npm run test:unit`

import { before, test } from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

// react-dom reads `window` and `document` when it loads, so the DOM is set up first and the modules
// under test are imported after it.
const dom = new JSDOM("<!doctype html><html><body></body></html>");
const globals = globalThis as unknown as Record<string, unknown>;
globals.window = dom.window;
globals.document = dom.window.document;
globals.HTMLElement = dom.window.HTMLElement;
globals.IS_REACT_ACT_ENVIRONMENT = true;

type React = typeof import("react");
type Mount = typeof import("../mount");
let React: React;
let mount: Mount;
before(async () => {
  React = await import("react");
  mount = await import("../mount");
});

const doc = () => dom.window.document;
const act = (fn: () => void) => React.act(fn);
const host = (pane: string) => {
  const el = doc().createElement("div");
  el.setAttribute("data-test-mount", "1");
  el.setAttribute("data-pane-id", pane);
  return el;
};

// A component with state and a count of its mounts, so a test can tell "kept" from "made again".
const mounts: Record<string, number> = {};
const unmounts: Record<string, number> = {};
function counter(pane: string) {
  return function Counter() {
    const [n, setN] = React.useState(0);
    React.useEffect(() => {
      mounts[pane] = (mounts[pane] ?? 0) + 1;
      return () => { unmounts[pane] = (unmounts[pane] ?? 0) + 1; };
    }, []);
    return React.createElement("button", { "data-counter": pane, onClick: () => setN((x) => x + 1) }, `n=${n}`);
  };
}
const registry = () => {
  const r = mount.createMountRegistry(doc());
  r.register({
    name: "test",
    selector: "[data-test-mount]",
    key: (el) => el.getAttribute("data-pane-id") ?? "",
    render: (el) => React.createElement(counter(el.getAttribute("data-pane-id") ?? "")),
  });
  return r;
};
const button = (pane: string) => doc().querySelector<HTMLButtonElement>(`[data-counter="${pane}"]`);
const click = (pane: string) => act(() => { button(pane)!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); });

test("a host gets its component", () => {
  doc().body.innerHTML = "";
  const el = host("a1");
  doc().body.appendChild(el);
  const r = registry();
  act(() => r.scan());
  assert.strictEqual(button("a1")?.textContent, "n=0");
  assert.deepStrictEqual(r.mounted().map((m) => m.key), ["a1"]);
});

test("a host whose children are cleared gets the same root back, with its state", () => {
  doc().body.innerHTML = "";
  const el = host("b1");
  doc().body.appendChild(el);
  const r = registry();
  act(() => r.scan());
  click("b1"); click("b1");
  assert.strictEqual(button("b1")?.textContent, "n=2");
  el.innerHTML = ""; // what dc-runtime does to a mount div on each commit
  assert.strictEqual(button("b1"), null);
  act(() => r.scan());
  assert.strictEqual(button("b1")?.textContent, "n=2");
  assert.strictEqual(mounts.b1, 1);
  click("b1");
  assert.strictEqual(button("b1")?.textContent, "n=3", "events still reach the component after it is put back");
});

test("a host replaced by a new element with the same key keeps the state", () => {
  doc().body.innerHTML = "";
  const old = host("c1");
  doc().body.appendChild(old);
  const r = registry();
  act(() => r.scan());
  click("c1");
  const fresh = host("c1");
  old.replaceWith(fresh);
  act(() => r.scan());
  assert.strictEqual(fresh.querySelector("[data-counter]")?.textContent, "n=1");
  assert.strictEqual(mounts.c1, 1);
  assert.strictEqual(r.mounted()[0].host, fresh);
});

test("a host gone from the page unmounts its component", () => {
  doc().body.innerHTML = "";
  const h1 = host("d1");
  const h2 = host("d2");
  doc().body.append(h1, h2);
  const r = registry();
  act(() => r.scan());
  assert.deepStrictEqual(r.mounted().map((m) => m.key).sort(), ["d1", "d2"]);
  h2.remove();
  act(() => r.scan());
  assert.deepStrictEqual(r.mounted().map((m) => m.key), ["d1"]);
  assert.strictEqual(unmounts.d2, 1);
  assert.strictEqual(unmounts.d1, undefined);
});

test("start() puts a cleared root back without a manual scan, and its stop unmounts", async () => {
  doc().body.innerHTML = "";
  const el = host("e1");
  doc().body.appendChild(el);
  const r = registry();
  let stop = () => {};
  act(() => { stop = r.start(); });
  click("e1");
  el.innerHTML = "";
  await new Promise((resolve) => setTimeout(resolve, 0)); // MutationObserver callbacks run as microtasks
  assert.strictEqual(button("e1")?.textContent, "n=1");
  act(() => stop());
  assert.strictEqual(button("e1"), null);
  assert.strictEqual(unmounts.e1, 1);
  assert.deepStrictEqual(r.mounted(), []);
});
