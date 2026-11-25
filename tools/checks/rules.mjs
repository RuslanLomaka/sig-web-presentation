// Project rules that need no browser: security, files, addresses, house style.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { ROOT, listFiles, loadTexts, strings } from "../lib/site.mjs";
import { stampVersions } from "../lib/versions.mjs";

const SITE = "https://sintelligence.sig-automation.de/";
const LINK_HOSTS = ["sig-automation.com", "sintelligence.sig-automation.de"];
const NOT_LINKED = [/^\.htaccess$/, /^robots\.txt$/, /^sitemap\.xml$/, /^favicon\.ico$/, /^index\.html$/, /^pilot-checklist\.txt$/, /\/(Apache-2\.0|OFL-1\.1|SOURCES)\.txt$/];
const BUDGET = { "index.html": 60, "styles.css": 64, "demo.js": 40, "i18n.js": 100 }; // Kilobytes.
const IMAGE_BUDGET = 320;
const TOTAL_BUDGET = 1800;
// Wording the customer ruled out, with the reason a later editor needs.
const FORBIDDEN = [
  [/illustrative|ілюстратив|beispieldaten|fiktive|умовн(?:і|их|ими) дан|sample data|made-up|вигадан/i, "The page never says that its data is illustrative."],
  [/SIG[ -]Intelligence|Sintelligense|SINTELLIGENCE AI/, "The product is called Sintelligence."],
  [/conversation with the assistant|розмова з асистентом|gespräch mit dem assistenten/i, "The demo has no such title."]
];
const CSP = ["default-src 'self';", "style-src 'self';", "script-src 'self';", "connect-src 'self';", "object-src 'none';", "base-uri 'self';", "frame-ancestors 'self'\""];

