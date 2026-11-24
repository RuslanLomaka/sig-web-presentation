#!/usr/bin/env bash
# Deployment helper for .github/workflows/deploy-ionos.yml.
#
# Publishes the static site in dist/ to IONOS Webhosting over SFTP. It needs
# only the OpenSSH client, curl, jq and coreutils that GitHub's Ubuntu runners
# already ship with: no third-party actions, no extra packages.
#
# Subcommands, in the order the workflow runs them:
#   check-local  No network. Validate the configuration and the contents of dist/.
#   setup-ssh    Compare the server's SSH host keys with the official IONOS
#                fingerprints, then write known_hosts, ssh_config and askpass.
#   inspect      Read-only. Report how this SFTP account sees the webspace.
#   preflight    Read-only. Refuse destinations that are missing or unsafe.
#   probe        Upload one temporary file, require the site to serve it over
#                HTTPS, then delete it. Proves the destination is the web root.
#   upload       Upload every file in dist/ into the destination. Never deletes.
#   verify       Fetch every deployed file over HTTPS and compare checksums.
#   cleanup      Remove a probe file left behind by a cancelled run.
#
# Credentials come from the environment only (IONOS_SSH_HOST, IONOS_SSH_USER,
# IONOS_SSH_PASSWORD). The password reaches ssh through SSH_ASKPASS; it is never
# written to disk, put on a command line or printed.
set -Eeuo pipefail
umask 077

readonly MAIN_ACCOUNT_DIR="/sintelligence"
readonly SSH_PORT="${IONOS_SSH_PORT:-22}"
readonly SOURCE_DIR="${SOURCE_DIR:-dist}"
readonly SITE_URL="${SITE_URL:-https://sintelligence.sig-automation.de}"
readonly STATE_DIR="${IONOS_STATE_DIR:-${RUNNER_TEMP:-/tmp}/ionos-deploy}"
readonly KNOWN_HOSTS="$STATE_DIR/known_hosts"
readonly SSH_CONFIG="$STATE_DIR/ssh_config"
readonly ASKPASS="$STATE_DIR/askpass.sh"
readonly PROBE_RECORD="$STATE_DIR/probe-path"
readonly RUN_TAG="${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-0}"

# --------------------------------------------------------------------------
# Output helpers
# --------------------------------------------------------------------------
in_actions() { [[ -n "${GITHUB_ACTIONS:-}" ]]; }
log()  { printf '%s\n' "$*"; }
note() { if in_actions; then printf '::notice::%s\n' "$*"; else printf 'NOTICE: %s\n' "$*"; fi; }
warn() { if in_actions; then printf '::warning::%s\n' "$*"; else printf 'WARNING: %s\n' "$*" >&2; fi; }
die()  { if in_actions; then printf '::error::%s\n' "$*"; else printf 'ERROR: %s\n' "$*" >&2; fi; exit 1; }
summary() { if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; fi; }

# Server messages are indented so a line can never be read as a workflow command.
show_server_errors() { [[ -s "$1" ]] && sed 's/^/    | /' "$1" >&2 || true; }

# Remote paths can contain IONOS customer numbers; hide long digit runs in logs.
redact_digits() { sed -E 's/[0-9]{4,}/<redacted>/g' <<<"$1"; }

# --------------------------------------------------------------------------
# Configuration checks
# --------------------------------------------------------------------------
require_secret() {  # require_secret ENV_NAME SECRET_NAME
  [[ -n "${!1:-}" ]] || die "Repository secret $2 is empty or not available to this workflow run."
}

require_ssh_credentials() {
  require_secret IONOS_SSH_HOST CICD_SSH_HOST_GITHUB_ACTIONS
  require_secret IONOS_SSH_USER CICD_SSH_USR_GITHUB_ACTIONS
  require_secret IONOS_SSH_PASSWORD CICD_SSH_PWD_GITHUB_ACTIONS
}

require_remote_dir() {
  case "${IONOS_REMOTE_DIR:-}" in
    "$MAIN_ACCOUNT_DIR" | "/") ;;
    "")
      die "Production deployment is not enabled: the repository variable IONOS_REMOTE_DIR is not set. Run the workflow manually with mode 'test', then set IONOS_REMOTE_DIR to the destination it reports." ;;
    *)
      die "IONOS_REMOTE_DIR must be exactly '$MAIN_ACCOUNT_DIR' (main SFTP account) or '/' (account restricted to the website directory). Other values are refused so the main website can never be targeted." ;;
  esac
}

