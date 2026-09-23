// ReactDOM/client shim. dc-runtime uses `window.ReactDOM.createRoot`
// (support.js:196). Phase 8's atom-transcript uses the same instance
// via this shim so nested roots share React internals.

declare global { interface Window { ReactDOM: any } }

const globalScope: any = (typeof window !== "undefined" ? window : globalThis) as any;
const reactDom: any = globalScope.ReactDOM;

export const createRoot = reactDom.createRoot;
export const hydrateRoot = reactDom.hydrateRoot;
