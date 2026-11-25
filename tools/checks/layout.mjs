// Alignment, centring, gaps, overflow. Everything is measured in the page, on real text and real pixels.
import { decodePng } from "../lib/browser.mjs";

export const VIEWPORTS = [
  { name: "phone-320", width: 320, height: 568, mobile: true },
  { name: "phone-360", width: 360, height: 740, mobile: true },
  { name: "phone-390", width: 390, height: 844, mobile: true },
  { name: "phone-landscape", width: 844, height: 390, mobile: true },
  { name: "tablet-820", width: 820, height: 1180, mobile: true },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 }
];

// Boxes whose content must sit exactly in the middle. Every visible match is measured.
// axes: x, y (text: optical middle of the capital letters; pictures: their box).
// ink: compare the painted pixels; inset skips the border and round corners, size is a box at the top left.
export const CENTRED = [
  { selector: ".button", axes: "xy" },
  { selector: ".walkthrough-actions button", axes: "xy" },
  { selector: ".scenario-train button", axes: "xy" },
  { selector: ".tabs button", axes: "xy" },
  { selector: ".logo-toggle", axes: "xy" },
  { selector: ".tag", axes: "y" },
  { selector: ".choice-group label span", axes: "xy" },
  { selector: ".lang-btns button.active", axes: "xy" },
  { selector: ".logo-grid li", axes: "xy" },
  { selector: ".assistant-mark", axes: "", ink: { inset: 4, limit: 0.75 } },
  { selector: ".control-flow li", axes: "", ink: { inset: 9, limit: 1.3, size: 38 } }, // The digits in the circles (::before).
  { selector: ".venn-badge", axes: "xy" }
];

