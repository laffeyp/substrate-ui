// A NodeSubstrateClient copy for the shakeout harness. Same shape as
// harness/vm_smoke.ts — HTTP fetch + a tiny SSE reader over Node's
// http module. Lets each flow build a SessionController and drive it
// without a browser in the loop.

import http from "node:http";
import type {
  FetchOpts, FetchResult, StreamHandlers, SubstrateClient, Unsubscribe,
} from "../../../web/vm/client";

export class NodeSubstrateClient implements SubstrateClient {
  constructor(private readonly baseUrl: string) {}

  async fetchJson<T>(pathPart: string, opts: FetchOpts = {}): Promise<FetchResult<T>> {
    const url = this.baseUrl + pathPart;
    const method = opts.method || "GET";
    const headers: Record<string, string> = { ...(opts.headers || {}) };
    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    let response: Response;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    try {
      response = await fetch(url, { method, headers, body, signal: ac.signal });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, failureClass: "network", detail };
    } finally {
      clearTimeout(timer);
    }
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      let failureClass = "http_error"; let detail = text;
      try {
        const parsed = JSON.parse(text) as { failure_class?: string; detail?: string };
        if (parsed && typeof parsed.failure_class === "string") failureClass = parsed.failure_class;
        if (parsed && typeof parsed.detail === "string") detail = parsed.detail;
      } catch { /* keep raw */ }
      return { ok: false, status: response.status, failureClass, detail };
    }
    if (!text) return { ok: true, data: null as unknown as T };
    try { return { ok: true, data: JSON.parse(text) as T }; }
    catch (err) { return { ok: false, status: response.status, failureClass: "json_parse", detail: String(err) }; }
  }

  streamRecord(sessionId: string, sinceSeq: number, handlers: StreamHandlers): Unsubscribe {
    const url = new URL(this.baseUrl + `/api/session/${encodeURIComponent(sessionId)}/events?since_seq=${sinceSeq}`);
    // Track whether the stream reached its natural terminus (RunFinalised).
    // The browser's BrowserSubstrateClient distinguishes onError (transient
    // drop, controller will reconnect) from onClose (terminal, stop
    // reconnecting) via EventSource.readyState. Node's http.get has no such
    // state: a socket close fires `response.on("end")` whether the server
    // said its piece or died mid-stream. Mirror the browser semantic by
    // watching the envelope payload — anything ending BEFORE RunFinalised
    // is onError; after, onClose. Matches what handleStreamError vs
    // handleStreamClose in session_controller.ts expect.
    let sawRunFinalised = false;
    let unsubscribed = false;
    const request = http.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { Accept: "text/event-stream" },
    }, (response) => {
      if (response.statusCode !== 200) {
        handlers.onError?.(new Error(`sse status ${response.statusCode}`));
        response.resume();
        return;
      }
      handlers.onOpen?.();
      let buffer = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        buffer += chunk;
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trimStart();
          try {
            const env = JSON.parse(payload);
            if (env && typeof env === "object" && (env as { kind?: string }).kind === "substrate.RunFinalised") {
              sawRunFinalised = true;
            }
            handlers.onEnvelope(env);
          } catch (err) { handlers.onError?.(err); }
        }
      });
      response.on("end", () => {
        if (unsubscribed) return;
        if (sawRunFinalised) handlers.onClose?.();
        else handlers.onError?.(new Error("sse socket closed before RunFinalised"));
      });
      response.on("error", (err) => { if (!unsubscribed) handlers.onError?.(err); });
    });
    request.on("error", (err) => { if (!unsubscribed) handlers.onError?.(err); });
    return () => { unsubscribed = true; request.destroy(); };
  }
}
