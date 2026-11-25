#!/usr/bin/env bash
# Publishes the site: full check, commit (message on stdin), push, wait for the pipeline, compare the live files.
#   git add <files>; npm run -s ship <<'MESSAGE'
#   ...
#   MESSAGE
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1
readonly REPO=RuslanLomaka/sig-web-presentation URL=https://sintelligence.sig-automation.de
message="$(cat)"
[[ -n "$message" ]] || { echo "The commit message is missing (on stdin)."; exit 1; }
[[ "$(git branch --show-current)" == main ]] || { echo "Not on main."; exit 1; }
git config core.hooksPath .githooks
git fetch -q origin main || exit 1
[[ -z "$(git rev-list HEAD..origin/main)" ]] || { echo "origin/main has newer commits: pull first."; exit 1; }

node tools/check.mjs || { echo "Nothing was published."; exit 1; }
git add dist # The check may have renewed the cache versions.
left="$(git status --porcelain | grep -v '^[AMDR]  ' || true)"
[[ -z "$left" ]] || printf 'Not part of this commit:\n%s\n' "$left"
git -c user.name=RuslanLomaka -c user.email=RuslanLomaka@users.noreply.github.com commit -q -F - <<<"$message" || exit 1
git -c credential.helper= -c "credential.helper=!$(command -v gh) auth git-credential" push -q origin main || exit 1
sha="$(git rev-parse HEAD)"
echo "pushed ${sha:0:7}"

workflow=checks.yml
git diff --name-only HEAD~1 HEAD | grep -q '^dist/' && workflow=deploy-ionos.yml
run=""
for _ in $(seq 1 90); do
  run="$(gh run list -R "$REPO" -w "$workflow" -c "$sha" -L 1 --json databaseId,status,conclusion --jq '.[0] | select(. != null) | "\(.databaseId) \(.status) \(.conclusion)"' 2>/dev/null)"
  [[ "$run" == *completed* ]] && break
  sleep 5
done
echo "$workflow: ${run:-not found}"
if [[ "$run" != *success* ]]; then
  gh run view "${run%% *}" -R "$REPO" --log-failed 2>/dev/null | cut -f3- | tail -40
  exit 1
fi
[[ "$workflow" == deploy-ionos.yml ]] || exit 0

status=0
for file in index.html styles.css i18n.js demo.js; do
  address="$URL/$file"; [[ "$file" == index.html ]] && address="$URL/"
  if [[ "$(curl -sS --compressed --max-time 20 "$address?c=$RANDOM" | sha256sum)" == "$(sha256sum < "dist/$file")" ]]; then echo "live: $file matches"; else echo "live: $file DIFFERS"; status=1; fi
done
exit "$status"
