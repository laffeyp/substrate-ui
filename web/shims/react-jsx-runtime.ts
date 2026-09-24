// JSX-runtime shim for the react-jsx automatic transform.
// tsc compiles `<div />` into `_jsx("div", { children }, key)`,
// imported from `react/jsx-runtime`. React 17+ exposes those helpers
// on the same module; the UMD build ships them at `window.React.jsx`
// when available. When it doesn't (some UMD builds omit them), we
// translate to `React.createElement` — its signature differs:
// createElement(type, props, ...children). Passing `key` positionally
// as the third arg lands it as a *child*, overwriting `props.children`;
// every rendered paragraph would then read as its map index. Extract
// children from config, put key on rest, and call createElement with
// children spread as the trailing positional args.

// The Window.React type is declared alongside the primary React shim
// (see react.ts); this file re-uses that global rather than
// re-declaring an incompatible one.

interface ReactJsxRuntime {
  jsx?: (type: unknown, config: unknown, key?: unknown) => unknown;
  jsxs?: (type: unknown, config: unknown, key?: unknown) => unknown;
  jsxDEV?: (type: unknown, config: unknown, key?: unknown) => unknown;
  createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown;
  Fragment: unknown;
}

const react = ((typeof window !== "undefined" ? window : globalThis) as { React: ReactJsxRuntime }).React;

function translate(type: unknown, config: unknown, key?: unknown): unknown {
  const source = (config ?? {}) as { children?: unknown; [k: string]: unknown };
  const { children, ...rest } = source;
  if (key !== undefined) (rest as { key?: unknown }).key = key;
  if (Array.isArray(children)) {
    return react.createElement(type, rest, ...children);
  }
  if (children === undefined) {
    return react.createElement(type, rest);
  }
  return react.createElement(type, rest, children);
}

export const jsx = react.jsx ?? translate;
export const jsxs = react.jsxs ?? translate;
export const jsxDEV = react.jsxDEV ?? translate;
export const Fragment = react.Fragment;
