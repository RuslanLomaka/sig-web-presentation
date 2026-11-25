// Claude Code, before a turn ends: if the site or its tools changed and this state has not passed yet,
// the full check runs, and its findings go back to Claude instead of to the customer.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../lib/site.mjs";
import { hasPassed } from "../lib/passed.mjs";

const { stop_hook_active: again = false } = JSON.parse(readFileSync(0, "utf8") || "{}");
const git = (...parameters) => execFileSync("git", ["-C", ROOT, ...parameters], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const changed = () => {
  if (git("status", "--porcelain", "--", "dist", "tools", ".github")) return true;
  try { return git("diff", "--name-only", "@{upstream}", "--", "dist", "tools", ".github") !== ""; } catch { return false; }
};
if (!changed() || hasPassed()) process.exit(0);
if (!existsSync(join(ROOT, "node_modules", "eslint"))) {
  console.error("The site changed, but the checks are not installed. Run: npm run setup && npm run check");
  process.exit(again ? 0 : 2);
}
const { status, stdout, stderr } = spawnSync(process.execPath, [join(ROOT, "tools", "check.mjs")], { cwd: ROOT, encoding: "utf8" });
if (!status) process.exit(0);
console.error(`The site changed and the check fails. Fix this before reporting to the user:\n\n${(stdout + stderr).slice(-9000)}`);
process.exit(again ? 0 : 2); // One more round; after that the result is reported as it is.
