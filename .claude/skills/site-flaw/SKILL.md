---
name: site-flaw
description: "The customer reports a flaw on the Sintelligence website (not centred, gap, overlap, looks selected or clickable, wrong text, broken on a phone, jumps). Fix it, find its siblings, and turn it into an automatic check so it cannot come back."
---

# From a reported flaw to a check

Every flaw the customer sees is also a hole in the checks. Close both.

1. **Reproduce and measure it** in the same view (phone or desktop, language, state). Numbers, not impressions: rectangles, gaps, pixels.
2. **Why was it not caught?** Wrong viewport or language, a hidden state, a selector missing from `CENTRED` in `tools/checks/layout.mjs`, no rule at all?
3. **Write the check first** and see it fail on the current site:
   - Geometry → `audit()` or `CENTRED` in `layout.mjs` (general rules beat rules for one element).
   - Something painted (pseudo-elements, icons) → `ink` in `CENTRED`, it compares pixels.
   - Behaviour, states, motion → `behaviour.mjs`.
   - Texts, files, security, wording → `rules.mjs` (`FORBIDDEN` for wording the customer ruled out).
4. **Fix the cause.** The check now lists the siblings of the flaw on other screens and in other languages: fix those, too.
5. **Plant it** in `tools/selftest.mjs` and run `npm run selftest "<name>"`: it must say "caught". If the checks stay green with the planted mistake, the check is not real.
6. A decision of taste (not a measurable flaw) goes into "The standard" in `CLAUDE.md`.
7. `npm run check`, pictures, then **site-ship**.

A check must not cry wolf: run it on all views before keeping it. A false alarm is fixed in the check with a comment, not by a wider tolerance for everybody.
