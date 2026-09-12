// electron/preload.js
// Exposes window.substrate to the renderer. Two APIs:
//   substrate.send({op, args})       — dispatch to the Python bridge
//   substrate.onMessage(cb)          — every bridge message
//   substrate.onHello(cb)            — filtered: only {op:hello, ...}
//   substrate.onDead(cb)             — bridge died
// When SUBSTRATE_HARNESS=1, also exposes:
//   window.__substrateHarness.append(sig)  — renderer signals to the JSONL sink

const { contextBridge, ipcRenderer } = require("electron");

const listeners = new Set();
const helloListeners = new Set();
const deadListeners = new Set();

ipcRenderer.on("bridge:message", (_e, msg) => {
  for (const l of listeners) {
    try { l(msg); } catch (err) { console.error("[substrate] listener threw", err); }
  }
  if (msg && msg.op === "hello") {
    for (const h of helloListeners) {
      try { h(msg); } catch (err) { console.error("[substrate] hello listener threw", err); }
    }
  }
});

ipcRenderer.on("bridge:dead", () => {
  for (const d of deadListeners) {
    try { d(); } catch (err) { console.error("[substrate] dead listener threw", err); }
  }
});

contextBridge.exposeInMainWorld("substrate", {
  send: (msg) => ipcRenderer.invoke("bridge:send", msg),
  onMessage: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
  onHello:   (cb) => { helloListeners.add(cb); return () => helloListeners.delete(cb); },
  onDead:    (cb) => { deadListeners.add(cb); return () => deadListeners.delete(cb); },
});

// window.bridge.request(op, payload, timeoutMs?) — the promise-shaped
// request/reply wrapper the prototype's Component class calls. Every
// bridge op fires with a fresh request_id and waits for the matching
// reply message on the shared onMessage stream.
const pending = new Map();
listeners.add((msg) => {
  if (msg && msg.op === "reply" && typeof msg.request_id === "string") {
    const p = pending.get(msg.request_id);
    if (!p) return;
    pending.delete(msg.request_id);
    clearTimeout(p.timer);
    if (msg.ok) p.resolve(msg.result);
    else p.reject(new Error(msg.reason || "bridge_error"));
  }
});
function mintRequestId() {
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}
contextBridge.exposeInMainWorld("bridge", {
  request: (op, payload = {}, timeoutMs = 60000) => new Promise((resolve, reject) => {
    const request_id = mintRequestId();
    const timer = setTimeout(() => {
      pending.delete(request_id);
      reject(new Error("bridge_timeout"));
    }, timeoutMs);
    pending.set(request_id, { resolve, reject, timer });
    ipcRenderer.invoke("bridge:send", { op, request_id, ...payload });
  }),
});

// SUBSTRATE_HARNESS=1 → expose the JSONL sink to the renderer's Emitter,
// plus an optional default-driver override for real-model harnesses.
if (process.env.SUBSTRATE_HARNESS === "1") {
  contextBridge.exposeInMainWorld("__substrateHarness", {
    append: (sig) => ipcRenderer.send("harness:emit", sig),
    defaultDriver: process.env.SUBSTRATE_HARNESS_DRIVER || null,
  });
}
