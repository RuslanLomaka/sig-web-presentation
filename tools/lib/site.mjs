// Where things are, and how to read the texts of the page.
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DIST = join(ROOT, "dist");
export const LANGUAGES = ["uk", "en", "de"];

export const read = path => readFileSync(join(ROOT, path), "utf8");
export const hash = content => createHash("sha256").update(content).digest("hex").slice(0, 8);

export function listFiles(folder = DIST) {
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(folder, join(entry.parentPath, entry.name)))
    .sort((a, b) => a.localeCompare(b));
}

// Runs dist/i18n.js outside a browser and returns its two text collections.
export function loadTexts(source = read("dist/i18n.js")) {
  const nothing = () => undefined;
  const context = {
    console, URL, URLSearchParams, CustomEvent: class {},
    navigator: { languages: ["en"], language: "en" },
    localStorage: { getItem: () => null, setItem: nothing },
    window: { setTimeout: () => 0, location: { search: "", href: "http://x/" }, history: { replaceState: nothing } },
    document: {
      documentElement: { classList: { add: nothing, remove: nothing } },
      addEventListener: nothing, querySelectorAll: () => [], querySelector: () => null, dispatchEvent: nothing
    }
  };
  vm.createContext(context);
  const exposed = source.replace("window.SIG_I18N = api;", "window.SIG_I18N = api; window.texts = { page, content };");
  if (exposed === source) throw new Error("dist/i18n.js no longer contains 'window.SIG_I18N = api;': update tools/lib/site.mjs.");
  vm.runInContext(exposed, context); // eslint-disable-line sonarjs/code-eval -- our own file
  return context.window.texts;
}

// Every string in a nested object, with its path: ["walkthrough.cases.stock.role", "Schichtleitung"].
export function* strings(value, path = "") {
  if (typeof value === "string") yield [path, value];
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) yield* strings(item, path ? `${path}.${key}` : key);
}
