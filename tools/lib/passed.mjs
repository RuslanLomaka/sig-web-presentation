// Remembers which exact state of the project passed the full check, so that nobody has to wait for it twice.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, listFiles } from "./site.mjs";

const FILE = join(ROOT, ".cache", "passed");

export function fingerprint() {
  const sum = createHash("sha256");
  for (const folder of ["dist", "tools", ".github"]) {
    for (const file of listFiles(join(ROOT, folder))) sum.update(file).update(readFileSync(join(ROOT, folder, file)));
  }
  for (const file of ["package.json", "eslint.config.js", "stylelint.config.js", ".htmlvalidate.json"]) sum.update(readFileSync(join(ROOT, file)));
  return sum.digest("hex");
}

export const hasPassed = () => existsSync(FILE) && readFileSync(FILE, "utf8") === fingerprint();

export function rememberPassed() {
  mkdirSync(join(ROOT, ".cache"), { recursive: true });
  writeFileSync(FILE, fingerprint());
}