remote_path() {  # remote_path <path relative to the website root>
  if [[ "$IONOS_REMOTE_DIR" == "/" ]]; then printf '/%s' "$1"; else printf '%s/%s' "$IONOS_REMOTE_DIR" "$1"; fi
}

# Every entry in dist/, NUL-separated and sorted, relative to SOURCE_DIR.
list_source() {  # list_source <find -type letter>
  (cd "$SOURCE_DIR" && find . -mindepth 1 -type "$1" -print0) | sed -z 's#^\./##' | LC_ALL=C sort -z
}

# --------------------------------------------------------------------------
# SFTP plumbing
# --------------------------------------------------------------------------
run_sftp() {  # run_sftp <batch file> <stdout file> <stderr file>
  require_ssh_credentials
  [[ -s "$KNOWN_HOSTS" && -f "$SSH_CONFIG" && -x "$ASKPASS" ]] || die "SSH is not prepared. The setup-ssh step must run first."
  # sftp -b turns on BatchMode, which disables password prompts. An earlier
  # -o BatchMode=no wins, because ssh keeps the first value it is given.
  SSH_ASKPASS="$ASKPASS" SSH_ASKPASS_REQUIRE=force \
    sftp -F "$SSH_CONFIG" -o "User=$IONOS_SSH_USER" -o BatchMode=no -b "$1" "$IONOS_SSH_HOST" \
    </dev/null >"$2" 2>"$3"
}

# Prints the output of the n-th command of a batch run (commands are echoed as "sftp> ...").
batch_section() { awk -v n="$1" '/^sftp> /{ s++; next } s == n' "$2"; }

gather_facts() {
  local batch="$STATE_DIR/inspect.batch" out="$STATE_DIR/inspect.out" err="$STATE_DIR/inspect.err"
  # Read-only commands only. A leading "-" lets the batch continue when a path is missing.
  cat > "$batch" <<EOF
pwd
-ls -1a /
-cd $MAIN_ACCOUNT_DIR
pwd
-ls -1a $MAIN_ACCOUNT_DIR
EOF
  if ! run_sftp "$batch" "$out" "$err"; then
    log "The SFTP connection reported:"
    show_server_errors "$err"
    if grep -q 'Host key verification failed' "$err"; then
      die "SSH host key verification failed. Nothing was sent to the server. Compare the fingerprints above with the official IONOS list before changing anything."
    elif grep -qi 'Permission denied' "$err"; then
      die "Login refused. Check secrets CICD_SSH_USR_GITHUB_ACTIONS and CICD_SSH_PWD_GITHUB_ACTIONS and that the IONOS account has SFTP access. Avoid repeated runs with a wrong password: IONOS may block the account temporarily."
    else
      die "Could not open an SFTP session (see the messages above). Check secret CICD_SSH_HOST_GITHUB_ACTIONS and that port $SSH_PORT is reachable."
    fi
  fi

  LOGIN_DIR="$(batch_section 1 "$out" | sed -n 's/^Remote working directory: //p' | head -n 1)"
  [[ -n "$LOGIN_DIR" ]] || die "Unexpected SFTP output: the server did not report a working directory."
  local after_cd
  after_cd="$(batch_section 4 "$out" | sed -n 's/^Remote working directory: //p' | head -n 1)"
  if [[ "$after_cd" == "$MAIN_ACCOUNT_DIR" ]]; then MAIN_DIR_VISIBLE=yes; else MAIN_DIR_VISIBLE=no; fi

  # File names are counted, never printed: Actions logs of a public repository are public.
  local names
  names="$(batch_section 2 "$out" | sed 's#.*/##' | grep -vxE '\.{1,2}' || true)"
  ROOT_COUNT="$(grep -c . <<<"$names" || true)"
  ROOT_HAS_INDEX="$(grep -qx 'index.html' <<<"$names" && echo yes || echo no)"
  if [[ "$MAIN_DIR_VISIBLE" == yes ]]; then
    names="$(batch_section 5 "$out" | sed 's#.*/##' | grep -vxE '\.{1,2}' || true)"
    MAIN_COUNT="$(grep -c . <<<"$names" || true)"
    MAIN_HAS_INDEX="$(grep -qx 'index.html' <<<"$names" && echo yes || echo no)"
  else
    MAIN_COUNT="-"; MAIN_HAS_INDEX="-"
  fi
}

