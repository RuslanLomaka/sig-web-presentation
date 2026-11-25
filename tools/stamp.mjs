// Writes the ?v= cache versions into dist/index.html (npm run check does this, too).
import { DIST } from "./lib/site.mjs";
import { writeVersions } from "./lib/versions.mjs";

console.log(writeVersions(DIST) ? "Cache versions updated." : "Cache versions are up to date.");
