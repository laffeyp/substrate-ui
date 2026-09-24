import { flow } from "./shakeout/caret_pin";
import { ServerHandle } from "./shakeout/lib/server";

async function main() {
  const server = new ServerHandle();
  await server.start();
  await server.waitHealthy(10_000);
  const results = [];
  const runs = 5;
  for (let run = 0; run < runs; run++) {
    const { defects } = await flow.run({ server, runIndex: run });
    results.push(defects);
    console.log(`[caret_pin] run ${run + 1}/${runs}: ${defects.length === 0 ? "PASS" : "FAIL"}`);
    for (const defect of defects) console.log("  - " + defect.category + ": " + defect.observed);
  }
  await server.stop();
  const failed = results.filter((r) => r.length > 0).length;
  console.log(`[caret_pin] ${runs - failed}/${runs} runs passed`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error(err); process.exit(1); });
