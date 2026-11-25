// The standard: how the approved page is laid out and styled. Any later difference is reported, so nothing
// moves by accident. An intended change is accepted with: npm run standard:accept
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES, ROOT } from "../lib/site.mjs";

export const STANDARD_VIEWS = [
  { name: "phone", width: 390, height: 844, mobile: true },
  { name: "tablet", width: 820, height: 1180, mobile: true },
  { name: "desktop", width: 1440, height: 900 }
];
const FILE = join(ROOT, "tools", "standard", "layout.json");
const TOKENS = join(ROOT, "tools", "standard", "tokens.json");
const TOLERANCE = 2; // Pixels: other Chrome versions round text slightly differently.

const readJson = file => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null);
export const readStandard = () => readJson(FILE);
export const readTokens = () => readJson(TOKENS);
export const writeTokens = tokens => writeFileSync(TOKENS, `${JSON.stringify(tokens, null, 1)}\n`);

// One line per element, so that a change is readable in a diff.
export function writeStandard(standard) {
  const block = entries => Object.entries(entries).map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(",\n");
  const groups = Object.entries(standard).map(([name, entries]) => `  ${JSON.stringify(name)}: {\n${block(entries)}\n  }`);
  writeFileSync(FILE, `{\n${groups.join(",\n")}\n}\n`);
}

// Positions are relative to the section, so one changed section does not report all sections below it.
function measure() {
  document.documentElement.style.setProperty("--mono", "Roboto, sans-serif"); // The code font differs between computers.
  document.documentElement.style.scrollBehavior = "auto";
  scrollTo(0, 0);
  const layout = {};
  const styles = {};
  const round = Math.round;
  for (const section of [document.querySelector("header"), ...document.querySelector("main").children, document.querySelector("footer")]) {
    const origin = section.getBoundingClientRect();
    const label = section.id || section.className.split(" ")[0] || section.tagName.toLowerCase();
    const used = {};
    for (const element of [section, ...section.querySelectorAll("*")]) {
      const important = element === section || element.matches("h1, h2, h3, p, a, button, img, li, dt, dd, summary, label, select, progress, canvas, figure, details") || element.className;
      if (!important || element.closest("svg") || !element.checkVisibility({ visibilityProperty: true, opacityProperty: true }) || element.closest(".stream-word, .scenario-thumb")) continue; // Words and the sliding thumb move with the demo.
      const kind = element === section ? "section" : element.tagName.toLowerCase() + [...element.classList].filter(name => !/^(is-|s\d$|active$)/.test(name)).map(name => `.${name}`).join("");
      const box = element.getBoundingClientRect();
      if (!box.width || box.width < 2) continue;
      used[kind] = (used[kind] ?? 0) + 1;
      const key = `${label} ${kind}${used[kind] > 1 ? ` ${used[kind]}` : ""}`;
      layout[key] = [round(box.left), round(box.top - origin.top), round(box.width), round(box.height)];
      const css = getComputedStyle(element);
      styles[`${label} ${kind}`] ??= [css.color, css.backgroundColor, css.fontSize, css.fontWeight, css.fontFamily.split(",")[0], css.borderTopColor, css.borderTopWidth, css.borderRadius, css.textAlign].join(" | ");
    }
  }
  return { layout, styles };
}

export async function measureStandard(page, view, language) {
  const { layout, styles } = await page.run(measure);
  return { [`${view.name} ${language}`]: layout, ...(view.name === "desktop" && language === "en" ? { styles } : {}) };
}

export function compareStandard(now, standard, report) {
  if (!standard) {
    report.add("standard/missing", "tools/standard/layout.json", "There is no standard yet.", "npm run standard:accept");
    return;
  }
  const accept = "Undo the change, or, if it is wanted and looks right: npm run standard:accept";
  for (const [group, entries] of Object.entries(now)) {
    const before = standard[group] ?? {};
    report.ran("standard/compared", Object.keys(entries).length);
    const changes = [];
    for (const [key, value] of Object.entries(entries)) {
      const old = before[key];
      if (!old) changes.push(`${key} is new`);
      else if (group === "styles") { if (old !== value) changes.push(`${key}: ${describeStyle(old, value)}`); }
      else {
        const moved = ["x", "y", "width", "height"].map((name, i) => [name, old[i], value[i]]).filter(([, a, b]) => Math.abs(a - b) > TOLERANCE);
        if (moved.length) changes.push(`${key}: ${moved.map(([name, a, b]) => `${name} ${a}→${b}`).join(", ")}`);
      }
    }
    for (const key of Object.keys(before)) if (!(key in entries)) changes.push(`${key} is gone`);
    if (changes.length) report.add(group === "styles" ? "standard/style" : "standard/layout", group, `${changes.length} difference(s) from the standard:\n      ${changes.slice(0, 8).join("\n      ")}${changes.length > 8 ? `\n      … and ${changes.length - 8} more` : ""}`, accept);
  }
}

function describeStyle(old, value) {
  const names = ["text colour", "background", "font size", "font weight", "font", "border colour", "border width", "corner radius", "alignment"];
  const [a, b] = [old.split(" | "), value.split(" | ")];
  return names.map((name, i) => [name, a[i], b[i]]).filter(([, x, y]) => x !== y).map(([name, x, y]) => `${name} ${x} → ${y}`).join(", ");
}

export const standardJobs = () => STANDARD_VIEWS.flatMap(view => LANGUAGES.map(language => ({ view, language })));
