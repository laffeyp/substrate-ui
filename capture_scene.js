const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForSelector('.rec');
  await page.click('.rec[data-name="game_of_life"]');
  await page.waitForSelector('#gvScene');
  console.log('scene tab visible (game_of_life):', await page.$eval('#gvScene', el => getComputedStyle(el).display !== 'none'));
  await page.click('#gvScene');
  await page.waitForSelector('.scene-grid');
  const setSeq = async (v) => { await page.$eval('#seq', (el, val) => { el.value = val; el.dispatchEvent(new Event('input')); }, String(v)); await page.waitForTimeout(120); };
  for (const [seq, label] of [[261, 'gen2'], [132, 'gen1'], [3, 'gen0']]) {
    await setSeq(seq);
    const live = await page.$$eval('.scene-grid .cell.on', els => els.length);
    const total = await page.$$eval('.scene-grid .cell', els => els.length);
    console.log(`seq ${seq} (${label}): ${live} live / ${total} cells`);
    await page.screenshot({ path: `screenshots/scene_gol_${label}.png` });
  }
  await page.click('.rec[data-name="code_review"]');
  await page.waitForTimeout(250);
  console.log('scene tab hidden (code_review):', await page.$eval('#gvScene', el => getComputedStyle(el).display === 'none'));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
