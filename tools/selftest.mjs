// Proves that the checks work: plants one known mistake at a time into a copy of the site and expects a report.
// Most of these happened for real. A new kind of mistake gets a check, and a line here.  npm run selftest
import { spawn } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIST, ROOT } from "./lib/site.mjs";
import { writeVersions } from "./lib/versions.mjs";

const css = rule => ["styles.css", text => `${text}\n${rule}\n`];
const swap = (file, old, fresh) => [file, text => {
  if (!text.includes(old)) throw new Error(`"${old}" is no longer in ${file}: update tools/selftest.mjs.`);
  return text.replace(old, () => fresh);
}];
const layout = (views = "desktop-1440", languages = "de") => ["--only", "layout", "--views", views, "--languages", languages];
const only = name => ["--only", name];

const MISTAKES = [
  // [what goes wrong, the rule that must report it, how to plant it, which checks to run]
  ["button text too high", "layout/centred", css(".button { align-items: flex-start; }"), layout()],
  ["button text too far left", "layout/centred", css(".logo-toggle { justify-content: flex-start; }"), layout("phone-390")],
  ["text off-centre in all boxes (font metrics)", "layout/centred", swap("styles.css", "ascent-override: 96%", "ascent-override: 75%"), layout()],
  ["icon off-centre", "layout/icon-centred", css(".assistant-mark::before { transform: translate(2px, -1px); }"), layout()],
  ["digit off-centre in its circle", "layout/icon-centred", css(".control-flow li::before { padding-top: 6px; }"), layout()],
  ["icon typed as a character", "page/glyph-icons", swap("index.html", '<span class="assistant-mark" aria-hidden="true"></span>', '<span class="assistant-mark" aria-hidden="true">✦</span>'), only("rules")],
  ["uneven gaps", "layout/gaps", css(".logo-grid li:nth-child(3) { margin-left: 7px; }"), layout()],
  ["uneven rows", "layout/rows", css(".logo-grid { grid-auto-rows: auto; align-items: start; } .logo-grid li:nth-child(2) { min-height: 96px; }"), layout()],
  ["gap between sections", "layout/sections", css("#demo { margin-top: 3px; }"), layout()],
  ["heading off the page edge", "layout/edges", css("#demo-title { margin-left: 5px; }"), layout()],
  ["page wider than the phone", "layout/overflow", css(".demo-shell { width: 108%; }"), layout("phone-390")],
  ["label runs into its value", "layout/spill", css(".facts > div { grid-template-columns: 60px 1fr; } .facts dt { hyphens: none; overflow-wrap: normal; }"), layout()],
  ["text lies on text", "layout/overlap", css("#demo .section-intro > p { position: relative; left: -600px; }"), layout()],
  ["text cut off", "layout/clipped", css(".walkthrough-status span { max-width: 60px; white-space: nowrap; overflow: hidden; }"), layout()],
  ["tiny text", "layout/small-text", css(".small-note { font-size: .6rem; }"), layout()],
  ["example tabs make the page jump", "layout/stable", css(".demo-shell > .scenario[hidden] { display: none !important; }"), layout()],
  ["looks clickable but is not", "interaction/looks", css(".control-flow li { cursor: pointer; }"), layout()],
  ["too small for fingers", "interaction/touch", css(".tabs button { min-height: 28px; padding-block: 2px; }"), layout("phone-390")],
  ["missing translation", "i18n/keys", swap("i18n.js", '      navPilot: "Where to start",\n', ""), only("rules")],
  ["text without translation", "i18n/visible", swap("index.html", '<div class="section-intro demo-intro">', '<div class="section-intro demo-intro"><p>Новий текст</p>'), only("languages")],
  ["informal German", "text/tone", swap("i18n.js", "Vier Situationen", "Schau dir vier Situationen"), only("rules")],
  ["straight quotes and dots", "text/typography", swap("i18n.js", '"Watch the demo"', '"Watch the demo..."'), only("rules")],
  ["illustrative data mentioned", "text/forbidden", swap("i18n.js", '"Typical usage scenarios"', '"Scenarios with illustrative data"'), only("rules")],
  ["old product name", "text/forbidden", swap("index.html", "<title", "<!-- SIG Intelligence --><title"), only("rules")],
  ["inline style", "security/csp", swap("index.html", '<main id="main"', '<main id="main" style="color:red"'), only("rules")],
  ["script from another server", "security/external", swap("index.html", "</head>", '<script src="https://cdn.example.org/x.js"></script></head>'), only("rules")],
  ["weaker security policy", "security/csp", swap(".htaccess", "script-src 'self'", "script-src 'self' 'unsafe-inline'"), only("rules")],
  ["link to an unknown site", "security/links", swap("index.html", "https://sig-automation.com/impressum", "https://sig-automation.example/impressum"), only("rules")],
  ["stale cache version", "files/version", css(".x-unused { margin: 0; }"), only("rules"), { stamp: false }],
  ["file nobody uses", "files/used", ["assets/forgotten.svg", () => "<svg xmlns='http://www.w3.org/2000/svg'/>"], only("rules")],
  ["missing picture", "files/exists", swap("index.html", 'src="assets/brand/sintelligence.png"', 'src="assets/brand/gone.png"'), only("rules")],
  ["picture without a size", "page/images", swap("index.html", ' width="595" height="56"', ""), only("rules")],
  ["new colour", "design/tokens", css(".small-note { color: #123457; }"), only("rules")],
  ["hidden focus ring", "lint/stylelint", css(".button { outline: none; }"), only("lint")],
  ["HTML from text", "lint/eslint", ["demo.js", text => text.replace("})();", 'document.body.innerHTML = "x";\n})();')], only("lint")],
  ["unused variable", "lint/eslint", ["demo.js", text => text.replace('"use strict";', '"use strict";\nconst forgotten = 1;')], only("lint")],
  ["broken HTML", "lint/html-validate", swap("index.html", "</main>", "</div></main>"), only("lint")],
  ["checks visible before the question", "demo/honest", swap("demo.js", "checksList.hidden = !checking", "checksList.hidden = false"), only("demo")],
  ["demo does not fit on a phone", "demo/one-screen", css(".conversation { gap: 90px; }"), only("demo")],
  ["demo changes its height", "demo/height", ["demo.js", text => text.replace(/conversation\.style\.minHeight = `.*`;/, "")], only("demo")],
  ["demo stops after one scenario", "demo/loop", swap("demo.js", "selectCase((caseIndex + 1) % scenarioButtons.length)", "selectCase(caseIndex)"), only("demo")],
  ["pause does not stop the dots", "demo/pause", css('.walkthrough[data-running="false"] :is(.chat-caret, .thinking-dots i, .check-mark) { animation-play-state: running !important; }'), only("demo")],
  ["label off the middle of its circle", "scene/centred", swap("styles.css", "calc(-50% + 11.8cqw)", "calc(-50% + 7cqw)"), only("scene")],
  ["scene scrolls away", "scene/pinned", css("main { overflow: hidden; }"), only("scene")],
  ["scene skips a step", "scene/steps", swap("demo.js", "[-0.42, 0.22, 0.72, 1.22, 1.62]", "[-0.42, 0.22, 0.22, 1.22, 1.62]"), only("scene")],
  ["moves despite reduced motion", "fallback/reduced-motion", css(".brand { animation: check-spin 2s linear infinite; }"), only("fallbacks")],
  ["invisible without JavaScript", "fallback/no-script", css(".venn-badge { opacity: 0; } .scene-ready .s5 .venn-badge { opacity: 1; }"), only("fallbacks")],
  ["solid header on phones", "header/phone", css("header.site-header { background: #101b17; backdrop-filter: none; }"), only("header")],
  ["flags shown all the time", "header/language", css(".lang-btns button.active::before { opacity: 1; }"), only("header")],
  ["link leads nowhere", "links/anchors", swap("index.html", 'href="#pilot" data-i18n="navPilot"', 'href="#pilots" data-i18n="navPilot"'), only("links")],
  ["text hard to read", "accessibility/color-contrast", css(".small-note { color: #b8c4bb; }"), only("accessibility")],
  ["section moved", "standard/layout", css("#examples { padding-top: 90px; }"), only("standard")],
  ["element restyled", "standard/style", css(".button-primary { border-radius: 14px; }"), only("standard")],
  ["script error", "page/errors", ["demo.js", text => text.replace("})();", "undefinedFunction();\n})();")], only("header")]
];

