// tests/harness/e2e_studio_surface.js — Sprint 027.
//
// Cmd-S opens the Studio surface. Form is the initial view; clicking
// the canvas tab fires STUDIO_VIEW_TOGGLED{from:"form", to:"canvas"}.
// Validate with a valid name round-trips through the bridge and
// lands STUDIO_VALIDATE_REQUESTED then STUDIO_VALIDATED with the
// four counts echoed. Validate with an empty name lands
// STUDIO_VALIDATE_FAILED with the errors array. Build writes a stub
// .py to ~/.substrate/topologies/<name>.py and emits
// STUDIO_BUILD_REQUESTED then STUDIO_BUILT with record_root. Esc
// fires SURFACE_CLOSED{kind:"studio"}. Layer 5 mutex: opening Studio
// while Assay is already open fires CLOSED{assay} + OPENED{studio,
// prior_kind:"assay"} same-step. Anchor byte encodes the studio
// ordinal (2 per Layer 7).

"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { readAnchorByte } = require("./lib/anchor");
const { waitForFirstPane } = require("./lib/session");

const TOPO_NAME = "harness_studio_topo";
const TOPO_PATH = path.join(os.homedir(), ".substrate", "topologies", `${TOPO_NAME}.py`);

runHarness("e2e_studio_surface", async ({ win, check }) => {
  try { fs.unlinkSync(TOPO_PATH); } catch { /* ok */ }

  const paneId = await waitForFirstPane(win);
  const surfaceAnchor = `anchor-pane-${paneId}-surface`;

  check(await readAnchorByte(win, surfaceAnchor) === 0,
    `initial anchor-surface byte === 0`);

  // Cmd-S → OPENED{kind:"studio"}.
  const preOpen = readJsonl().length;
  await win.keyboard.press("Meta+s");
  await new Promise((r) => setTimeout(r, 400));

  const opens = readJsonl().slice(preOpen).filter((s) => s.kind === "SURFACE_OPENED");
  check(opens.length === 1, `one SURFACE_OPENED after Cmd-S (got ${opens.length})`);
  check(opens[0].payload.kind === "studio", `OPENED.kind === "studio"`);
  check(opens[0].payload.prior_kind === null, `OPENED.prior_kind === null`);
  check(await readAnchorByte(win, surfaceAnchor) === 2,
    `anchor byte === 2 (studio ordinal per Layer 7)`);

  const surface = win.locator(`[data-testid="surface-studio-${paneId}"]`);
  await surface.waitFor({ state: "attached", timeout: 3000 });
  check(await surface.getAttribute("data-studio-view") === "form",
    `Studio mounts in form view`);

  // Click canvas tab → STUDIO_VIEW_TOGGLED{from:"form", to:"canvas"}.
  const preToggle = readJsonl().length;
  await win.locator(`[data-testid="studio-view-tab-canvas-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 200));

  const toggles = readJsonl().slice(preToggle).filter((s) => s.kind === "STUDIO_VIEW_TOGGLED");
  check(toggles.length === 1, `one STUDIO_VIEW_TOGGLED (got ${toggles.length})`);
  check(toggles[0].payload.from === "form" && toggles[0].payload.to === "canvas",
    `toggle from:form to:canvas`);
  check(await surface.getAttribute("data-studio-view") === "canvas",
    `surface data-studio-view === "canvas"`);

  // Back to form.
  await win.locator(`[data-testid="studio-view-tab-form-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 200));

  // Validate with empty name → STUDIO_VALIDATE_FAILED.
  const preFail = readJsonl().length;
  await win.locator(`[data-testid="studio-validate-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 500));

  const failEmits = readJsonl().slice(preFail);
  const failReq = failEmits.filter((s) => s.kind === "STUDIO_VALIDATE_REQUESTED");
  const failed = failEmits.filter((s) => s.kind === "STUDIO_VALIDATE_FAILED");
  check(failReq.length === 1, `one STUDIO_VALIDATE_REQUESTED on empty-name validate`);
  check(failed.length === 1, `one STUDIO_VALIDATE_FAILED on empty-name validate`);
  check(Array.isArray(failed[0].payload.errors) && failed[0].payload.errors.length > 0,
    `STUDIO_VALIDATE_FAILED.errors non-empty (got ${JSON.stringify(failed[0].payload.errors)})`);

  // Type a valid name + counts.
  await win.locator(`[data-testid="studio-input-topo-name-${paneId}"]`).fill(TOPO_NAME);
  await win.locator(`[data-testid="studio-input-producerCount-${paneId}"]`).fill("2");
  await win.locator(`[data-testid="studio-input-viewCount-${paneId}"]`).fill("1");
  await win.locator(`[data-testid="studio-input-triggerCount-${paneId}"]`).fill("1");
  await win.locator(`[data-testid="studio-input-routeCount-${paneId}"]`).fill("3");
  await new Promise((r) => setTimeout(r, 200));

  // Validate with valid name → STUDIO_VALIDATED.
  const preOk = readJsonl().length;
  await win.locator(`[data-testid="studio-validate-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 500));

  const okEmits = readJsonl().slice(preOk);
  const okReq = okEmits.filter((s) => s.kind === "STUDIO_VALIDATE_REQUESTED");
  const ok = okEmits.filter((s) => s.kind === "STUDIO_VALIDATED");
  check(okReq.length === 1, `one STUDIO_VALIDATE_REQUESTED on valid validate`);
  check(ok.length === 1, `one STUDIO_VALIDATED on valid validate (got ${ok.length})`);
  check(ok[0].payload.topo_name === TOPO_NAME, `VALIDATED.topo_name echoes input`);
  check(ok[0].payload.producer_count === 2
     && ok[0].payload.view_count === 1
     && ok[0].payload.trigger_count === 1
     && ok[0].payload.route_count === 3,
    `VALIDATED counts echo input (2/1/1/3)`);

  // Build.
  const preBuild = readJsonl().length;
  await win.locator(`[data-testid="studio-build-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 700));

  const buildEmits = readJsonl().slice(preBuild);
  const buildReq = buildEmits.filter((s) => s.kind === "STUDIO_BUILD_REQUESTED");
  const built = buildEmits.filter((s) => s.kind === "STUDIO_BUILT");
  check(buildReq.length === 1, `one STUDIO_BUILD_REQUESTED`);
  check(built.length === 1, `one STUDIO_BUILT (got ${built.length})`);
  check(built[0].payload.topo_name === TOPO_NAME, `BUILT.topo_name echoes`);
  check(typeof built[0].payload.record_root === "string" && built[0].payload.record_root.length > 0,
    `BUILT.record_root is non-empty string`);
  check(fs.existsSync(TOPO_PATH),
    `topology file exists at ~/.substrate/topologies/${TOPO_NAME}.py`);

  // Esc → CLOSED.
  const preClose = readJsonl().length;
  await surface.focus();
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 300));

  const closes = readJsonl().slice(preClose).filter((s) => s.kind === "SURFACE_CLOSED");
  check(closes.length === 1 && closes[0].payload.kind === "studio",
    `one SURFACE_CLOSED{studio} after Esc`);
  check(await readAnchorByte(win, surfaceAnchor) === 0, `anchor byte back to 0`);
  check(await win.locator(`[data-testid="surface-studio-${paneId}"]`).count() === 0,
    `Studio surface unmounts on close`);

  // Layer 5 mutex — Assay first, then Studio.
  await win.keyboard.press("Meta+a");
  await new Promise((r) => setTimeout(r, 300));
  const preMutex = readJsonl().length;
  await win.keyboard.press("Meta+s");
  await new Promise((r) => setTimeout(r, 400));

  const mutexEmits = readJsonl().slice(preMutex);
  const cList = mutexEmits.filter((s) => s.kind === "SURFACE_CLOSED");
  const oList = mutexEmits.filter((s) => s.kind === "SURFACE_OPENED");
  check(cList.length === 1 && cList[0].payload.kind === "assay",
    `mutex fires CLOSED{assay}`);
  check(oList.length === 1 && oList[0].payload.kind === "studio",
    `mutex fires OPENED{studio}`);
  check(oList[0].payload.prior_kind === "assay",
    `mutex OPENED.prior_kind === "assay"`);
  check(await readAnchorByte(win, surfaceAnchor) === 2, `anchor byte 2 after mutex switch`);

  // Teardown-close for symmetry (F-5). Refocus the surface first —
  // the Esc handler lives on the surface element, not the window.
  await win.locator(`[data-testid="surface-studio-${paneId}"]`).focus();
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  const finalEmits = readJsonl();
  const final_opens = finalEmits.filter((s) => s.kind === "SURFACE_OPENED").length;
  const final_closes = finalEmits.filter((s) => s.kind === "SURFACE_CLOSED").length;
  check(final_opens === final_closes,
    `SURFACE_OPENED === SURFACE_CLOSED after teardown (${final_opens} vs ${final_closes})`);

  try { fs.unlinkSync(TOPO_PATH); } catch { /* ok */ }
});
