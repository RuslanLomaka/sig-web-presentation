// Pictures for looking at a change: npm run shots -- "#demo" --views phone-390,desktop-1440 --languages de,en [--motion] [--step 0.5]
// --step scrolls that many screens past the start of the element (for the three circles). Output: .cache/shots/*.png
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Browser, sleep } from "./lib/browser.mjs";
import { serve } from "./lib/server.mjs";
import { DIST, LANGUAGES, ROOT } from "./lib/site.mjs";
import { VIEWPORTS } from "./checks/layout.mjs";

const options = process.argv.slice(2);
const value = (name, fallback) => { const at = options.indexOf(name); return at < 0 ? fallback : options[at + 1]; };
const selector = options[0]?.startsWith("--") ? "#top" : options[0] ?? "#top";
const views = value("--views", "phone-390,desktop-1440").split(",");
const languages = value("--languages", LANGUAGES.join(",")).split(",");
const motion = options.includes("--motion");
const step = Number(value("--step", "0"));
const folder = join(ROOT, ".cache", "shots");

mkdirSync(folder, { recursive: true });
const server = await serve(DIST);
const browser = await Browser.launch();
for (const view of VIEWPORTS.filter(item => views.includes(item.name))) {
  for (const language of languages) {
    const page = await browser.open(`${server.url}/?lang=${language}`, { ...view, motion, scale: 1.5 });
    await page.run((query, screens) => {
      document.documentElement.style.scrollBehavior = "auto";
      const header = screens ? 0 : document.querySelector(".site-header").offsetHeight + 8;
      scrollTo(0, document.querySelector(query).getBoundingClientRect().top + scrollY - header + screens * innerHeight);
    }, selector, step);
    await sleep(motion ? 1600 : 300);
    const file = join(folder, `${selector.replace(/\W+/g, "") || "page"}-${view.name}-${language}.png`);
    writeFileSync(file, await page.screenshot());
    console.log(file);
    await page.close();
  }
}
await browser.close();
server.close();