# --------------------------------------------------------------------------
# Subcommands
# --------------------------------------------------------------------------
cmd_check_local() {
  [[ -f "$SOURCE_DIR/index.html" ]] || die "$SOURCE_DIR/index.html is missing. Nothing would be served at the site root."
  if [[ -n "${GITHUB_REF:-}" && "$GITHUB_REF" != "refs/heads/main" ]]; then
    die "Deployments run only from main (this run is for $GITHUB_REF)."
  fi
  require_remote_dir

  local entry bad=0 files=0
  while IFS= read -r -d '' entry; do
    warn "Symbolic links are not deployed: $SOURCE_DIR/$entry"; bad=1
  done < <(list_source l)
  while IFS= read -r -d '' entry; do
    # Characters the sftp batch syntax would treat as quoting or wildcards.
    if [[ "$entry" == *[\"\\\*\?\[\]]* || "$entry" == *$'\n'* || "$entry" == -* ]]; then
      warn "Unsupported characters in file name: $SOURCE_DIR/$entry"; bad=1
    fi
  done < <(list_source f; list_source d)
  ((bad == 0)) || die "Fix the entries listed above before deploying."
  files="$(list_source f | tr -cd '\0' | wc -c)"
  log "Source: $SOURCE_DIR/ with $files files ($(du -sh "$SOURCE_DIR" | cut -f1)), index.html at its top level."
  log "Destination: $IONOS_REMOTE_DIR on the IONOS webspace, served at $SITE_URL"
}

cmd_setup_ssh() {
  require_secret IONOS_SSH_HOST CICD_SSH_HOST_GITHUB_ACTIONS
  [[ -n "${IONOS_HOST_KEY_FINGERPRINTS:-}" ]] || die "IONOS_HOST_KEY_FINGERPRINTS is not set in the workflow."
  mkdir -p "$STATE_DIR" && chmod 700 "$STATE_DIR"

  local -a pinned
  read -r -a pinned <<<"$IONOS_HOST_KEY_FINGERPRINTS"
  local scan
  scan="$(ssh-keyscan -p "$SSH_PORT" -T 20 -t ecdsa,rsa,ed25519 "$IONOS_SSH_HOST" 2>/dev/null || true)"
  [[ -n "$scan" ]] || die "The server returned no SSH host keys on port $SSH_PORT. Check secret CICD_SSH_HOST_GITHUB_ACTIONS (expected an IONOS SFTP host name such as access-NNNNNNNNNN.webspace-host.com)."

  : > "$KNOWN_HOSTS"
  local line type fp known matched=0 rejected=0
  log "SSH host keys offered by the server, compared with the official IONOS list:"
  while IFS= read -r line; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    type="$(awk '{ print $2 }' <<<"$line")"
    fp="$(ssh-keygen -l -E sha256 -f - <<<"$line" | awk '{ print $2 }')"
    known=no
    for p in "${pinned[@]}"; do [[ "$fp" == "$p" ]] && known=yes; done
    if [[ "$known" == yes ]]; then
      log "  match     $type  $fp"
      printf '%s\n' "$line" >> "$KNOWN_HOSTS"
      matched=$((matched + 1))
    else
      log "  NO MATCH  $type  $fp"
      rejected=$((rejected + 1))
    fi
  done <<<"$scan"

  if ((rejected > 0)); then
    : > "$KNOWN_HOSTS"
    die "The server offered $rejected host key(s) that are not in the official IONOS fingerprint list. Refusing to connect. Compare with https://www.ionos.de/hilfe/hosting/ssh-zugaenge-einrichten-und-verwalten/uebersicht-der-ssh-fingerabdruecke-im-ionos-webhosting/ and update IONOS_HOST_KEY_FINGERPRINTS only if IONOS lists the new key."
  fi
  ((matched > 0)) || die "No host key could be verified. Refusing to connect."

  cat > "$SSH_CONFIG" <<EOF
Host *
  Port $SSH_PORT
  StrictHostKeyChecking yes
  UserKnownHostsFile "$KNOWN_HOSTS"
  GlobalKnownHostsFile /dev/null
  CheckHostIP no
  UpdateHostKeys no
  HashKnownHosts no
  PubkeyAuthentication no
  IdentityAgent none
  IdentitiesOnly yes
  PasswordAuthentication yes
  KbdInteractiveAuthentication yes
  PreferredAuthentications password,keyboard-interactive
  NumberOfPasswordPrompts 1
  ConnectTimeout 20
  ConnectionAttempts 2
  ServerAliveInterval 15
  ServerAliveCountMax 4
  ForwardAgent no
  ForwardX11 no
  ClearAllForwardings yes
  ControlMaster no
  ControlPath none
  LogLevel ERROR
EOF

  # Answers ssh password prompts from the environment and refuses every other prompt.
  cat > "$ASKPASS" <<'EOF'
#!/bin/sh
case "$1" in
  *[Pp]assword*) [ -n "${IONOS_SSH_PASSWORD:-}" ] && printf '%s\n' "$IONOS_SSH_PASSWORD" ;;
  *) exit 1 ;;
esac
EOF
  chmod 700 "$ASKPASS"
  log "Host key verified: $matched key(s) match the IONOS documentation. Strict host key checking is on."
}

cmd_inspect() {
  gather_facts
  local site_status suggestion layout
  site_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$SITE_URL/" 2>/dev/null || echo 'unreachable')"
  if [[ "$MAIN_DIR_VISIBLE" == yes ]]; then
    layout="main account: the webspace root is visible and contains $MAIN_ACCOUNT_DIR"
    suggestion="$MAIN_ACCOUNT_DIR"
  else
    layout="restricted account: $MAIN_ACCOUNT_DIR is not visible, so '/' is presumably the website directory"
    suggestion="/"
  fi

  log ""
  log "Read-only connection test (nothing was changed on the server)"
  local row='  %-30s %s\n'
  printf "$row" "SSH host key:" "matches the official IONOS fingerprints"
  printf "$row" "SFTP login:" "OK"
  printf "$row" "Login directory:" "$(redact_digits "$LOGIN_DIR")"
  printf "$row" "$MAIN_ACCOUNT_DIR visible:" "$MAIN_DIR_VISIBLE"
  printf "$row" "Entries in '/':" "$ROOT_COUNT (index.html: $ROOT_HAS_INDEX)"
  printf "$row" "Entries in '$MAIN_ACCOUNT_DIR':" "$MAIN_COUNT (index.html: $MAIN_HAS_INDEX)"
  printf "$row" "Layout:" "$layout"
  printf "$row" "Site answers:" "HTTP $site_status at $SITE_URL/"
  printf "$row" "Suggested IONOS_REMOTE_DIR:" "$suggestion"
  printf "$row" "Configured IONOS_REMOTE_DIR:" "${IONOS_REMOTE_DIR:-<not set>}"

  summary "## Read-only IONOS connection test" "" \
    "Nothing was written to the server. File names are not listed because the logs of this repository are public." "" \
    "| Check | Result |" "|---|---|" \
    "| SSH host key | matches the official IONOS fingerprints |" \
    "| SFTP login | OK |" \
    "| Login directory | \`$(redact_digits "$LOGIN_DIR")\` |" \
    "| \`$MAIN_ACCOUNT_DIR\` visible | $MAIN_DIR_VISIBLE |" \
    "| Entries in \`/\` | $ROOT_COUNT (index.html: $ROOT_HAS_INDEX) |" \
    "| Entries in \`$MAIN_ACCOUNT_DIR\` | $MAIN_COUNT (index.html: $MAIN_HAS_INDEX) |" \
    "| Layout | $layout |" \
    "| $SITE_URL/ | HTTP $site_status |" \
    "| Suggested \`IONOS_REMOTE_DIR\` | \`$suggestion\` |" \
    "| Configured \`IONOS_REMOTE_DIR\` | \`${IONOS_REMOTE_DIR:-not set}\` |"

  if [[ -z "${IONOS_REMOTE_DIR:-}" ]]; then
    note "Connection OK. To enable deployment, set the repository variable IONOS_REMOTE_DIR to '$suggestion'. The first deployment then proves this directory is the web root with a temporary probe file before uploading anything else."
  elif [[ "$IONOS_REMOTE_DIR" != "$suggestion" ]]; then
    warn "IONOS_REMOTE_DIR is '$IONOS_REMOTE_DIR' but this account's layout suggests '$suggestion'. Deployments will refuse to run until this is resolved."
  else
    note "Connection OK. IONOS_REMOTE_DIR ('$IONOS_REMOTE_DIR') matches this account's layout."
  fi
}

cmd_preflight() {
  require_remote_dir
  gather_facts
  case "$IONOS_REMOTE_DIR" in
    "$MAIN_ACCOUNT_DIR")
      [[ "$MAIN_DIR_VISIBLE" == yes ]] || die "$MAIN_ACCOUNT_DIR does not exist for this SFTP account. The workflow never creates the destination itself. If this account is restricted to the website directory, set IONOS_REMOTE_DIR to '/'."
      log "Destination $MAIN_ACCOUNT_DIR exists ($MAIN_COUNT entries, index.html: $MAIN_HAS_INDEX)." ;;
    "/")
      [[ "$MAIN_DIR_VISIBLE" == no ]] || die "IONOS_REMOTE_DIR is '/', but this account can see $MAIN_ACCOUNT_DIR, so '/' is the whole webspace and may hold the main website. Refusing. Set IONOS_REMOTE_DIR to '$MAIN_ACCOUNT_DIR'."
      log "Destination '/' is the account root and $MAIN_ACCOUNT_DIR is not visible ($ROOT_COUNT entries, index.html: $ROOT_HAS_INDEX)." ;;
  esac
}