// Runs inside the page. Returns a list of { rule, message }.
function audit(centred, phone) {
  const problems = [];
  const counts = {};
  const ran = (rule, amount = 1) => { counts[rule] = (counts[rule] ?? 0) + amount; };
  const add = (rule, message, fix) => problems.push({ rule, message, fix });
  const round = number => Math.round(number * 10) / 10;
  const name = element => {
    const label = element.id ? `#${element.id}` : element.tagName.toLowerCase() + [...element.classList].slice(0, 2).map(item => `.${item}`).join("");
    const parent = element.parentElement;
    if (element.id || !parent || parent === document.body) return label;
    const owner = parent.id ? `#${parent.id}` : parent.tagName.toLowerCase() + [...parent.classList].slice(0, 1).map(item => `.${item}`).join("");
    return `${owner} > ${label}`;
  };
  const style = element => getComputedStyle(element);
  const visible = element => element.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && element.getBoundingClientRect().width > 0;
  const spoken = element => element.closest(".visually-hidden, .skip-link"); // Only for screen readers.
  const scrollable = element => element.parentElement?.closest(".tabs");
  const elements = [...document.body.querySelectorAll("*")].filter(element => visible(element) && !spoken(element) && !element.closest("svg, noscript, option, script"));
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (node.nodeValue.trim() && visible(parent) && !spoken(parent) && !parent.closest("script, noscript, option, svg, .chat-ghost")) textNodes.push(node);
  }
  const textRects = node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return [...range.getClientRects()].filter(rect => rect.width > 0.5);
  };
  const contentBox = element => {
    const rects = [...element.childNodes].flatMap(child => {
      if (child.nodeType === Node.TEXT_NODE) return child.nodeValue.trim() ? textRects(child) : [];
      if (child.nodeType !== Node.ELEMENT_NODE || !visible(child) || style(child).position === "absolute" || spoken(child)) return [];
      return child.matches("img, svg, canvas") ? [child.getBoundingClientRect()] : [contentBox(child)].filter(Boolean);
    });
    if (!rects.length) return null;
    const left = Math.min(...rects.map(rect => rect.left));
    const top = Math.min(...rects.map(rect => rect.top));
    const right = Math.max(...rects.map(rect => rect.right));
    const bottom = Math.max(...rects.map(rect => rect.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };

  // --- Nothing sticks out sideways ---------------------------------------------------------------
  ran("layout/overflow");
  const screenWidth = document.documentElement.clientWidth; // Not innerWidth: phones widen that to fit what sticks out.
  if (document.documentElement.scrollWidth > screenWidth) add("layout/overflow", `The page is ${document.documentElement.scrollWidth - screenWidth}px wider than the screen.`);
  for (const element of elements) {
    if (element.closest(".venn, .hero-image") || scrollable(element)) continue;
    ran("layout/overflow");
    const rect = element.getBoundingClientRect();
    if (rect.right > screenWidth + 0.6 || rect.left < -0.6) add("layout/overflow", `${name(element)} reaches past the screen edge.`);
  }

  // --- Text stays inside its box, is not cut off, and never lies on other text --------------------
  for (const element of elements) {
    if (element.matches("html, body") || scrollable(element)) continue;
    const css = style(element);
    if (css.overflowX !== "visible" && !element.matches(".tabs, .walkthrough, .advantage-stage, .hero, .lang-btns, progress, .venn") && element.scrollWidth > element.clientWidth + 1 && element.clientWidth > 0) add("layout/clipped", `${name(element)} cuts off its text (${element.scrollWidth}px in ${element.clientWidth}px).`);
    ran("layout/clipped");
  }
  for (const node of textNodes) {
    const box = node.parentElement.closest("button, a.button, .tag, li, .conversation-message, label span, summary, .source-result, .source-description, dd, dt, td, .venn-label");
    if (!box || scrollable(box)) continue;
    const frame = box.getBoundingClientRect();
    ran("layout/spill");
    for (const rect of textRects(node)) {
      if (rect.right > frame.right + 1 || rect.left < frame.left - 1) { add("layout/spill", `"${node.nodeValue.trim().slice(0, 30)}" is wider than ${name(box)}.`, "Let it wrap, hyphenate it (soft hyphen), or give it more room."); break; }
    }
  }
  const lines = textNodes.flatMap(node => textRects(node).map(rect => ({ node, rect }))).filter(({ node }) => !node.parentElement.closest(".venn, .fact-tip, .site-header"));
  lines.sort((a, b) => a.rect.top - b.rect.top);
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length && lines[j].rect.top < lines[i].rect.bottom - 3; j++) {
      const [a, b] = [lines[i], lines[j]];
      if (a.node === b.node || a.node.parentElement.contains(b.node) || b.node.parentElement.contains(a.node)) continue;
      const across = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const down = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (across > 1.5 && down > Math.min(a.rect.height, b.rect.height) * 0.4) add("layout/overlap", `"${a.node.nodeValue.trim().slice(0, 25)}" lies on "${b.node.nodeValue.trim().slice(0, 25)}".`);
    }
  }
  ran("layout/overlap", lines.length);

  // --- Centred things are centred -----------------------------------------------------------------
  const canvas = document.createElement("canvas").getContext("2d");
  const capRatio = {}; // Height of the capital letters, measured large because small sizes are rounded.
  const baseline = (node, rect) => { // Of one line of text, from the metrics of its font.
    const css = style(node.parentElement);
    const face = size => `${css.fontStyle} ${css.fontWeight} ${size} ${css.fontFamily}`;
    canvas.font = face("200px");
    capRatio[canvas.font] ??= canvas.measureText("H").actualBoundingBoxAscent / 200;
    const cap = capRatio[canvas.font] * parseFloat(css.fontSize);
    canvas.font = face(css.fontSize);
    const { fontBoundingBoxAscent: ascent, fontBoundingBoxDescent: descent } = canvas.measureText("H");
    const line = rect.top + (rect.height - ascent - descent) / 2 + ascent;
    return { line, middle: line - cap / 2 };
  };
  const firstLine = element => {
    const node = textNodes.find(item => element.contains(item));
    const rect = node && textRects(node)[0];
    return rect ? baseline(node, rect) : null;
  };
  for (const { selector, axes } of centred) {
    for (const element of document.querySelectorAll(selector)) {
      if (!visible(element)) continue;
      const box = element.getBoundingClientRect();
      const inner = contentBox(element);
      if (!inner) continue;
      const oneLine = textNodes.filter(node => element.contains(node)).flatMap(textRects).every((rect, index, all) => Math.abs(rect.top - all[0].top) < 3);
      if (axes.includes("x")) {
        ran("layout/centred");
        const off = inner.left + inner.width / 2 - box.left - box.width / 2;
        if (Math.abs(off) > 1) add("layout/centred", `The content of ${name(element)} is ${round(Math.abs(off))}px too far ${off < 0 ? "left" : "right"}.`, "Centre it with flex or grid, not with padding.");
      }
      if (axes.includes("y")) {
        ran("layout/centred");
        const hasPicture = element.querySelector("img, svg");
        const text = hasPicture || !oneLine ? null : firstLine(element)?.middle ?? null;
        const middle = text ?? inner.top + inner.height / 2;
        const off = middle - box.top - box.height / 2;
        const limit = text === null ? 1.6 : 1.3;
        if (Math.abs(off) > limit) add("layout/centred", `The content of ${name(element)} is ${round(Math.abs(off))}px too ${off < 0 ? "high" : "low"}.`, "Check line-height, min-height and align-items.");
      }
    }
  }

  // --- Siblings: same tops and heights in a row, same gaps everywhere -----------------------------
  const groups = [...document.querySelectorAll("main *, footer *, header *")].filter(parent => visible(parent) && ["grid", "flex", "inline-flex"].includes(style(parent).display));
  for (const parent of groups) {
    const children = [...parent.children].filter(child => visible(child) && !spoken(child) && !["absolute", "fixed"].includes(style(child).position));
    const kind = child => `${child.tagName}.${[...child.classList].filter(item => !/^(active|is-|s\d)/.test(item)).join(".")}`;
    if (children.length < 3 || new Set(children.map(kind)).size > 1 || parent.closest(".venn") || scrollable(children[0])) continue;
    const boxes = children.map(child => ({ child, rect: child.getBoundingClientRect() }));
    const rows = [];
    for (const item of boxes) {
      const row = rows.find(list => item.rect.top < list[0].rect.top + list[0].rect.height / 2 && item.rect.bottom > list[0].rect.top + list[0].rect.height / 2);
      if (row) row.push(item); else rows.push([item]);
    }
    const gapsAcross = [];
    for (const row of rows) {
      ran("layout/rows", row.length);
      const spread = list => Math.max(...list) - Math.min(...list);
      const tops = spread(row.map(({ rect }) => rect.top));
      const heights = spread(row.map(({ rect }) => rect.height));
      const middles = spread(row.map(({ rect }) => rect.top + rect.height / 2));
      const boxed = row.some(({ child }) => style(child).borderTopWidth !== "0px" || style(child).backgroundColor !== "rgba(0, 0, 0, 0)");
      const tidy = middles <= 1 || (tops <= 1 && !boxed) || /baseline/.test(style(parent).alignItems);
      if (!tidy) add("layout/rows", `Items of ${name(parent)} in one row differ: tops by ${round(tops)}px, heights by ${round(heights)}px.`);
      for (let i = 1; i < row.length; i++) gapsAcross.push(row[i].rect.left - row[i - 1].rect.right);
    }
    if (gapsAcross.length > 1 && !/space|stretch/.test(style(parent).justifyContent) && Math.max(...gapsAcross) - Math.min(...gapsAcross) > 1) add("layout/gaps", `Gaps in ${name(parent)} differ: ${[...new Set(gapsAcross.map(round))].join(", ")}px.`);
    const gapsDown = [];
    for (let i = 1; i < rows.length; i++) gapsDown.push(Math.min(...rows[i].map(({ rect }) => rect.top)) - Math.max(...rows[i - 1].map(({ rect }) => rect.bottom)));
    if (gapsDown.length > 1 && Math.max(...gapsDown) - Math.min(...gapsDown) > 1) add("layout/gaps", `Rows of ${name(parent)} are ${[...new Set(gapsDown.map(round))].join(", ")}px apart.`, "Use one gap for the whole group.");
    if (gapsDown.length && gapsAcross.length) ran("layout/gaps", gapsDown.length + gapsAcross.length);
  }

  // --- Label/value rows share a baseline -----------------------------------------------------------
  for (const row of document.querySelectorAll(".answer > div, .facts > div")) {
    const [label, value] = ["dt", "dd"].map(tag => row.querySelector(tag));
    if (!label || !value || !visible(row) || value.getBoundingClientRect().left <= label.getBoundingClientRect().left + 2) continue;
    ran("layout/baseline");
    const [first, second] = [firstLine(label), firstLine(value)];
    if (!first || !second) continue;
    const off = first.line - second.line;
    if (Math.abs(off) > 0.75) add("layout/baseline", `Label and value "${label.textContent.trim()}" are ${round(Math.abs(off))}px apart.`);
  }

  // --- Sections follow each other without gaps; content keeps the page edges -----------------------
  const blocks = [...document.querySelector("main").children, document.querySelector("footer")].filter(visible);
  for (let i = 1; i < blocks.length; i++) {
    ran("layout/sections");
    const gap = blocks[i].getBoundingClientRect().top - blocks[i - 1].getBoundingClientRect().bottom;
    if (gap > 0.05 || gap < -1.05) add("layout/sections", `${gap > 0 ? "A gap" : "An overlap"} of ${round(Math.abs(gap))}px before ${name(blocks[i])}.`, "A hairline of the page background shows there.");
  }
  const frames = [...document.querySelectorAll(".frame")].filter(visible).map(frame => ({ frame, rect: frame.getBoundingClientRect() }));
  for (const { frame, rect } of frames) {
    ran("layout/edges");
    if (Math.abs(rect.left - frames[0].rect.left) > 0.6 || Math.abs(rect.right - frames[0].rect.right) > 0.6) add("layout/edges", `${name(frame)} does not keep the page edges (${round(rect.left)}–${round(rect.right)} instead of ${round(frames[0].rect.left)}–${round(frames[0].rect.right)}).`);
    if (Math.abs(rect.left - (document.documentElement.clientWidth - rect.right)) > 1) add("layout/edges", `${name(frame)} is not centred on the page.`);
  }
  for (const heading of document.querySelectorAll("main h2")) {
    if (!visible(heading)) continue;
    ran("layout/edges");
    const left = heading.getBoundingClientRect().left;
    if (Math.abs(left - frames[0].rect.left) > 0.6) add("layout/edges", `The heading "${heading.textContent.trim().slice(0, 30)}" starts ${round(left - frames[0].rect.left)}px away from the page edge.`);
  }

  // --- Text that is too small, pictures that are missing or distorted -------------------------------
  for (const node of textNodes) {
    ran("layout/small-text");
    const size = parseFloat(style(node.parentElement).fontSize);
    if (size < 11) add("layout/small-text", `"${node.nodeValue.trim().slice(0, 30)}" is only ${round(size)}px.`, "11px is the minimum.");
  }
  for (const image of document.querySelectorAll("img")) {
    if (!visible(image)) continue;
    ran("layout/pictures");
    if (image.complete && !image.naturalWidth) { add("layout/pictures", `${image.getAttribute("src")} does not load.`); continue; }
    const rect = image.getBoundingClientRect();
    const wanted = Number(image.getAttribute("width")) / Number(image.getAttribute("height"));
    if (style(image).objectFit === "fill" && Math.abs(rect.width / rect.height / wanted - 1) > 0.03) add("layout/pictures", `${image.getAttribute("src")} is distorted.`);
  }

  // --- Only interactive things look interactive, and fingers can hit them ---------------------------
  for (const element of elements) {
    ran("interaction/looks");
    if (style(element).cursor === "pointer" && !element.closest("a[href], button, summary, label, select, input, [role=tab], [data-fact]")) add("interaction/looks", `${name(element)} shows a hand cursor but does nothing.`);
  }
  if (phone) {
    for (const element of document.querySelectorAll("button, a[href], summary, select, label")) {
      if (!visible(element) || spoken(element) || style(element).display === "inline") continue;
      const rect = element.getBoundingClientRect();
      ran("interaction/touch");
      const limit = element.matches(".button, .scenario-train button, .tabs button, .logo-toggle, .lang-current, summary") ? 44 : 24;
      if (rect.height < limit - 0.5 || rect.width < 24) add("interaction/touch", `${name(element)} is ${Math.round(rect.height)}px high; fingers need ${limit}px.`);
    }
  }

  // --- The last line of a heading is not a lonely short word -----------------------------------------
  for (const heading of document.querySelectorAll("h1, h2, h3")) {
    if (!visible(heading)) continue;
    ran("layout/headings");
    if (heading.scrollWidth > heading.clientWidth + 1) add("layout/headings", `The heading "${heading.textContent.trim().slice(0, 30)}" does not fit its column.`);
  }
  return { problems, counts };
}

