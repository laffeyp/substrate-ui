// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Diagnosis probe (not a gate): "choose folder…" then a live model, on a COPY of ~/.substrate and the
// machine's live roster. Records every change of the model half's armed flag and the placeholder,
// with the clicks, so a kick back to the workspace column shows what preceded it.
// PROBE_MODEL=<model> (default kimi-k2.7-code:cloud). SHAKEOUT_APP=<Substrate.app> for a bundle.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "../lib/electron";

async function main(): Promise<void> {
  const folder = join(__dirname, "..", ".scratch", "probe-folder-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const target = process.env.PROBE_MODEL || "kimi-k2.7-code:cloud";
  const launch = launchArgs({ roster: "live" });
  cpSync(join(homedir(), ".substrate"), launch.state, { recursive: true, filter: (s) => !s.endsWith("daemon.sock") });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    await app.evaluate(({ dialog }, picked) => {
      (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = async () => ({ canceled: false, filePaths: [picked] });
    }, folder);
    const win = await app.firstWindow({ timeout: 30_000 });
    win.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 300)));
    win.on("pageerror", (e) => console.log("[pageerror]", e.message));
    win.on("response", async (r) => {
      if (r.status() >= 400) console.log("[http]", r.status(), r.request().method(), r.url(), (r.request().postData() || "").slice(0, 400), "->", (await r.text().catch(() => "")).slice(0, 400));
    });
    await waitForApp(win);
    await win.evaluate(`(() => {
      window.__log = [];
      var t0 = performance.now();
      var say = function (s) { window.__log.push(Math.round(performance.now() - t0) + " " + s); };
      var label = function (el) { var out = []; for (var e = el, k = 0; e && k < 3; e = e.parentElement, k++) out.push(e.tagName + (e.getAttribute && e.getAttribute("data-model-row") ? "[model=" + e.getAttribute("data-model-row") + "]" : "")); return out.join("<"); };
      ["mousedown", "click", "keydown", "focus", "blur"].forEach(function (t) { window.addEventListener(t, function (ev) { say(t + " " + (ev.key || "") + " " + label(ev.target)); }, true); });
      var poll = function () {
        var half = document.querySelector("[data-model-half]");
        var inp = document.querySelector("input[data-ws-input]");
        var s = (half ? half.getAttribute("data-armed") : "none") + " | " + (inp ? inp.placeholder : "no input") + " | bar=" + !!document.querySelector("[data-input-bar]") + " | lit=" + Array.from(document.querySelectorAll('[data-model-row][data-lit="1"]')).map(function (e) { return e.getAttribute("data-model-row"); }).join(",") + " | rows=" + document.querySelectorAll("[data-model-row]").length;
        if (s !== window.__last) { window.__last = s; say("state " + s); }
        requestAnimationFrame(poll);
      };
      poll();
    })()`);
    if (process.env.PROBE_CMD_O) {
      await win.locator("input[data-ws-input]").first().click();
      await app.evaluate(({ BrowserWindow }, picked) => { BrowserWindow.getAllWindows()[0].webContents.send("menu:open-record", { path: picked }); }, folder);
      await win.waitForTimeout(1500);
      await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED"), undefined, { timeout: 15_000 }).catch(() => undefined);
      const m = win.locator('[data-model-row="deterministic"] > span, [data-model-row="cli agents"] > span').first();
      if (await m.isVisible().catch(() => false)) await m.click();
      await win.waitForTimeout(500);
      console.log("signals:", ((await win.evaluate(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).map((x) => x.name).slice(-12).join(" ")))));
      console.log("notes:", JSON.stringify(await win.evaluate(() => (document.body.innerText || "").split("\n").filter((l) => /record|error|not|refus/i.test(l)).slice(0, 12))));
      console.log((await win.evaluate(() => (window as unknown as { __log: string[] }).__log)).join("\n"));
      return;
    }
    if (process.env.PROBE_CLICK_KEYS) {
      await win.getByText("choose folder…", { exact: true }).first().click();
      await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => console.log("not armed"));
      await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED"), undefined, { timeout: 15_000 }).catch(() => undefined);
      console.log("active before keys:", await win.evaluate(() => document.activeElement ? document.activeElement.tagName : "none"));
      for (const k of (process.env.PROBE_CLICK_KEYS).split(",")) { await win.keyboard.press(k); await win.waitForTimeout(150); }
      console.log((await win.evaluate(() => (window as unknown as { __log: string[] }).__log)).join("\n"));
      return;
    }
    if (process.env.PROBE_KEYS) {
      const inp = win.locator("input[data-ws-input]").first();
      await inp.click();
      const rows = await win.evaluate(() => Array.from(document.querySelectorAll("[data-ws-lit]")).map((e) => (e.textContent || "").trim().slice(0, 40)));
      const at = rows.findIndex((t) => t.startsWith("choose folder"));
      console.log("ws rows:", JSON.stringify(rows), "choose at", at);
      for (let i = 0; i < at; i++) await win.keyboard.press("ArrowDown");
      await win.keyboard.press("Enter");
      await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => console.log("not armed by keys"));
      await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED"), undefined, { timeout: 15_000 }).catch(() => undefined);
      for (const k of (process.env.PROBE_KEYS).split(",")) { await win.keyboard.press(k); await win.waitForTimeout(0); }
      console.log((await win.evaluate(() => (window as unknown as { __log: string[] }).__log)).join("\n"));
      return;
    }
    await win.getByText("choose folder…", { exact: true }).first().click();
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
    await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED"), undefined, { timeout: 15_000 }).catch(() => undefined);
    const row = win.locator(`[data-model-row="${target}"] > span`).first();
    for (const group of ["cli agents", "ollama · cloud", "ollama · local"]) {
      if (await row.isVisible()) break;
      const header = win.locator(`[data-model-row="${group}"] > span`).first();
      if (await header.isVisible()) await header.click();
    }
    console.log("model rows:", JSON.stringify(await win.evaluate(() => Array.from(document.querySelectorAll("[data-model-row]")).map((e) => e.getAttribute("data-model-row")))));
    if (await row.isVisible()) await row.click(); else console.log("model row not visible:", target);
    await win.locator('[data-guidance-row="auto"][data-lit="1"]').first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => console.log("guidance did not open"));
    for (const line of ["guidance:auto", "length:normal", "tone:neutral"]) {
      const [l, pos] = line.split(":");
      const r = win.locator(`[data-${l}-row="${pos}"]`).first();
      if (await r.isVisible().catch(() => false)) await r.click();
    }
    await win.locator("[data-input-bar]").first().waitFor({ state: "visible", timeout: 5_000 }).then(() => console.log("input bar shown")).catch(() => console.log("no input bar"));
    await win.waitForTimeout(0);
    console.log((await win.evaluate(() => (window as unknown as { __log: string[] }).__log)).join("\n"));
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
}
main();
