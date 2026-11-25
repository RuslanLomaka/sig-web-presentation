// The one command that judges a change: npm run check
//
//   npm run check              everything (about half a minute)
//   npm run check -- --fast    without a browser (about three seconds)
//   npm run check -- --only layout,demo        (rules, lint, layout, standard, demo, scene, fallbacks,
//                                               languages, header, links, keyboard, accessibility, facts)
//   npm run check -- --only layout --views phone-390 --languages de
//   npm run standard:accept    takes the current layout and design tokens as the new standard
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Browser } from "./lib/browser.mjs";
import { rememberPassed } from "./lib/passed.mjs";
import { Report } from "./lib/report.mjs";
import { serve } from "./lib/server.mjs";
import { DIST, LANGUAGES, ROOT } from "./lib/site.mjs";
import { writeVersions } from "./lib/versions.mjs";
import { checkRules, designTokens, loadSite } from "./checks/rules.mjs";
import { VIEWPORTS, checkLayout } from "./checks/layout.mjs";
import { BEHAVIOUR, finish } from "./checks/behaviour.mjs";
import { compareStandard, measureStandard, readStandard, readTokens, standardJobs, writeStandard, writeTokens } from "./checks/standard.mjs";

const options = process.argv.slice(2);
const value = name => { const at = options.indexOf(name); return at < 0 ? null : options[at + 1]; };
const only = value("--only")?.split(",") ?? null;
const wants = name => !only || only.includes(name);
const dist = resolve(value("--dist") ?? DIST);
const views = value("--views")?.split(",") ?? null; // For example phone-390,desktop-1440
const languages = value("--languages")?.split(",") ?? LANGUAGES;
const fast = options.includes("--fast");
const accept = options.includes("--accept");
const report = new Report();
const PARALLEL = 6;

function lint(name, ...parameters) {
  return new Promise(done => {
    const started = spawn(process.execPath, [join(ROOT, "node_modules", ...name), ...parameters], { cwd: ROOT, env: { ...process.env, NO_COLOR: "1" } });
    let output = "";
    started.stdout.on("data", data => { output += data; });
    started.stderr.on("data", data => { output += data; });
    started.on("close", code => {
      report.ran(`lint/${name[0]}`);
      if (code) report.add(`lint/${name[0]}`, parameters.at(-1), `\n${output.trim().replaceAll(`${ROOT}/`, "")}`);
      done();
    });
  });
}

async function staticChecks() {
  if (!options.includes("--no-stamp") && dist === DIST) writeVersions(dist);
  if (wants("rules")) checkRules(dist, report, accept ? null : readTokens(), { repository: dist === DIST });
  if (!wants("lint")) return;
  const files = name => join(dist, name);
  await Promise.all([
    lint(["eslint", "bin", "eslint.js"], "--max-warnings=0", ...(dist === DIST ? ["."] : ["--no-ignore", files("*.js")])),
    lint(["stylelint", "bin", "stylelint.mjs"], files("styles.css")),
    lint(["html-validate", "bin", "html-validate.mjs"], files("index.html"))
  ]);
}

async function browserChecks() {
  const server = await serve(dist);
  const browser = await Browser.launch();
  const open = async (path, view) => {
    const page = await browser.open(path === null ? null : `${server.url}/${path}`, view);
    page.base = `${server.url}/`;
    return page;
  };
  const measured = {};
  const jobs = [];
  if (wants("layout")) {
    for (const view of VIEWPORTS.filter(item => !views || views.includes(item.name))) for (const language of languages) jobs.push([`layout ${view.name}-${language}`, async where => {
      const page = await open(`?lang=${language}`, { ...view, scale: 2 });
      await checkLayout(page, where.slice(7), report, { scale: 2, mobile: view.mobile, pixels: language === languages[0] }); // Icons look the same in every language.
      await finish(page, where.slice(7), report);
    }]);
  }
  if (wants("standard")) {
    for (const { view, language } of standardJobs()) jobs.push([`standard ${view.name}-${language}`, async () => {
      const page = await open(`?lang=${language}`, view);
      Object.assign(measured, await measureStandard(page, view, language));
      await page.close();
    }]);
  }
  if (!accept) for (const [name, check] of Object.entries(BEHAVIOUR)) if (wants(name)) jobs.unshift([name, () => check(open, report)]);
  const work = async () => {
    for (let job = jobs.shift(); job; job = jobs.shift()) {
      try { await job[1](job[0]); } catch (error) { report.add("check/failed", job[0], error.stack.split("\n").slice(0, 3).join(" ")); }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, work));
  await browser.close();
  server.close();
  return measured;
}

if (!existsSync(join(ROOT, "node_modules", "eslint"))) {
  console.log("The linters are not installed. Run: npm run setup");
  process.exit(1);
}
const started = Date.now();
await staticChecks();
if (!fast) {
  const measured = await browserChecks();
  if (accept) {
    const groups = Object.entries(measured).sort(([a], [b]) => a.localeCompare(b));
    writeStandard(Object.fromEntries(groups));
    writeTokens(designTokens(loadSite(dist).css));
  } else if (wants("standard")) compareStandard(measured, readStandard(), report);
}
const kinds = report.print();
const total = [...report.counts.values()].reduce((sum, count) => sum + count, 0);
const seconds = Math.round((Date.now() - started) / 1000);
if (kinds) console.log(`\n${kinds} problem(s) in ${total.toLocaleString("en")} checks, ${seconds} s.`);
else console.log(`✔ ${accept ? "New standard saved. " : ""}${total.toLocaleString("en")} checks passed, ${seconds} s.`);
if (!kinds && !fast && !only && !accept && dist === DIST) rememberPassed();
process.exit(kinds ? 1 : 0);
