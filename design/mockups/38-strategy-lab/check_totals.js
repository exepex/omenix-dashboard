// Playwright check that every "Both books together" line adds up as shown: the stock part plus the F&O part equals the
// total, to the rupee (judge 55, minor 1: the total had been summed before rounding).
//   node design/mockups/38-strategy-lab/check_totals.js [hash ...]     (exit 1 on a line that does not add up)
const { chromium } = require('playwright'); const path = require('path');
const num = s => s === 'none' ? 0 : Number(s.replace(/[^\d−-]/g, '').replace('−', '-'));
(async () => {
  const hashes = process.argv.slice(2).length ? process.argv.slice(2) : ['ex=early', 'ex=review', 'ex=review&asset=fno'];
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }), file = 'file://' + path.resolve(__dirname, 'page.html'), bad = [];
  let lines = 0;
  for (const h of hashes) {
    await p.goto('about:blank'); await p.goto(`${file}#${h}`); await p.waitForTimeout(400);
    for (const t of await p.$$eval('.totals li', L => L.map(li => li.innerText))) {
      const m = t.match(/Stocks (.+?) \+ F&O (.+?) = total\s*(.+)$/); if (!m) continue;
      lines++;
      if (num(m[1]) + num(m[2]) !== num(m[3])) bad.push(`#${h}: "${t.replace(/\s+/g, ' ')}"`);
    }
  }
  await b.close();
  console.log(bad.length ? bad.join('\n') : `totals: ${lines} lines add up`);
  process.exit(bad.length || !lines ? 1 : 0);
})();
