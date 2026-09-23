// React shim. dc-runtime and reveal.ts + reveal_component.ts must
// share one React instance. dc-runtime reads `window.React` at
// runtime (support.js:9-13, loaded from cdnjs at reveal.html:8).
// Vite bundles reveal.ts and reveal_component.ts; Rollup needs a
// resolvable module for `import "react"`. This shim re-exports every
// symbol the atom tree uses from `window.React`, so both consumers
// share the same instance.
//
// If a hook we need is missing here, add it. Add the corresponding
// type in `@types/react` — already installed as a dev dep.

declare global { interface Window { React: any } }

const globalScope: any = (typeof window !== "undefined" ? window : globalThis) as any;
const react: any = globalScope.React;

export default react;
export const createElement = react.createElement;
export const Fragment = react.Fragment;
export const useState = react.useState;
export const useEffect = react.useEffect;
export const useLayoutEffect = react.useLayoutEffect;
export const useMemo = react.useMemo;
export const useCallback = react.useCallback;
export const useRef = react.useRef;
export const useSyncExternalStore = react.useSyncExternalStore;
export const memo = react.memo;

export type ReactElement = any;
export type ReactNode = any;