const folder = join(ROOT, ".cache", "selftest");
rmSync(folder, { recursive: true, force: true });
const filter = process.argv[2];
const list = MISTAKES.filter(([name]) => !filter || name.includes(filter));
let missed = 0;

function run(parameters) {
  return new Promise(done => {
    const started = spawn(process.execPath, [join(ROOT, "tools", "check.mjs"), ...parameters], { cwd: ROOT });
    let output = "";
    started.stdout.on("data", data => { output += data; });
    started.stderr.on("data", data => { output += data; });
    started.on("close", (code, signal) => done(output || `No output (code ${code}, signal ${signal}).`));
  });
}

async function plant([name, rule, [file, change], parameters, { stamp = true } = {}], index) {
  const dist = join(folder, String(index), "dist");
  mkdirSync(dist, { recursive: true });
  cpSync(DIST, dist, { recursive: true });
  const path = join(dist, file);
  let before = "";
  try { before = readFileSync(path, "utf8"); } catch { /* A new file. */ }
  const after = change(before);
  if (after === before) throw new Error(`"${name}" changes nothing: update tools/selftest.mjs.`);
  writeFileSync(path, after);
  if (stamp) writeVersions(dist);
  const output = await run(["--dist", dist, ...parameters]);
  const caught = output.includes(`✖ ${rule}:`);
  if (!caught) missed++;
  console.log(`${caught ? "✔ caught" : "✖ MISSED"}  ${name}  (${rule})${caught ? "" : `\n${output.slice(-600)}`}`);
  rmSync(join(folder, String(index)), { recursive: true, force: true });
}

const queue = list.map((mistake, index) => [mistake, index]);
const work = async () => { for (let next = queue.shift(); next; next = queue.shift()) await plant(...next); };
await Promise.all(Array.from({ length: 4 }, work));
console.log(missed ? `\n${missed} of ${list.length} planted mistakes were missed.` : `\n✔ All ${list.length} planted mistakes were caught.`);
process.exit(missed ? 1 : 0);
