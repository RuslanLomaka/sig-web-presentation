# Sintelligence website

Static site in `dist/` (HTML, CSS, JavaScript, no build step, no runtime dependencies), three languages
(Ukrainian = source text in `dist/index.html`, English and German in `dist/i18n.js`). A push to `main` that touches `dist/`
deploys to https://sintelligence.sig-automation.de after the checks pass. This repository is public.

## How to work here

1. `npm run setup` once per checkout.
2. Change the site with the skill **site-change**; the customer reports a flaw → **site-flaw**; publish → **site-ship**; upkeep → **site-maintenance**.
3. `npm run check` must be green before anything is reported as done. It is the customer's main wish: no slips that they have to find.
   Hooks run it too: a linter after every edit, the full check before a turn ends, on commit, on push, and in the pipeline.
4. Never switch off, loosen or bypass a check to get green (`--no-verify`, a wider tolerance, a new exception).
   If a check is wrong, fix the check and say so.
5. `npm run standard:accept` only for differences that were asked for and looked at in pictures (`npm run shots`). Name them in the commit message.

| Command | What it does |
|---|---|
| `npm run check` | Everything: linters, project rules, measurements in a real browser in 27 page variants |
| `npm run check:fast` | Linters and project rules, about three seconds |
| `npm run check -- --only layout --views phone-390 --languages de` | One part, see the top of `tools/check.mjs` |
| `npm run shots -- "#demo" --views phone-390,desktop-1440 --languages de` | Pictures to look at, in `.cache/shots` |
| `npm run preview` | Local server with the production security headers |
| `npm run selftest` | Plants about 55 known mistakes and proves that each one is caught |
| `npm run ship` | Check, commit, push, wait for the pipeline, compare the live files |

## Map

- `dist/index.html` page and Ukrainian texts (`data-i18n`, `data-i18n-aria`, `data-i18n-href`, `data-i18n-content`)
- `dist/i18n.js` `page.en`, `page.de`; `content.ua/en/de` (texts that scripts write: scenarios, facts, charts); language choice. Runs before the first paint.
- `dist/demo.js` everything interactive, in one function: charts, tabs, chat demo (one clock: `elapsed`, `buildTimeline`, `render…`, `PACE`), three circles (`STEP_STARTS`), logo facts
- `dist/styles.css` tokens at the top, then by section; phones `max-width: 800px`; touch `pointer: coarse` / `hover: none`; reduced motion last
- `dist/.htaccess` HTTPS, caching, security policy (no inline styles or scripts, nothing from other servers)
- `tools/checks/` `rules.mjs` (no browser), `layout.mjs` (alignment), `behaviour.mjs` (what it does), `standard.mjs` (frozen layout); `tools/standard/` the approved state
- `.github/` pipeline; `checks.yml` uses no secrets, `deploy-ionos.yml` deploys only after it

## Limits that are not up for discussion

- Secrets keep their names, are never asked for, printed or stored elsewhere. Host verification stays on; fingerprints come from the IONOS documentation.
- Never delete unrelated remote files, never touch the main corporate website, DNS or SSL.
- No paid services, VPS, Docker or external deployment platform. Standard GitHub runners, minimal pinned dependencies (development only).
- Commits use the noreply address. No private e-mail address, credential or local path in the repository.

## The standard (decisions of the customer)

Layout
- Everything that looks centred is centred (±1 px, text by its capital letters); gaps and heights in a group are equal; edges line up; no hairlines between sections; nothing overflows or is cut off.
- Icons are drawn (inline SVG or CSS), never typed as characters.
- Only interactive things look interactive; nothing looks selected that is not. Touch targets: 44 px for main controls, 24 px at least.
- The page does not jump: image sizes are set, example tabs keep one height (desktop), the demo keeps one height.

Header and languages
- Desktop: language switcher as it is (one language at rest, three with flags on hover). Do not change it.
- Phones and touch screens: globe and two letters; flags only in the opened bar. Header at most 52 px, half transparent.
- `?lang=de|en|uk` links; every text in all three languages; German with Sie.

Demo
- Four scenarios in an endless loop; the pill toggle moves like a train, a click starts a scenario.
- The assistant decides what to check, so nothing of the checks is visible before the question is sent. They appear one by one in the reply while it thinks and can be opened after the answer. The fast-forwarded thinking timer stays.
- Fits on one phone screen. Pause stops all motion. No title such as “Conversation with the assistant”.
- The page never mentions that data is illustrative.

Three circles
- Scrolling plays the scene step by step and back. Reduced motion, no JavaScript and very low screens show the finished picture.

Brand
- The product is **Sintelligence** by Smart Industry Group; logo variant 6 (green S, green to white, dark background). SIG logo only in the footer.
- The claim “equipment from any manufacturer” stays.
