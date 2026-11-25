---
name: site-maintenance
description: "Upkeep of the Sintelligence website and its checks: health check of the live site, dependency updates, links, certificates, IONOS fingerprints, dead files, budgets. Use for 'check the site', 'update dependencies', 'is everything still fine', or when a check breaks after a browser update."
---

# Upkeep

Work through the list, change only what is needed, report the rest.

1. **Project**: `git pull`, `npm run setup`, `npm run check`, `npm run selftest`. Both green before anything else.
2. **Live site**: `gh run list -R RuslanLomaka/sig-web-presentation -L 5`; `curl -sI https://sintelligence.sig-automation.de/` (security headers, HTTPS redirect from http); certificate end date with `openssl s_client`; live files equal `dist/` (last lines of `tools/ship.sh`).
3. **Links**: every external link in `index.html` and `i18n.js` answers (sig-automation.com pages per language, Impressum, Datenschutz).
4. **Fingerprints**: compare the IONOS page named in `deploy-ionos.yml` with the three values there. They differ → stop and tell the customer; never relax verification.
5. **Dependencies** (development only): `npm outdated`, `npm audit`. Update one at a time with `npm install --save-dev --save-exact --ignore-scripts --before=<14 days ago> <name>`, then check and selftest. Actions stay pinned to commits.
6. **New browser version broke a check**: look at pictures first. Real change → fix the site. Rounding → correct the measurement, rarely the tolerance. Then `standard:accept` with the reason in the commit message.
7. **Weight**: `files/size` in `rules.mjs`; unused CSS classes (`grep` each class of `styles.css` in the HTML and JS); dead translations are reported by `i18n/keys`.
8. **By hand, now and then**: a real iPhone (Safari), an Android phone, keyboard only, a screen reader, 200 % zoom, German and Ukrainian proofreading, claims on the page still true (product versions, logo facts).
9. Publish fixes with **site-ship**. Report: healthy, fixed, needs a decision.
