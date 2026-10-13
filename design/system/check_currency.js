// Playwright check that a page's US states never show the rupee sign, and its India states never show a dollar amount
// (judge 50, 13 Oct 2026: a hard-coded ₹ reached the US forecast line). Reads the visible text after each state renders.
//   node design/system/check_currency.js <page.html> <us-hash> [...] -- <india-hash> [...]
// Exit 1 when a state shows the other market's currency.
const { chromium } = require('playwright'); const path = require('path');
const RUPEE = /₹/, DOLLAR = /\$\s?\d/;
(async () => {
  const [page, ...rest] = process.argv.slice(2), cut = rest.indexOf('--');
  const us = cut < 0 ? rest : rest.slice(0, cut), india = cut < 0 ? [] : rest.slice(cut + 1);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }), file = 'file://' + path.resolve(page), bad = [];
  for (const [hashes, wrong, word] of [[us, RUPEE, '₹ on a US state'], [india, DOLLAR, '$ amount on an India state']]) {
    for (const h of hashes) {
      await p.goto('about:blank'); await p.goto(`${file}#${h}`); await p.waitForTimeout(400);   /* a fresh load per state: a hash change alone keeps the last market */
      const text = await p.evaluate(() => document.body.innerText);
      const hit = text.split('\n').find(line => wrong.test(line));
      if (hit) bad.push(`#${h}: ${word}: "${hit.trim().slice(0, 120)}"`);
    }
  }
  await b.close();
  console.log(bad.length ? bad.join('\n') : `currency: ${us.length} US and ${india.length} India states clean`);
  process.exit(bad.length ? 1 : 0);
})();
