// tests/harness/tonal-checks.js — the three standing tonal-rule assertions
// every sprint's e2e_*.js calls at every observation step (Sprint 048 reshape).
//
// D45: no cost / money display anywhere.
// D46: no emoji in shell-generated strings.
// D32: labels never wrap (shrink → ellipsize → tooltip; never wrap).
//
// Fail loud with the offending selector so regression attributes to the
// sprint that introduced it, not to the final audit.

"use strict";

const CURRENCY_RX = /[\$¢€£]|\bcost\b|\bprice\b|\btokens\/\$\b/i;
const EMOJI_RX = /\p{Extended_Pictographic}/u;

function q(text) {
  return typeof text === "string" ? text : "";
}

async function assertNoCurrency(page) {
  const bodyText = await page.evaluate(() => document.body.innerText || "");
  const m = bodyText.match(CURRENCY_RX);
  if (m) throw new Error(`tonal.currency: shell-rendered text contains currency-like token '${m[0]}'`);
}

async function assertNoEmoji(page) {
  const bodyText = await page.evaluate(() => document.body.innerText || "");
  const m = bodyText.match(EMOJI_RX);
  if (m) throw new Error(`tonal.emoji: shell-rendered text contains emoji '${m[0]}'`);
}

async function assertNoWrap(page) {
  const bad = await page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll(".label");
    for (const el of els) {
      const ws = getComputedStyle(el).whiteSpace;
      if (ws !== "nowrap" && ws !== "pre") out.push({ selector: el.tagName + "." + [...el.classList].join("."), whiteSpace: ws });
    }
    return out;
  });
  if (bad.length) throw new Error(`tonal.nowrap: ${bad.length} labels wrap; first: ${JSON.stringify(bad[0])}`);
}

async function runTonalChecks(page) {
  await assertNoCurrency(page);
  await assertNoEmoji(page);
  await assertNoWrap(page);
}

module.exports = { assertNoCurrency, assertNoEmoji, assertNoWrap, runTonalChecks };
void q; // reserved for future use