cmd_probe() {
  require_remote_dir
  local name token local_file remote batch="$STATE_DIR/probe.batch" out="$STATE_DIR/probe.out" err="$STATE_DIR/probe.err"
  name="deploy-probe-$RUN_TAG-$(od -An -N6 -tx1 /dev/urandom | tr -d ' \n').txt"
  token="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
  local_file="$STATE_DIR/$name"
  remote="$(remote_path "$name")"
  printf '%s\n' "$token" > "$local_file"
  printf '%s\n' "$remote" > "$PROBE_RECORD"

  # sftp copies the local mode bits; the web server needs a world-readable file.
  chmod 644 "$local_file"
  printf 'put "%s" "%s"\n-chmod 644 "%s"\n' "$local_file" "$remote" "$remote" > "$batch"
  if ! run_sftp "$batch" "$out" "$err"; then
    show_server_errors "$err"
    die "Could not write the probe file into $IONOS_REMOTE_DIR. Check that the account may write there."
  fi
  log "Uploaded temporary probe $remote; checking $SITE_URL/$name"

  local attempt status served=no probe_body="$STATE_DIR/probe.body"
  for attempt in 1 2 3 4 5 6; do
    status="$(curl -sS -o "$probe_body" -w '%{http_code}' --max-time 20 -H 'Cache-Control: no-cache' \
      "$SITE_URL/$name?attempt=$attempt" 2>/dev/null || echo 'no response')"
    if [[ "$status" == 200 && "$(cat "$probe_body")" == "$token" ]]; then served=yes; break; fi
    log "  attempt $attempt: HTTP $status"
    sleep 5
  done

  cmd_cleanup
  if [[ "$served" != yes ]]; then
    if [[ "$status" == 200 ]]; then
      die "$SITE_URL/$name answered with different content, so $IONOS_REMOTE_DIR is not the document root of the site. Nothing else was uploaded. Run the read-only test and check the subdomain's directory in the IONOS control panel."
    elif [[ "$status" == 403 ]]; then
      die "$SITE_URL refused to serve the probe file (HTTP 403). The file may be unreadable for the web server, or $IONOS_REMOTE_DIR is not the site's directory. Nothing else was uploaded."
    else
      die "The probe file written to $IONOS_REMOTE_DIR was not served at $SITE_URL (last answer: HTTP $status). That directory is probably not the document root of the site, so nothing else was uploaded. Run the read-only test and check IONOS_REMOTE_DIR and the subdomain's directory in the IONOS control panel."
    fi
  fi
  log "Verified: $IONOS_REMOTE_DIR is the document root of $SITE_URL."
}