function fileRules(site, report) {
  const { dist, html, css, js } = site;
  const all = listFiles(dist);
  const local = path => normalize(path.split(/[?#]/)[0]);
  const used = new Set();
  const use = (path, from, base = "") => {
    if (/^(https?:|data:|mailto:|tel:|#)/.test(path) || !path) return;
    const file = local(join(base, path));
    used.add(file);
    report.ran("files/exists");
    if (!existsSync(join(dist, file))) report.add("files/exists", from, `"${path}" does not exist in dist/.`);
  };
  for (const [, path] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) use(path, "index.html");
  for (const [, , path] of css.matchAll(/url\((["']?)([^"')]+)\1\)/g)) if (!path.startsWith("#")) use(path, "styles.css");
  for (const [, path] of js.matchAll(/["'`](assets\/[^"'`$]+)["'`]/g)) use(path, "demo.js");
  const manifest = JSON.parse(readFileSync(join(dist, "site.webmanifest"), "utf8"));
  for (const icon of manifest.icons) use(icon.src, "site.webmanifest");
  for (const [, path] of html.matchAll(new RegExp(`content="${SITE}([^"]+)"`, "g"))) if (!path.startsWith("?")) use(path, "index.html");
  for (const file of all) {
    report.ran("files/used");
    if (!used.has(file) && !NOT_LINKED.some(pattern => pattern.test(file))) report.add("files/used", `dist/${file}`, "Nothing uses this file.", "Delete it, or link it.");
  }

  let total = 0;
  for (const file of all) {
    const size = statSync(join(dist, file)).size / 1024;
    total += size;
    const limit = BUDGET[file] ?? (/\.(png|jpg|webp|svg)$/.test(file) ? IMAGE_BUDGET : Infinity);
    report.ran("files/size");
    if (size > limit) report.add("files/size", `dist/${file}`, `${Math.round(size)} KB is more than the ${limit} KB agreed.`, "Make it smaller, or raise the limit in tools/checks/rules.mjs on purpose.");
  }
  if (total > TOTAL_BUDGET) report.add("files/size", "dist/", `${Math.round(total)} KB in all is more than ${TOTAL_BUDGET} KB.`);

  report.ran("files/version", 3);
  if (stampVersions(html, dist) !== html) report.add("files/version", "dist/index.html", "A CSS or JS file changed but its ?v= did not, so returning visitors would keep the old one.", "Run: npm run stamp");
}

function pageRules(site, report) {
  const { html, css, js, i18n } = site;
  const markup = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const ban = (rule, where, text, pattern, message, fix) => {
    report.ran(rule);
    const found = pattern.exec(text);
    if (found) report.add(rule, where, `${message} Found: ${found[0].trim().slice(0, 60)}`, fix);
  };
  ban("security/csp", "index.html", markup, /\sstyle=|\son[a-z]+="|<script(?![^>]*\bsrc=)[^>]*>|<style/i, "Inline styles and scripts are blocked by the page's security policy.", "Use styles.css or demo.js.");
  ban("security/external", "index.html", markup, /<(?:script|img|iframe|source|video|audio|embed|object)[^>]+(?:src|data)="(?:https?:)?\/\/[^"]*"|<link rel="(?:stylesheet|preload|icon|preconnect)[^>]+href="(?:https?:)?\/\/[^"]*"/i, "The page loads nothing from other servers.");
  ban("security/external", "demo.js", `${js}${i18n}`, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts)\s*\(|document\.cookie/, "The scripts contact no server and set no cookies.");
  for (const part of CSP) {
    report.ran("security/csp");
    if (!site.htaccess.includes(part)) report.add("security/csp", "dist/.htaccess", `The security policy lost "${part}".`);
  }
  for (const [tag, href] of markup.matchAll(/<a [^>]*href="(https?:[^"]+)"[^>]*>/g)) {
    report.ran("security/links");
    if (!LINK_HOSTS.includes(new URL(href).hostname)) report.add("security/links", "index.html", `Link to an unknown website: ${href}`, "Add the host to LINK_HOSTS in tools/checks/rules.mjs if it is wanted.");
    if (/target="_blank"/.test(tag) && !/rel="[^"]*noopener/.test(tag)) report.add("security/links", "index.html", `target="_blank" without rel="noopener": ${href}`);
  }
  for (const [tag] of markup.matchAll(/<img [^>]*>/g)) {
    report.ran("page/images");
    for (const attribute of ["width", "height", "alt"]) if (!new RegExp(`\\s${attribute}="`).test(tag)) report.add("page/images", "index.html", `<img> without ${attribute}: ${tag.slice(0, 80)}`, "Without a size, the page jumps while images load.");
    if (/assets\/logos\//.test(tag) && !/loading="lazy"/.test(tag)) report.add("page/images", "index.html", `Logo without loading="lazy": ${tag.slice(0, 80)}`);
  }
  // Characters used as icons sit off-centre in many fonts (the ✦ in the assistant icon did).
  ban("page/glyph-icons", "index.html", markup.replace(/<!--[\s\S]*?-->/g, ""), /[─-➿⬀-⯿\u{1F000}-\u{1FAFF}]|>\s*[×✕✓☰⋮…•]\s*</u, "A typed symbol is used as an icon.", "Draw it: inline SVG, or CSS on ::before.");
  ban("page/glyph-icons", "styles.css", css.replace(/\/\*[\s\S]*?\*\//g, ""), /content:\s*["'][^"']*[←-➿⬀-⯿][^"']*["']/, "A typed symbol is used as an icon.", "Draw it with borders, clip-path or a mask.");
  for (const needed of [`<link rel="canonical" href="${SITE}"`, `hreflang="de" href="${SITE}?lang=de"`, `hreflang="en" href="${SITE}?lang=en"`, `hreflang="uk" href="${SITE}?lang=uk"`, 'property="og:image"', "application/ld+json", 'name="color-scheme" content="only light"', 'name="viewport"']) {
    report.ran("page/head");
    if (!html.includes(needed)) report.add("page/head", "index.html", `The head lost: ${needed}`);
  }
}

function textRules(site, report) {
  const texts = { uk: [], en: [...strings(site.texts.page.en)], de: [...strings(site.texts.page.de)] };
  for (const [language, key] of [["uk", "ua"], ["en", "en"], ["de", "de"]]) texts[language].push(...strings(site.texts.content[key]));
  for (const [, key, text] of site.html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) texts.uk.push([key, text]);

  const rules = [
    ["text/spaces", /\s{2,}|^\s|\s$/, "Doubled, leading or trailing spaces."],
    ["text/typography", /\.\.\.|\s-\s|"|``/, "Typewriter characters (... or - or straight quotes).", "Use …, – and the quotes of the language."],
    ["text/empty", /^$/, "Empty text."],
    ["text/markup", /<[a-z/]|&[a-z]+;/i, "HTML inside a text: it would be shown as is."]
  ];
  const perLanguage = {
    uk: [["text/typography", /'/, "ASCII apostrophe.", "Ukrainian uses ’."], ["text/language", /[ыэъё]/i, "A Russian letter in a Ukrainian text."]],
    en: [["text/language", /[Ѐ-ӿ]|[äöüß]/, "Not English."]],
    de: [["text/language", /[Ѐ-ӿ]/, "Not German."], ["text/typography", /“[^„]*“|”/, "Quotes.", "German uses „ and “."], ["text/tone", /\b(?:du|dein\w*|dir|dich|euch)\b/, "Informal address.", "The page says Sie."]]
  };
  for (const [language, list] of Object.entries(texts)) {
    report.ran("text/checked", list.length);
    for (const [key, text] of list) {
      for (const [rule, pattern, message, fix] of [...rules, ...perLanguage[language]]) {
        if (pattern.test(text)) report.add(rule, `${language}: ${key}`, `${message} "${text.slice(0, 70)}"`, fix);
      }
      for (const [pattern, reason] of FORBIDDEN) if (pattern.test(text)) report.add("text/forbidden", `${language}: ${key}`, `${reason} "${text.slice(0, 70)}"`);
    }
  }
  for (const [pattern, reason] of FORBIDDEN) if (pattern.test(site.html)) report.add("text/forbidden", "index.html", reason);
}

function keyRules(site, report) {
  const { html, texts: { page, content } } = site;
  const set = pattern => new Set([...html.matchAll(pattern)].map(match => match[1]));
  const keys = set(/data-i18n(?:-aria|-href|-content)?="([^"]+)"/g);
  for (const language of ["en", "de"]) {
    report.ran("i18n/keys", keys.size);
    for (const key of keys) if (!(key in page[language])) report.add("i18n/keys", `i18n.js page.${language}`, `The translation "${key}" is missing.`);
    for (const key of Object.keys(page[language])) if (!keys.has(key)) report.add("i18n/keys", `i18n.js page.${language}`, `Nothing uses the translation "${key}".`);
  }
  const wanted = { facts: set(/data-fact="([^"]+)"/g), cases: set(/data-case="([^"]+)"/g) };
  for (const language of ["ua", "en", "de"]) {
    const have = { facts: Object.keys(content[language].facts), cases: Object.keys(content[language].walkthrough.cases) };
    for (const name of ["facts", "cases"]) {
      report.ran("i18n/keys", wanted[name].size);
      for (const key of wanted[name]) if (!have[name].includes(key)) report.add("i18n/keys", `content.${language}.${name}`, `"${key}" is missing.`);
      for (const key of have[name]) if (!wanted[name].has(key)) report.add("i18n/keys", `content.${language}.${name}`, `Nothing uses "${key}".`);
    }
  }
  const shape = value => {
    if (Array.isArray(value)) return value.map(shape);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
    return value === null ? "null" : typeof value;
  };
  const placeholders = value => JSON.stringify([...strings(value)].map(([path, text]) => [path, text.match(/\{\w+\}/g)]).filter(([, found]) => found));
  for (const language of ["en", "de"]) {
    report.ran("i18n/shape");
    if (JSON.stringify(shape(content[language])) !== JSON.stringify(shape(content.ua))) report.add("i18n/shape", `content.${language}`, "Its structure differs from the Ukrainian texts (a missing entry or a different order).");
    if (placeholders(content[language]) !== placeholders(content.ua)) report.add("i18n/shape", `content.${language}`, "Placeholders such as {s} differ from the Ukrainian texts.");
    for (const [key, text] of Object.entries(page[language])) {
      if (/^https:\/\/sig-automation\.com\/(?:ua|en|de)\b/.test(text) && !text.startsWith(`https://sig-automation.com/${language}`)) report.add("i18n/links", `page.${language}.${key}`, `Leads to another language: ${text}`);
    }
  }
}

function repositoryRules(site, report) {
  const git = (...args) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8", maxBuffer: 2e7 });
  const tracked = git("ls-files", "--cached", "--others", "--exclude-standard").split("\n").filter(Boolean).filter(file => existsSync(join(ROOT, file)));
  const secrets = [/-----BEGIN [A-Z ]*PRIVATE KEY/, /\bgh[pousr]_[A-Za-z0-9]{20,}/, /\bgithub_pat_\w{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bsk-[A-Za-z0-9-]{20,}/, /\bnpm_[A-Za-z0-9]{30,}/];
  const email = /[\w.+-]+@[\w-]+\.[a-z]{2,}/gi;
  for (const file of tracked) {
    if (/\.(png|jpg|webp|woff2|ttf|ico)$|package-lock\.json$/.test(file)) continue;
    const text = readFileSync(join(ROOT, file), "utf8");
    report.ran("repository/secrets");
    for (const pattern of secrets) if (pattern.test(text)) report.add("repository/secrets", file, "Looks like a credential. This repository is public.", "Remove it, and change the credential.");
    for (const [address] of text.matchAll(email)) if (!/noreply|example\.|@sig-automation\.|@\w+\/|@media/.test(address)) report.add("repository/secrets", file, `An e-mail address in a public repository: ${address.replace(/^(.).*@/, "$1…@")}`);
    if (/^(<{7}|>{7}) /m.test(text)) report.add("repository/conflict", file, "Unresolved merge conflict.");
  }
  for (const file of tracked.filter(name => /^\.github\/workflows\/.*\.ya?ml$/.test(name))) {
    const text = readFileSync(join(ROOT, file), "utf8");
    for (const [, action] of text.matchAll(/uses:\s*(\S+)/g)) {
      report.ran("pipeline/pinned");
      if (!action.startsWith("./") && !/@[0-9a-f]{40}$/.test(action)) report.add("pipeline/pinned", file, `${action} is not pinned to a commit.`);
    }
    report.ran("pipeline/permissions");
    if (!/^permissions:\n\s+contents: read$/m.test(text)) report.add("pipeline/permissions", file, "Must keep: permissions: contents: read.");
    if (/\{\{\s*secrets\./.test(text) && !file.endsWith("deploy-ionos.yml")) report.add("pipeline/secrets", file, "Only the deployment workflow may use secrets.");
    if (/secrets\.(?!CICD_SSH_(?:HOST|USR|PWD)_GITHUB_ACTIONS\b)\w+/.test(text)) report.add("pipeline/secrets", file, "An unexpected secret name.");
  }
  const deploy = ["workflows/deploy-ionos.yml", "scripts/deploy-ionos.sh"].map(name => readFileSync(join(ROOT, ".github", name), "utf8"));
  const script = deploy.join("\n");
  for (const key of ["J4oM+B2g7zZWAI3DolXR1e4vdIMrGO301kEN14/slsQ", "psLDE8kfhoS9GWrc/GTrdlPvyKPcWcGZv2JxOCvwF3w", "1gx2w8Rtv3wCgi7Jh8myf/KVd72cRQbow03UP8P095Q"]) {
    report.ran("pipeline/host-keys");
    if (!script.includes(key)) report.add("pipeline/host-keys", "deploy-ionos.yml", "An official IONOS host key fingerprint changed.", "Check the IONOS page named in the workflow, then change both places.");
  }
  if (/StrictHostKeyChecking[= ](?:no|accept-new|off)|UserKnownHostsFile[= ]\/dev\/null|set -x|sshpass/i.test(script)) report.add("pipeline/host-keys", "deploy-ionos.sh", "Host verification must stay on, and credentials must stay out of the logs.");
  report.ran("pipeline/gate");
  if (!/needs:\s*\[?checks/.test(deploy[0])) report.add("pipeline/gate", "deploy-ionos.yml", "The deployment no longer waits for the checks.");
}

// A ratchet: new colours, sizes and layers are added on purpose, never by accident.
export function designTokens(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const collect = pattern => [...new Set([...text.matchAll(pattern)].map(match => match[1].trim().toLowerCase()))].sort((a, b) => a.localeCompare(b));
  return {
    "colour": collect(/(#[0-9a-f]{3,8}\b)/gi),
    "font size": collect(/[^-]font-size:\s*([^;}]+)/g),
    "corner radius": collect(/border-radius:\s*([^;}]+)/g),
    "layer (z-index)": collect(/z-index:\s*([^;}]+)/g),
    "breakpoint": collect(/@media[^{]*?\((?:max|min)-width:\s*([^)]+)\)/g),
    "font": collect(/font-family:\s*([^;}]+)/g)
  };
}

function tokenRules(site, report, standard) {
  if (!standard) return;
  for (const [name, values] of Object.entries(designTokens(site.css))) {
    report.ran("design/tokens", values.length);
    const fresh = values.filter(value => !standard[name].includes(value));
    if (fresh.length) report.add("design/tokens", "dist/styles.css", `New ${name}: ${fresh.join(", ")}.`, "Use an existing one. If the new one is wanted: npm run standard:accept.");
  }
}

export function loadSite(dist) {
  const file = name => readFileSync(join(dist, name), "utf8");
  const [html, css, js, i18n, htaccess] = ["index.html", "styles.css", "demo.js", "i18n.js", ".htaccess"].map(file);
  return { dist, html, css, js, i18n, htaccess, texts: loadTexts(i18n) };
}

export function checkRules(dist, report, standard, { repository = true } = {}) {
  const site = loadSite(dist);
  fileRules(site, report);
  pageRules(site, report);
  textRules(site, report);
  keyRules(site, report);
  tokenRules(site, report, standard);
  if (repository) repositoryRules(site, report);
}
