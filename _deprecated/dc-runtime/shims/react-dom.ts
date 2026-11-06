// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// `react-dom` for the Vite bundle: the window's ReactDOM (the UMD copy dc-runtime uses), as
// react-dom-client.ts gives `react-dom/client`. The mount registry needs `flushSync` from the same
// instance that made its roots, so that a root it attaches renders before the next frame (sprint 262).
// Bundling node_modules' react-dom instead would give a second ReactDOM whose flushSync cannot flush
// roots the window's copy made.

const globalScope: any = (typeof window !== "undefined" ? window : globalThis) as any;
const reactDom: any = globalScope.ReactDOM;

export const flushSync = reactDom.flushSync;
