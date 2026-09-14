// harness/parity.ts — Phase 5 of the Presentation-Model plan.
//
// Two shells (`/` reveal, `/classic` sprint-051) subscribe to the same
// SessionController. This harness drives each shell against an
// identical scripted sequence and reads back the fifteen typed
// emissions from `window.__vmTape`. If both shells drove the ports
// the same way, the tag sequences match. Any drift is a shell bug.
//
// Runs headed in real Chrome (channel:'chrome'). Assumes the server
// at http://127.0.0.1:8765 is up and healthy.

import { chromium, type Browser, type Page } from "playwright";

const BASE = process.env.SUBSTRATE_UI_BASE || "http://127.0.0.1:8765";

interface TapeEntry { tag: string; payload: Record<string, unknown>; at: number; }

async function driveShell(page: Page, url: string): Promise<TapeEntry[]> {
  await page.goto(url, { waitUntil: "load" });
  // Both shells expose `window.__vm` at boot. The classic shell also
  // exposes it (phase 2a); its own state is separate but the tape is
  // shared through the same controller instance.
  await page.waitForFunction(() => Boolean((window as unknown as { __vm?: unknown }).__vm), null, { timeout: 5000 });
  // Wait for the driver roster load so DRIVER_ROSTER_LOADED lands
  // before we script actions.
  await page.waitForFunction(() => {
    const vm = (window as unknown as { __vm?: { snapshot?: () => { driverRoster?: string[] } } }).__vm;
    return !!(vm && vm.snapshot && (vm.snapshot().driverRoster ?? []).length);
  }, null, { timeout: 5000 });
  // Drive a scripted turn: open a deterministic session, send one
  // prompt, wait for a park envelope, end. Same script on both shells.
  await page.evaluate(async () => {
    const vm = (window as unknown as { __vm: {
      openSession: (opts: { driver: string }) => Promise<void>;
      sendTurn: (text: string) => Promise<void>;
      endSession: (reason: string) => Promise<void>;
      snapshot: () => { parkReason: string | null; sessionId: string | null };
    } }).__vm;
    await vm.openSession({ driver: "deterministic" });
    await vm.sendTurn("hello — parity harness");
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (vm.snapshot().parkReason) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    await vm.endSession("parity_harness_done");
    const closeDeadline = Date.now() + 5000;
    while (Date.now() < closeDeadline) {
      if (vm.snapshot().sessionId === null) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    // Let fire-and-forget loaders (loadTopologyGraph on bind) finish
    // before we read the tape.
    const settleDeadline = Date.now() + 2000;
    while (Date.now() < settleDeadline) {
      const tape = (window as unknown as { __vmTape?: { tag: string }[] }).__vmTape ?? [];
      if (tape.some((e) => e.tag === "TOPOLOGY_LOADED")) break;
      await new Promise((r) => setTimeout(r, 50));
    }
  });
  // Read the ring buffer.
  const tape = await page.evaluate(() => {
    return ((window as unknown as { __vmTape?: TapeEntry[] }).__vmTape ?? []).slice();
  });
  return tape;
}

function tagsOnly(tape: TapeEntry[]): string[] {
  return tape.map((e) => e.tag);
}

function diffTagSequences(a: string[], b: string[]): string[] {
  const drift: string[] = [];
  const setA = new Set(a);
  const setB = new Set(b);
  for (const t of setA) if (!setB.has(t)) drift.push(`only in reveal: ${t}`);
  for (const t of setB) if (!setA.has(t)) drift.push(`only in classic: ${t}`);
  // Order comparison — for tags that appear in both, check relative order.
  const shared = a.filter((t) => setB.has(t));
  const sharedB = b.filter((t) => setA.has(t));
  const len = Math.min(shared.length, sharedB.length);
  for (let i = 0; i < len; i++) {
    if (shared[i] !== sharedB[i]) {
      drift.push(`order[${i}] diverged: reveal=${shared[i]} classic=${sharedB[i]}`);
      break;
    }
  }
  return drift;
}

async function main(): Promise<void> {
  const browser: Browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const revealPage = await context.newPage();
  const classicPage = await context.newPage();

  console.log("parity harness — driving both shells against http://127.0.0.1:8765");

  const revealTape = await driveShell(revealPage, `${BASE}/`);
  const classicTape = await driveShell(classicPage, `${BASE}/classic`);

  const revealTags = tagsOnly(revealTape);
  const classicTags = tagsOnly(classicTape);

  console.log(`  reveal:  ${revealTags.length} emissions, ${new Set(revealTags).size} distinct`);
  console.log(`  classic: ${classicTags.length} emissions, ${new Set(classicTags).size} distinct`);

  const drift = diffTagSequences(revealTags, classicTags);
  if (drift.length === 0) {
    console.log("  parity: identical vocabulary emitted by both shells");
  } else {
    console.log("  parity: drift detected");
    for (const line of drift) console.log(`    · ${line}`);
  }

  await browser.close();
  process.exit(drift.length === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(2); });
