// JSX-runtime shim for the react-jsx automatic transform.
// tsc compiles `<div />` into `_jsx("div", ...)`, imported from
// `react/jsx-runtime`. React 17+ exposes those helpers on the same
// module; the UMD build ships them at `window.React.jsx` etc.

declare global { interface Window { React: any } }

const globalScope: any = (typeof window !== "undefined" ? window : globalThis) as any;
const react: any = globalScope.React;

// The UMD build's jsx-runtime lives under `React` at these names.
// Some builds put them at the top level; others at `.jsx-runtime`.
// Read whichever is defined.
export const jsx = react.jsx ?? react.createElement;
export const jsxs = react.jsxs ?? react.createElement;
export const jsxDEV = react.jsxDEV ?? react.createElement;
export const Fragment = react.Fragment;