// Compares the painted pixels of a small box with its middle: catches off-centre icons however they are made.
async function inkOffset(page, rect, scale, border) {
  const image = decodePng(await page.screenshot(rect));
  const inset = Math.round(border * scale);
  const background = image.at(inset, Math.round(image.height / 2));
  const differs = (x, y) => image.at(x, y).some((value, i) => Math.abs(value - background[i]) > 60);
  const ink = { left: Infinity, right: -1, top: Infinity, bottom: -1 };
  for (let y = inset; y < image.height - inset; y++) {
    for (let x = inset; x < image.width - inset; x++) {
      if (!differs(x, y)) continue;
      ink.left = Math.min(ink.left, x); ink.right = Math.max(ink.right, x); ink.top = Math.min(ink.top, y); ink.bottom = Math.max(ink.bottom, y);
    }
  }
  if (ink.right < 0) return null;
  return { x: ((ink.left + ink.right + 1) / 2 - image.width / 2) / scale, y: ((ink.top + ink.bottom + 1) / 2 - image.height / 2) / scale };
}

async function checkInk(page, where, report, scale, tab) {
  for (const { selector, ink } of CENTRED.filter(item => item.ink)) {
    const total = await page.evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
    for (let index = 0; index < total; index++) {
      const inTab = await page.evaluate(`Boolean(document.querySelectorAll(${JSON.stringify(selector)})[${index}].closest("[role=tabpanel]"))`);
      if (!inTab && tab) continue; // Already measured with the first tab.
      const rect = await page.run((query, place, size) => {
        const element = document.querySelectorAll(query)[place];
        if (!element.checkVisibility({ visibilityProperty: true })) return null;
        element.scrollIntoView({ block: "center", behavior: "instant" });
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x: x + scrollX, y: y + scrollY, width: size ?? width, height: size ?? height };
      }, selector, index, ink.size);
      if (!rect) continue;
      const off = await inkOffset(page, rect, scale, ink.inset);
      report.ran("layout/icon-centred");
      if (!off) report.add("layout/icon-centred", where, `The icon in ${selector} is not visible.`);
      else if (Math.max(Math.abs(off.x), Math.abs(off.y)) > ink.limit) report.add("layout/icon-centred", where, `The icon in ${selector} is off centre (${off.x.toFixed(1)}px across, ${off.y.toFixed(1)}px down).`, "Draw it (SVG or CSS) instead of typing a character.");
    }
  }
}

