// Serves dist/ with the production security headers: npm run preview
import { DIST } from "./lib/site.mjs";
import { serve } from "./lib/server.mjs";

const { url } = await serve(DIST, Number(process.env.PORT ?? 8791));
console.log(`${url}/?lang=en   (de, uk) – stop with Ctrl+C`);
