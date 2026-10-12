// Shoots every state of a mockup for its gallery (owner, 13 Oct 2026: "show how everything on the screen looks").
//   node design/system/shoot_states.js design/mockups/<nn-name>
// Reads <dir>/states.json: { "page": "page.html", "states": [ { "id", "section", "title", "hash", "widths": [1280, 390],
// "full": false, "actions": [ {"click": sel} | {"hover": sel} | {"press": key} | {"scroll": sel} | {"wait": ms} ] } ] }.
// For each state and width it loads page.html#hash, runs the actions, checks console errors, page errors, requests
// that leave the file, and horizontal overflow, and writes <dir>/gallery/<id>-<width>.png (viewport, or the full page
// when "full" is true). Phones (< 600 px) are shot at 2x. Exit 1 on any problem. Uses the pre-installed Chromium.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '.');
const spec = JSON.parse(fs.readFileSync(path.join(dir, 'states.json'), 'utf8'));
const out = path.join(dir, 'gallery');

async function act(page, a) {
  if (a.click) await page.click(a.click);
  else if (a.hover) await page.hover(a.hover, { force: true });
  else if (a.press) await page.keyboard.press(a.press);
  else if (a.scroll) await page.$eval(a.scroll, e => { e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); });
  if (a.wait || a.click || a.hover || a.press || a.scroll) await page.waitForTimeout(a.wait || 350);
}

async function shoot(browser, state, width, problems) {
  const phone = width < 600;
  const ctx = await browser.newContext({ viewport: { width, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  const tag = `${state.id} @${width}`;
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) problems.push(`${tag} console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`${tag} pageerror: ${e.message}`));
  page.on('request', r => { if (!/^(file|data):/.test(r.url())) problems.push(`${tag} external request ${r.url()}`); });
  await page.goto('file://' + path.join(dir, spec.page) + (state.hash ? '#' + state.hash : ''));
  await page.waitForTimeout(500);
  for (const a of state.actions || []) await act(page, a);
  const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
  if (sw > width) problems.push(`${tag} horizontal overflow: ${sw} > ${width}`);
  if (state.full && phone) await page.evaluate(() => { const n = document.querySelector('.mb-navbar'); if (n) { document.body.style.position = 'relative'; n.style.position = 'absolute'; } });
  await page.screenshot({ path: path.join(out, `${state.id}-${width}.png`), fullPage: !!state.full });
  await ctx.close();
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const problems = [];
  let shots = 0;
  for (const state of spec.states) for (const w of state.widths || [1280, 390]) { await shoot(browser, state, w, problems); shots++; }
  await browser.close();
  console.log(problems.length ? problems.join('\n') : `${shots} shots of ${spec.states.length} states: no console errors, no overflow, no external requests`);
  process.exit(problems.length ? 1 : 0);
})();
