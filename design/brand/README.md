# Omenix logo (final, owner sign-off 13 Oct 2026; mark "signal")

The owner's finalised logo set. SVG is the source; PNGs are exact pixel sizes. Colours: accent gradient #5a5ee6 to
#7a7df0 (bottom-left to top-right), navy #2f3349, white. Never recolour with green, red or amber.

| Folder | Use | Files |
|---|---|---|
| google-cloud/ | Google Cloud Console OAuth consent screen app logo (120 x 120 PNG, under 1 MB) | oauth-app-logo-120.png (gradient tile, **use this one**), oauth-app-logo-white-120.png, app-logo-512.png |
| desktop/ | rail tile at 36 px (wide side menu, 1200 px and up); top-bar wordmark from 1360 px | rail-tile-36.png (+@2x), mark-white-28.png (+@2x), tile.svg, lockup-light.svg, lockup-dark.svg |
| tablet/ | icon-only rail (600 to 1199 px) | rail-tile-36.png (+@2x), tile.svg |
| mobile/ | phone top bar tile at 32 px (under 600 px) | topbar-tile-32.png (+@2x, @3x), tile.svg |
| favicon/ | browser tab, home screen, PWA | favicon.ico (16+32+48), favicon-16/32/48.png, apple-touch-icon-180.png, pwa-icon-192/512.png, pwa-icon-maskable-512.png, tile.svg, icon-maskable.svg |
| social/ | profile pictures (cropped to a circle) | avatar-gradient (svg, 320, 400, 1024), avatar-navy, avatar-white |
| lockup/ | mark + "Omenix" wordmark: headers, covers, documents | lockup-light, lockup-dark, lockup-mono-navy, lockup-mono-white (SVG, 600 px and 2048 px wide PNG) |
| mark/ | the mark alone | mark-gradient, mark-navy, mark-white (SVG, 1024 px PNG) |

## Where the logo is used

- Design system: the sprite symbol `mb-logo` in `design/system/icons.svg` (the mark, stroke = currentColor) on the
  `--mb-brand-tile` gradient (`tokens.css`); `.mb-brand-mark` holds it (36 px, 32 px on phones, 4 px radius).
  Every mockup (01-12, 30-36) and the style guide show it; no page loads a file (no requests).
- App (`web/`): the same sprite in the app bar; `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` are copies
  of `favicon/` made by `web/tools/sync-design.mjs` (its `--check` test fails when a copy differs).
- Legal pages (`design/mockups/36-legal`, served at /privacy and /terms): the tile as an inline favicon.

## Corrections made on 13 Oct 2026 (the files as delivered had two defects)

1. Six SVGs set `color="url(#g)"` with `stroke="currentColor"`. That is not valid SVG, so browsers drew the mark
   **black** instead of the gradient: desktop/ and mark/mark-gradient.svg, desktop/ and lockup/lockup-light.svg,
   google-cloud/ and social/avatar-white.svg. Fixed: `stroke="url(#g)"`, with one gradient across the 64-unit mark
   (`gradientUnits="userSpaceOnUse"`). The PNGs made from them were black too and were re-rendered:
   mark-gradient-1024, avatar-white-1024, oauth-app-logo-white-120.
2. The lockup PNGs named -600 and -2048 were all 205 x 44 px. Re-rendered at 600 and 2048 px wide.

Re-render any PNG from its SVG with `node design/brand/render.js <in.svg> <out.png> <width>` (pre-installed Chromium).
All other files are byte-for-byte as delivered.
