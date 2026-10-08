// Real driver picker for the shakeout. Reads /api/models, returns the
// server's declared default. Deterministic never comes back from this;
// the shakeout runs against real models by design.

export async function pickRealDriver(baseUrl: string): Promise<string> {
  const r = await fetch(baseUrl + "/api/models");
  if (!r.ok) throw new Error(`/api/models failed: ${r.status}`);
  const body = await r.json() as { models: string[]; default?: string };
  const roster = (body.models || []).filter((m) => m !== "deterministic");
  const declared = body.default;
  if (declared && declared !== "deterministic" && roster.includes(declared)) {
    return declared;
  }
  if (roster.length === 0) {
    throw new Error("no real models available; check Ollama or cloud keys");
  }
  return roster[0];
}

/** The driver an Axis A flow opens its session on. Axis A checks the app, not a model, so it runs on
 * the deterministic driver unless SHAKEOUT_DRIVER names one; SHAKEOUT_DRIVER=default takes the
 * server's real default (release.sh does, so a release still drives a real model through Axis A).
 * Axis B, which checks that a model can use each tool, always calls pickRealDriver. */
export async function sessionDriver(baseUrl: string): Promise<string> {
  const want = process.env.SHAKEOUT_DRIVER || "";
  if (!want) return "deterministic";
  return want === "default" ? pickRealDriver(baseUrl) : want;
}
