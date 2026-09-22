// The Flow interface every shakeout file implements. A flow declares
// which tags it expects, and how to drive one run.

import type { EmittedRecord, Defect, RunResult } from "./report";
import type { ServerHandle } from "./server";

export interface FlowContext {
  server: ServerHandle;
  runIndex: number;
}

export interface Flow {
  name: string;
  declared: string[];
  run(ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }>;
}

export type { EmittedRecord, Defect, RunResult };

export async function withTiming<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - start };
}
