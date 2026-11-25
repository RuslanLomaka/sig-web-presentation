// Claude Code, after every edit: lints the edited file at once, so a slip is corrected while it is fresh.
// (Checks across files and in the browser run before the turn ends: before-stop.mjs.)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "../lib/site.mjs";

const { tool_input: input = {} } = JSON.parse(readFileSync(0, "utf8"));
const file = input.file_path ? relative(ROOT, input.file_path) : "";
const linters = [
  [/^dist\/[\w.-]+\.js$|^tools\/.*\.mjs$/, ["eslint", "bin", "eslint.js"]],
  [/^dist\/[\w.-]+\.css$/, ["stylelint", "bin", "stylelint.mjs"]],
  [/^dist\/[\w.-]+\.html$/, ["html-validate", "bin", "html-validate.mjs"]]
];
const linter = linters.find(([pattern]) => pattern.test(file))?.[1];
const program = linter && join(ROOT, "node_modules", ...linter);
if (!program || !existsSync(program)) process.exit(0);
const { status, stdout, stderr } = spawnSync(process.execPath, [program, file], { cwd: ROOT, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
if (status) {
  console.error(`${file} has problems:\n${(stdout + stderr).trim()}`);
  process.exit(2); // Shown to Claude.
}
