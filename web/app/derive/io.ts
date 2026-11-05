// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's i/o lens (sprint 303; plan PLAN-2026-11-04-shell-to-react-r5.md, D5): the application
// documents on the record, in seq order. Moved from reveal_component.ts's renderVals (`ioDocs`).

import { EnvelopeKind } from "../../vm/kinds";
import type { RawEnvelope } from "./stream";

export interface IoDoc { seq: number; title: string; text: string; }

const IO_KINDS: ReadonlySet<string> = new Set([EnvelopeKind.UserMessage, EnvelopeKind.ModelReply, EnvelopeKind.FinalAnswer, EnvelopeKind.ToolResult]);

/** A tool's output as text: a string as it is, else its stdout or text, else its JSON. */
function outputText(output: unknown): string {
  if (typeof output === "string") return output;
  if (!output) return "";
  const out = output as { stdout?: unknown; text?: unknown };
  return String(out.stdout || out.text || JSON.stringify(output));
}

export function ioDocs(envs: readonly RawEnvelope[]): IoDoc[] {
  return envs.filter((env) => env && env.payload && IO_KINDS.has(env.kind)).map((env) => {
    const p = env.payload ?? {};
    const tool = env.kind === EnvelopeKind.ToolResult;
    const title = env.kind === EnvelopeKind.UserMessage ? "UserMessage · input"
      : env.kind === EnvelopeKind.ModelReply ? "ModelReply · output"
      : env.kind === EnvelopeKind.FinalAnswer ? "FinalAnswer · output"
      : `ToolResult · ${(typeof p.tool === "string" && p.tool) || "tool"}`;
    return { seq: env.seq, title, text: tool ? outputText(p.output) : String(p.text || p.assembled_prompt || "") };
  });
}
