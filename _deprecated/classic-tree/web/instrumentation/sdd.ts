// Signal-Driven Development library for substrate-ui — TypeScript port of
// sdd-kit-2/lib/sdd.py, adapted from Katybird's src/instrumentation/sdd.ts.
// Bound to the locked vocabulary (signals/versions/0.1.json). Unknown tags throw at emit time.

import { VOCABULARY, VOCAB_VERSION, SUBSTRATE_KINDS, SUBSTRATE_PRODUCER_KINDS } from "./vocabulary";

// Foreign-key domains referenced by tag payload_types. When a spec declares
// payload_types: { field: "substrate_kind" }, the emit's value at `field` must be in this set.
// Empty producer-kind set means "no closed set exposed by substrate yet" — the emitter falls back
// to accepting any non-empty string for that domain, still catching the retyped-nothing drift.
const FK_DOMAINS: Record<string, Set<string>> = {
  substrate_kind: SUBSTRATE_KINDS,
  substrate_producer_kind: SUBSTRATE_PRODUCER_KINDS,
};

export type SignalRecord = {
  ts: number;
  name: string;
  category: string;
  stratum: string;
  payload: Record<string, unknown>;
  subject_record?: string;
};

const buffer: SignalRecord[] = [];
const sessionStart = nowMs();

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export function emit(name: string, payload: Record<string, unknown> = {}): SignalRecord {
  const spec = VOCABULARY[name];
  if (!spec) {
    throw new Error(
      `[sdd] unknown signal tag "${name}". Define it in signals/versions/0.1.json before emitting.`
    );
  }
  const missing = spec.payload.filter((f) => !(f in payload));
  if (missing.length > 0) {
    throw new Error(
      `[sdd] signal "${name}" missing required payload fields: ${missing.join(", ")}`
    );
  }
  // Sprint 030: foreign-key enforcement, split by namespace. `substrate_kind` and
  // `substrate_producer_kind` are the runtime-declared closed sets from substrate's vocabulary; a
  // real event stream also carries application-declared kinds from bundled topologies (CodeChunk,
  // ToolCall, Critique, Verdict, ...) which substrate's vocab does not enumerate. Rule: values in
  // the substrate namespace (`substrate.*`) MUST be in the closed set (catches typos like
  // "substrate.RunStartedd"). Application-namespace values need only be non-empty strings — the
  // check catches accidental "" or "unknown" fallback drift without requiring substrate's vocab to
  // list every application kind that ever ships.
  if (spec.payload_types) {
    for (const [field, domainName] of Object.entries(spec.payload_types)) {
      const value = payload[field];
      const domain = FK_DOMAINS[domainName];
      if (typeof value !== "string" || !value.length) {
        throw new Error(`[sdd] signal "${name}" field "${field}" typed as ${domainName} must be a non-empty string; got ${JSON.stringify(value)}.`);
      }
      if (domain && domain.size > 0 && value.startsWith("substrate.") && !domain.has(value)) {
        throw new Error(`[sdd] signal "${name}" field "${field}"="${value}" is in the substrate namespace but not in the ${domainName} closed set (${domain.size} known values). Refresh signals/mirror/substrate-0.2.json via 'npm run sync:substrate-vocab' or drop the emit.`);
      }
    }
  }
  const record: SignalRecord = {
    ts: +(nowMs() - sessionStart).toFixed(4),
    name,
    category: spec.category,
    stratum: spec.stratum,
    payload,
  };
  if (typeof payload.subject_record === "string") {
    record.subject_record = payload.subject_record;
  }
  buffer.push(record);
  // Expose the buffer to the Playwright harness at window.__signals so
  // e2e / capture scripts can read the trace via page.evaluate.
  if (typeof window !== "undefined") {
    (window as unknown as { __signals: SignalRecord[] }).__signals = buffer;
  }
  return record;
}

export function snapshot(): SignalRecord[] {
  return buffer.slice();
}

export function clearBuffer(): void {
  buffer.length = 0;
}

export { VOCAB_VERSION };