cmd_cleanup() {
  [[ -s "$PROBE_RECORD" ]] || return 0
  local remote batch="$STATE_DIR/cleanup.batch" out="$STATE_DIR/cleanup.out" err="$STATE_DIR/cleanup.err"
  remote="$(cat "$PROBE_RECORD")"
  printf 'rm "%s"\n' "$remote" > "$batch"
  if run_sftp "$batch" "$out" "$err"; then
    log "Removed temporary probe $remote"
    : > "$PROBE_RECORD"
  else
    show_server_errors "$err"
    warn "Could not remove the temporary probe file $remote. It is harmless, but you can delete it by hand."
  fi
}

cmd_upload() {
  require_remote_dir
  local batch="$STATE_DIR/upload.batch" out="$STATE_DIR/upload.out" err="$STATE_DIR/upload.err" entry count=0
  : > "$batch"
  # sftp copies local mode bits, so set web-readable modes explicitly. A failed chmod
  # ("-") does not stop the upload; the HTTPS verification would catch unreadable files.
  # Directories first (parents sort before children); "-mkdir" ignores "already exists".
  while IFS= read -r -d '' entry; do
    printf -- '-mkdir "%s"\n-chmod 755 "%s"\n' "$(remote_path "$entry")" "$(remote_path "$entry")" >> "$batch"
  done < <(list_source d)
  # Then every file, with index.html last so the page never references assets that are not there yet.
  while IFS= read -r -d '' entry; do
    [[ "$entry" == "index.html" ]] && continue
    printf 'put "%s" "%s"\n-chmod 644 "%s"\n' "$SOURCE_DIR/$entry" "$(remote_path "$entry")" "$(remote_path "$entry")" >> "$batch"
    count=$((count + 1))
  done < <(list_source f)
  printf 'put "%s" "%s"\n-chmod 644 "%s"\n' "$SOURCE_DIR/index.html" "$(remote_path index.html)" "$(remote_path index.html)" >> "$batch"
  count=$((count + 1))

  log "Uploading $count files into $IONOS_REMOTE_DIR (existing files are overwritten, nothing is deleted)..."
  if ! run_sftp "$batch" "$out" "$err"; then
    show_server_errors "$err"
    die "Upload failed. Files uploaded before the error stay in place; run the deployment again once the cause is fixed."
  fi
  grep '^put ' "$batch" | sed -E 's/^put "[^"]*" "([^"]*)"$/  uploaded \1/'
  summary "## Deployed to IONOS" "" "$count files from \`$SOURCE_DIR/\` uploaded into \`$IONOS_REMOTE_DIR\`. Nothing was deleted on the server." ""
}

