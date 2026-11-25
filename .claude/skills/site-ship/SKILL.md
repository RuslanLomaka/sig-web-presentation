---
name: site-ship
description: "Publish the Sintelligence website or its tooling: commit, push to main, wait for the checks and the IONOS deployment, verify the live files, or roll back."
---

# Publish

```bash
git status --short            # know what belongs to this commit
git add dist README.md        # and tools/, CLAUDE.md, .claude/, .github/ as needed
npm run -s ship <<'MESSAGE'
Short summary of what visitors notice

- What changed and why, in plain words.
- Accepted differences from the standard, if any.

Co-Authored-By: <as given by the session>
MESSAGE
```

`tools/ship.sh` runs the full check, commits with the noreply identity, pushes, waits for the pipeline (checks, then deployment) and compares the live files byte by byte. It stops at the first problem; nothing is published without green checks.

- "pushed … deploy-ionos.yml: … success" and four times "matches" mean it is live. Anything else: read the printed log, fix, ship again.
- Changes outside `dist/` do not deploy; the script waits for `checks.yml` instead.
- Publishing was agreed as the normal end of a change the customer asked for. Not for experiments, and not when they say "push and stop" or "pause".
- Roll back: `git revert <commit>` and ship. Never force-push, never edit files on the server.
- Deployment itself (modes, destination, fingerprints, variables): `README.md`, `.github/scripts/deploy-ionos.sh`. Its limits are in `CLAUDE.md`.
- Afterwards tell the customer in plain words what is live and what could not be tested.
