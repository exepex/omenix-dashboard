// Renders a brand SVG to an exact-size PNG with the pre-installed Chromium (transparent outside the artwork), so a
// PNG can always be remade from its SVG source:
//   node design/brand/render.js <in.svg> <out.png> <width>          (height follows the SVG's aspect ratio)
// Used for the PNGs whose exported copies were wrong (README "Corrections"); deterministic for a given Chromium.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function svgSize(svg) {
  const box = /viewBox="([\d.\s-]+)"/.exec(svg)[1].trim().split(/\s+/).map(Number);
  return { w: box[2], h: box[3] };
}

async function render(input, output, width) {
  const svg = fs.readFileSync(input, 'utf8');
  const { w, h } = svgSize(svg);
  const height = Math.round(width * h / w);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  const src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await page.setContent(`<body style="margin:0"><img src="${src}" style="display:block;width:${width}px;height:${height}px"></body>`);
  await page.waitForFunction(() => document.images[0].complete);
  await page.screenshot({ path: output, omitBackground: true });
  await browser.close();
  console.log(`${path.basename(output)} ${width}x${height}`);
}

const [input, output, width] = process.argv.slice(2);
if (!input || !output || !Number(width)) {
  console.error('usage: node design/brand/render.js <in.svg> <out.png> <width>');
  process.exit(2);
}
render(input, output, Number(width)).catch((e) => { console.error(e); process.exit(1); });
