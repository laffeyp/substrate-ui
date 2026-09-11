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

// SUBSTRATE_HARNESS=1 → expose the JSONL sink to the renderer's Emitter.
if (process.env.SUBSTRATE_HARNESS === "1") {
  contextBridge.exposeInMainWorld("__substrateHarness", {
    append: (sig) => ipcRenderer.send("harness:emit", sig),
  });
}