cmd_verify() {
  local entry url got want tmp failures=0 checked=0
  tmp="$(mktemp)"
  summary "| URL | Result |" "|---|---|"

  check_url() {  # check_url <url> <local file>
    want="$(sha256sum "$2" | cut -d' ' -f1)"
    if curl -fsS --retry 3 --retry-delay 3 --retry-all-errors --max-time 30 \
        -H 'Cache-Control: no-cache' -o "$tmp" "$1?deploy=$RUN_TAG" 2>"$tmp.err"; then
      got="$(sha256sum "$tmp" | cut -d' ' -f1)"
    else
      got="request failed: $(head -c 200 "$tmp.err" | tr '\n' ' ')"
    fi
    checked=$((checked + 1))
    if [[ "$got" == "$want" ]]; then
      log "  ok        $1"; summary "| $1 | identical |"
    else
      log "  MISMATCH  $1 ($got)"; summary "| $1 | **differs** |"
      failures=$((failures + 1))
    fi
  }

  log "Comparing the live site with $SOURCE_DIR/ over HTTPS:"
  check_url "$SITE_URL/" "$SOURCE_DIR/index.html"
  while IFS= read -r -d '' entry; do
    # Apache never serves .htaccess and similar files; their effect is checked instead.
    [[ "${entry##*/}" == .ht* ]] && continue
    url="$SITE_URL/$(jq -rn --arg p "$entry" '$p | split("/") | map(@uri) | join("/")')"
    check_url "$url" "$SOURCE_DIR/$entry"
  done < <(list_source f)
  rm -f "$tmp" "$tmp.err"
  if [[ -f "$SOURCE_DIR/.htaccess" && "$SITE_URL" == https://* ]]; then
    local plain="http://${SITE_URL#https://}/" redirect
    redirect="$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 20 "$plain" 2>/dev/null || true)"
    log "  http:// answers: $redirect"
    [[ "$redirect" == 301\ https://* ]] || warn "Plain HTTP does not redirect to HTTPS yet ($redirect). Check that .htaccess is active."
  fi

  ((failures == 0)) || die "$failures of $checked URLs do not match $SOURCE_DIR/. The upload may be incomplete, or a cache served old content; run the deployment again."
  log "All $checked URLs serve exactly the files from $SOURCE_DIR/."
  summary "" "Live site: $SITE_URL"
}

main() {
  case "${1:-}" in
    check-local) cmd_check_local ;;
    setup-ssh)   cmd_setup_ssh ;;
    inspect)     cmd_inspect ;;
    preflight)   cmd_preflight ;;
    probe)       cmd_probe ;;
    upload)      cmd_upload ;;
    verify)      cmd_verify ;;
    cleanup)     cmd_cleanup ;;
    *) die "Usage: $0 {check-local|setup-ssh|inspect|preflight|probe|upload|verify|cleanup}" ;;
  esac
}

main "$@"
