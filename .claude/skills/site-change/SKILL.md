---
name: site-change
description: "Make any change to the Sintelligence website (texts, layout, sections, demo, animation, translations, logos). Use whenever something on sintelligence.sig-automation.de or in dist/ should be added, changed or removed."
---

# Change the site

1. **Understand the wish.** Re-read "The standard" in `CLAUDE.md`. A wish for phones only must not touch desktop, and the other way round. If a wish contradicts the standard, the wish wins and the standard is updated in the same commit.
2. **Find the place** with the map in `CLAUDE.md`; search for the class, the `data-i18n` key or the visible text. Read the rules of all media queries that touch the element before adding a new one.
3. **Change it.** House rules:
   - Use existing colours, sizes, radii and breakpoints. A new one is reported by `design/tokens` and needs a reason.
   - Centre with flex or grid, never with padding or nudges in pixels. Equal gaps come from `gap` on the parent.
   - No inline styles, no `innerHTML`, no requests, no new files from other servers (the security policy blocks them; setting `element.style` from scripts is fine).
   - Icons: inline SVG or CSS. Pictures: `width`, `height`, `alt`, `loading="lazy"` below the first screen.
   - Motion: transform and opacity; list it in the reduced-motion block; without JavaScript the finished state must be visible.
   - Old browsers: the customer's plants have them. Put a plain fallback before newer CSS (`svh`, `cqw`, `clamp`), no `Object.hasOwn`.
4. **Texts in three languages, at once.** Ukrainian in `index.html` with a `data-i18n` key, English and German under the same key in `i18n.js`; texts written by scripts go into `content.ua/en/de` with the same structure. German: Sie, „…“, soft hyphen `\u00AD` in long words. Ukrainian: ’ and no calques. Check the longest language first; it is usually German.
5. **`npm run check`.** Fix every finding at its cause. Cache versions (`?v=`) are written automatically.
6. **Look.** `npm run shots -- "<selector>" --views phone-390,phone-320,tablet-820,desktop-1440 --languages de,uk` and read the pictures. Ask: would the customer find something here? Check hover, open, active and long-text states, and the sections above and below.
7. **Accept only what was wanted.** `standard/layout` lists everything that moved. Anything not asked for is a mistake: undo it. Otherwise `npm run standard:accept` and look at the diff of `tools/standard/layout.json`.
8. **New behaviour gets a check** in `tools/checks/behaviour.mjs` and a planted mistake in `tools/selftest.mjs` (see site-flaw).
9. Publish with **site-ship**. Report what changed, and honestly what was not tested (a real phone, Safari).

Headless traps that cost time before
- Pages report no mouse; `tools/lib/browser.mjs` turns it on. On phones `innerWidth` grows with overflow: use `document.documentElement.clientWidth`.
- Frames drop to 2–3 per second when only invisible animations run. That is the test browser, not the page.
- Screenshots beyond the viewport resize it and move everything that uses `svh`: scroll first, then capture.
- Laptops on battery are several times slower: wait for events, not for fixed times.
- Never `pkill -f`: it matches your own shell.
