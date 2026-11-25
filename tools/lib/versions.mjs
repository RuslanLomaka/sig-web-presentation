// Cache versions: index.html links CSS and JS with ?v=<hash of the file>, so a changed file always gets a new address.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hash } from "./site.mjs";

export function stampVersions(html, dist) {
  return html.replace(/((?:href|src)=")([\w./-]+\.(?:css|js))(?:\?v=[\w-]*)?"/g, (whole, start, file) => `${start}${file}?v=${hash(readFileSync(join(dist, file)))}"`);
}

export function writeVersions(dist) {
  const path = join(dist, "index.html");
  const html = readFileSync(path, "utf8");
  const stamped = stampVersions(html, dist);
  if (stamped !== html) writeFileSync(path, stamped);
  return stamped !== html;
}