// Opens everything that is closed by default, so that hidden parts are measured as well.
const reveal = () => {
  document.querySelectorAll("details").forEach(element => { element.open = true; });
  document.querySelectorAll("img[loading=lazy]").forEach(image => { image.loading = "eager"; });
  document.documentElement.style.scrollBehavior = "auto";
  return Promise.all([...document.images].map(image => image.decode().catch(() => null))).then(() => true);
};

export async function checkLayout(page, where, report, { scale, mobile, pixels }) {
  const tabs = await page.evaluate("document.querySelectorAll('.tabs [role=tab]').length");
  const open = index => page.run(tab => { document.querySelectorAll(".tabs [role=tab]")[tab].click(); }, index);
  const stacked = await page.evaluate("innerWidth > 800"); // Phones show one panel at a time, at its own height.
  const heights = [];
  for (let tab = 0; tab < tabs; tab++) {
    await open(tab);
    heights.push(await page.evaluate("document.documentElement.scrollHeight"));
  }
  report.ran("layout/stable");
  if (stacked && Math.max(...heights) - Math.min(...heights) > 1) report.add("layout/stable", where, `The page jumps when switching example tabs (heights ${heights.join(", ")}px).`, "All panels share one grid cell.");
  await page.run(reveal);
  for (let tab = 0; tab < tabs; tab++) {
    await open(tab);
    const { problems, counts } = await page.run(audit, tab ? CENTRED.filter(item => item.selector === ".choice-group label span" || item.selector === ".tag") : CENTRED, mobile);
    for (const [rule, amount] of Object.entries(counts)) report.ran(rule, amount);
    for (const { rule, message, fix } of problems) report.add(rule, where, message, fix);
    if (pixels) await checkInk(page, where, report, scale, tab);
  }
  await open(0);
}
