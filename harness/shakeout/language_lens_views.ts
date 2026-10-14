// The language lens, deviation and ribbons views (UI sprints 170, 171).
//
// The deterministic driver's replies never vary, so the drift detector's warm-up never ends on
// them; the user's messages do. Steps: 23 messages of 3 to 13 words; reveal, pick language, the
// messages stream. Deviation: every turn's words bar is as wide as the route's deviation for it
// (±4 SD fill the lane), and the readout shows the signed SDs. Ribbons: every ribbon is as wide as
// the route's window value on the lane's scale (zero to its highest value or window, rounded up;
// sprint 173), with the message's own value as its hairline; the unit's hover names that scale.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { LANGUAGE_MEASURES, LANGUAGE_WATCHED } from "../../web/vm/language_measures.gen";
import { fmt, fmtSigned, LANE_W, niceCeil } from "../../web/reveal/language_lens";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const BAR = `(document.querySelector('[data-pane="1"] [data-session-bar-line]')?.textContent || "").replace(/\\s+/g, " ").trim()`;

async function type(win: Page, text: string): Promise<void> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await win.keyboard.press("Enter");
}

async function turn(win: Page, text: string): Promise<void> {
  const before = await win.evaluate(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length`) as number;
  await type(win, text);
  await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length > ${before} && /returned/.test(${BAR})`, undefined, { timeout: 20_000 });
}

const visible = (attr: string) => `Array.from(document.querySelectorAll('[${attr}]')).filter((e) => e.offsetParent !== null || e.getClientRects().length)`;

const BAR_MAX = LANE_W - 14;
const PER_SD = BAR_MAX / 2 / 4;
type Point = { turn: number; value: number; window: number | null; deviation: number | null };

async function bars(win: Page): Promise<{ turn: number; bar: number; hair: number }[]> {
  return win.evaluate(`${visible("data-lang-row")}.map((r) => ({
    turn: Number(r.getAttribute("data-lang-row")),
    bar: Number(r.querySelector("[data-lang-bar]").getAttribute("data-lang-bar")),
    hair: Number(r.querySelector("[data-lang-hair]").getAttribute("data-lang-hair")),
  }))`) as Promise<{ turn: number; bar: number; hair: number }[]>;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    for (let i = 0; i < 23; i++) await turn(win, Array(3 + ((i * 7) % 11)).fill(`w${i}`).join(" "));
    const sid = await win.evaluate(`window.__vm.get(1).snapshot().sessionId`) as string;
    const view = await win.evaluate(`fetch("/api/session/${sid}/language").then((r) => r.json())`) as { lanes: { user: Record<string, { warmup_span: number | null; points: Point[] }> } };
    const words = view.lanes.user.words;
    if (words.warmup_span === null) throw new Error("the user's words lane never finished its warm-up; the check would prove nothing");

    await win.keyboard.press("Meta+m");
    await win.getByText("language", { exact: true }).first().click();
    await win.locator('[data-lang-stream="messages"]').first().click();
    await win.locator('[data-lang-view="deviation"]').first().click();
    await win.waitForFunction(`${visible("data-lang-row")}.length === 23`, undefined, { timeout: 15_000 });
    const dev = await bars(win);
    const wantDev = words.points.map((p) => (p.deviation === null ? 0 : Math.max(1, Math.round(Math.min(4, Math.abs(p.deviation)) * PER_SD))));
    if (JSON.stringify(dev.map((d) => d.bar)) !== JSON.stringify(wantDev)) throw new Error(`deviation widths ${JSON.stringify(dev.map((d) => d.bar))}; from the route ${JSON.stringify(wantDev)}`);
    const readout = await win.evaluate(`${visible("data-lang-value")}.map((e) => (e.textContent || "").trim())[0]`) as string;
    const last = words.points[words.points.length - 1];
    if (readout.replace(/ [▲▼]$/, "") !== fmtSigned(last.deviation)) throw new Error(`readout ${readout}; the route's last deviation ${last.deviation}`);

    await win.locator('[data-lang-view="ribbons"]').first().click();
    await settled(win);
    const rib = await bars(win);
    const top = niceCeil(Math.max(...words.points.flatMap((p) => [p.value, p.window ?? 0])));
    const scale = (v: number) => Math.max(0, Math.min(1, v / top));
    const unitTitle = await win.evaluate(`${visible("data-lang-unit")}.find((e) => e.getAttribute("data-lang-unit") === "words")?.getAttribute("title")`);
    if (unitTitle !== `A full bar is ${fmt(top)} words: the highest value so far, rounded up. The scale grows when a value passes it.`) throw new Error(`the words unit's hover reads ${JSON.stringify(unitTitle)}; the route's top is ${top}`);
    const wantRib = words.points.map((p) => (p.window === null ? 0 : Math.round(scale(p.window) * BAR_MAX)));
    if (JSON.stringify(rib.map((r) => r.bar)) !== JSON.stringify(wantRib)) throw new Error(`ribbon widths ${JSON.stringify(rib.map((r) => r.bar))}; from the route's windows ${JSON.stringify(wantRib)}`);
    const wantHair = words.points.map((p) => Math.max(p.value === 0 ? 0 : 1, Math.round(scale(p.value) * BAR_MAX)));
    if (JSON.stringify(rib.map((r) => r.hair)) !== JSON.stringify(wantHair)) throw new Error(`hairline widths ${JSON.stringify(rib.map((r) => r.hair))}; from the route's values ${JSON.stringify(wantHair)}`);
    console.log(`language_lens_views: ok — 23 messages; deviation widths match the route (warm-up ${words.warmup_span} values, last ${fmtSigned(last.deviation)} SD); ribbon and hairline widths match the route's windows and values on a scale of 0–${top} (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`language_lens_views: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
