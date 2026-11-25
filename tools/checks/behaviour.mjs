// What the page does: demo, three circles, languages, header, keyboard, accessibility, and no-script fallback.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sleep } from "../lib/browser.mjs";
import { LANGUAGES, ROOT } from "../lib/site.mjs";

const PHONE = { width: 390, height: 664, mobile: true };
const DESKTOP = { width: 1440, height: 900 };
const CYRILLIC = /[Ѐ-ӿ]/;

// Runs the page's own clock eight times faster, so that a whole demo loop takes seconds.
const FAST = `(() => {
  const factor = 8, timeout = window.setTimeout.bind(window), now = performance.now.bind(performance), start = now();
  performance.now = () => start + (now() - start) * factor;
  window.setTimeout = (callback, ms = 0, ...rest) => timeout(callback, ms / factor, ...rest);
})()`;

const scrollToDemo = () => {
  const still = new CSSStyleSheet(); // The clock runs fast, the style transitions do not: leave them out.
  still.replaceSync("*, *::before, *::after { transition: none !important; }");
  document.adoptedStyleSheets = [still];
  document.documentElement.style.scrollBehavior = "auto";
  const demo = document.querySelector("#walkthrough").getBoundingClientRect();
  scrollTo(0, demo.top + scrollY - document.querySelector(".site-header").offsetHeight - 8);
};

async function checkDemo(open, report) {
  await Promise.all([[PHONE, "de"], [PHONE, "uk"], [DESKTOP, "en"]].map(async ([view, language]) => {
    const where = `demo ${view.width}-${language}`;
    const page = await open(`?lang=${language}`, { ...view, motion: true, script: FAST });
    await page.run(scrollToDemo);
    await page.run(() => {
      const get = selector => document.querySelector(selector);
      window.seen = { heights: new Set(), early: 0, order: [], steps: {}, thumb: 0 };
      let last = "";
      setInterval(() => {
        const list = get("#walkthrough-checks");
        const box = get("#walkthrough-checked");
        const typing = get("#walkthrough-question .chat-ghost").textContent.length > 0;
        const current = get("[data-case][aria-pressed=true]").dataset.case;
        seen.heights.add(get("#walkthrough").offsetHeight);
        if (typing && (!list.hidden || !box.hidden || getComputedStyle(get(".conversation-answer")).visibility === "visible")) seen.early++;
        if (current !== last) { seen.order.push(current); last = current; }
        const shown = list.hidden ? 0 : list.querySelectorAll('li:not([data-state="wait"])').length;
        (seen.steps[current] ??= new Set()).add(shown);
      }, 4);
    });
    // One whole loop and the start of the next one, however slow this computer is.
    for (let waited = 0; waited < 60000; waited += 500) {
      await sleep(500);
      if (await page.evaluate("seen.order.length > document.querySelectorAll('[data-case]').length && !document.querySelector('#walkthrough-checks').hidden")) break;
    }
    const result = await page.run(() => ({ heights: [...seen.heights], early: seen.early, order: seen.order, steps: Object.fromEntries(Object.entries(seen.steps).map(([key, set]) => [key, [...set].sort()])), buttons: [...document.querySelectorAll("[data-case]")].map(button => button.dataset.case), header: document.querySelector(".site-header").offsetHeight }));
    report.ran("demo/runs", result.order.length);
    if (Math.max(...result.heights) - Math.min(...result.heights) > 1) report.add("demo/height", where, `The demo changes its height while it plays: ${result.heights.join(", ")}px.`, "reserveHeights() must measure every state.");
    if (result.early) report.add("demo/honest", where, "Something of the answer or the checks shows before the question is typed.", "The assistant decides what to check only after the question.");
    const expected = Array.from(result.order, (_, i) => result.buttons[i % result.buttons.length]);
    if (result.order.length < result.buttons.length + 1) report.add("demo/loop", where, `The demo played only ${result.order.join(", ")}.`, "It must play every scenario and start over.");
    else if (result.order.join() !== expected.join()) report.add("demo/loop", where, `Wrong order: ${result.order.join(", ")}.`);
    for (const key of result.buttons) if ((result.steps[key] ?? []).join() !== "0,1,2,3,4") report.add("demo/steps", where, `The checks of "${key}" do not appear one by one (${result.steps[key]}).`);
    if (view.mobile && result.heights[0] > view.height - result.header) report.add("demo/one-screen", where, `The demo is ${result.heights[0]}px high, the phone shows ${view.height - result.header}px.`, "It must fit on one phone screen.");

    // Pause stops everything; the disclosure holds the demo and lets it go on.
    const state = () => page.run(() => ({ playing: document.querySelector("#walkthrough-toggle").textContent, moving: document.getAnimations().filter(item => item.playState === "running" && item.effect.getComputedTiming().iterations === Infinity && item.effect.target.closest("#walkthrough")).length }));
    await page.run(() => { document.querySelector("#walkthrough-toggle").click(); });
    const paused = await state();
    report.ran("demo/pause");
    if (paused.moving) report.add("demo/pause", where, `${paused.moving} animation(s) keep running after Pause.`);
    await page.run(() => { document.querySelector("#walkthrough-toggle").click(); document.querySelectorAll("[data-case]")[1].click(); });
    await page.evaluate("new Promise((done, fail) => { const end = Date.now() + 25000; const wait = () => { if (!document.querySelector('#walkthrough-checked').hidden) done(); else if (Date.now() > end) fail(new Error('the answer never finished')); else setTimeout(wait, 20); }; wait(); })");
    const before = await state();
    await page.run(() => { document.querySelector("#walkthrough-checked summary").click(); });
    await sleep(300);
    const held = await state();
    await page.run(() => { document.querySelector("#walkthrough-checked summary").click(); });
    await sleep(300);
    const after = await state();
    if (held.playing === before.playing || after.playing !== before.playing) report.add("demo/hold", where, "Opening “What the assistant checked” does not hold the demo, or closing it does not let it go on.");
    const thumb = await page.run(async () => {
      await new Promise(done => { requestAnimationFrame(() => requestAnimationFrame(done)); });
      document.querySelector(".scenario-thumb").getAnimations().forEach(item => item.finish());
      const [a, b] = [".scenario-thumb", "[data-case][aria-pressed=true]"].map(selector => document.querySelector(selector).getBoundingClientRect());
      return Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.width - b.width), Math.abs(a.height - b.height));
    });
    report.ran("demo/train");
    if (thumb > 1) report.add("demo/train", where, `The train is ${thumb.toFixed(1)}px off its scenario button.`);
    await finish(page, where, report);
  }));
}

async function checkScene(open, report) {
  for (const [view, language] of [[PHONE, "uk"], [{ width: 320, height: 568, mobile: true }, "de"], [{ width: 1366, height: 650 }, "de"], [DESKTOP, "en"]]) {
    const where = `circles ${view.width}-${language}`;
    const page = await open(`?lang=${language}`, { ...view, motion: true });
    const go = at => page.run(async position => {
      document.documentElement.style.scrollBehavior = "auto";
      const scene = document.querySelector("#advantage");
      scrollTo(0, scene.getBoundingClientRect().top + scrollY + position * innerHeight);
      dispatchEvent(new Event("scroll"));
      await new Promise(done => { setTimeout(done, 60); });
      document.getAnimations().filter(item => item.effect.target.closest("#advantage")).forEach(item => item.finish());
      const stage = document.querySelector("#advantage-stage");
      const middle = element => { const box = element.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2, left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width }; };
      const shown = element => Number(getComputedStyle(element).opacity) > 0.5;
      return {
        steps: [1, 2, 3, 4, 5].filter(step => stage.classList.contains(`s${step}`)).length,
        circles: [...document.querySelectorAll(".venn-circle")].filter(shown).map(circle => ({ ...middle(circle), label: middle(circle.querySelector(".venn-label")) })),
        badge: shown(document.querySelector(".venn-badge")) ? middle(document.querySelector(".venn-badge")) : null,
        venn: middle(document.querySelector(".venn")), notes: middle(document.querySelector(".advantage-notes")), title: middle(document.querySelector("#advantage-title")),
        header: document.querySelector(".site-header").offsetHeight, screen: { width: document.documentElement.clientWidth, height: innerHeight },
        captions: [...document.querySelectorAll(".advantage-notes li, .advantage-text")].filter(shown).length, pinned: Math.abs(stage.getBoundingClientRect().top) < 1, text: getComputedStyle(document.querySelector("#advantage-title em")).opacity
      };
    }, at);
    const expected = [[-0.9, 0], [-0.3, 1], [0.1, 1], [0.5, 2], [1, 3], [1.4, 4], [1.9, 5], [1, 3], [-0.9, 0]]; // Forward, then back.
    for (const [at, steps] of expected) {
      const now = await go(at);
      report.ran("scene/steps");
      if (now.steps !== steps) report.add("scene/steps", where, `At ${at} screens the scene is at step ${now.steps}, not ${steps}.`);
      if (at >= 0 && !now.pinned) report.add("scene/pinned", where, "The scene does not stay in place while it plays.", "An ancestor with overflow: hidden breaks position: sticky.");
      if (now.circles.length !== Math.min(steps, 3)) report.add("scene/steps", where, `Step ${steps} shows ${now.circles.length} circles.`);
      for (const circle of now.circles) {
        report.ran("scene/inside");
        if (circle.left < -1 || circle.right > now.screen.width + 1) report.add("scene/inside", where, `A circle leaves the screen at step ${steps}.`);
        if (steps < 4 && Math.max(Math.abs(circle.label.x - circle.x), Math.abs(circle.label.y - circle.y)) > 1.5) report.add("scene/centred", where, `A label is off the middle of its circle by ${Math.round(Math.abs(circle.label.x - circle.x))}/${Math.round(Math.abs(circle.label.y - circle.y))}px.`);
      }
      if (steps === 5) {
        report.ran("scene/centred");
        if (!now.badge) { report.add("scene/steps", where, "The Sintelligence badge is missing at the end."); continue; }
        if (Math.abs(now.badge.x - now.venn.x) > 1) report.add("scene/centred", where, `The badge is ${Math.round(Math.abs(now.badge.x - now.venn.x))}px off the middle.`);
        if (Number(now.text) < 1) report.add("scene/steps", where, "The second half of the headline is missing at the end.");
        if (now.title.top < now.header - 1 || Math.max(now.notes.bottom, now.venn.bottom) > now.screen.height + 1) report.add("scene/fits", where, "The finished picture does not fit on the screen.");
      }
    }
    await finish(page, where, report);
  }
}

async function checkFallbacks(open, report) {
  for (const view of [PHONE, DESKTOP]) {
    const where = `reduced motion ${view.width}`;
    const page = await open("?lang=de", view);
    const result = await page.run(() => ({
      moving: document.getAnimations().filter(item => item.playState === "running").map(item => item.animationName ?? item.transitionProperty),
      scene: document.querySelector("#advantage").offsetHeight / innerHeight, badge: getComputedStyle(document.querySelector(".venn-badge")).opacity,
      answer: document.querySelector("#walkthrough-answer").textContent.trim().length, checked: document.querySelector("#walkthrough-checked").hidden
    }));
    report.ran("fallback/reduced-motion");
    if (result.moving.length) report.add("fallback/reduced-motion", where, `Still moving: ${[...new Set(result.moving)].join(", ")}.`, "Add it to the prefers-reduced-motion block in styles.css.");
    if (result.scene > 2 || result.badge !== "1") report.add("fallback/reduced-motion", where, "The three circles do not show the finished picture.");
    if (!result.answer || result.checked) report.add("fallback/reduced-motion", where, "The demo does not show the finished dialog.");
    await finish(page, where, report);
  }
  const page = await open(null, DESKTOP);
  await page.send("Emulation.setScriptExecutionDisabled", { value: true });
  await page.goto(page.base);
  const plain = await page.run(() => ({ body: getComputedStyle(document.body).visibility, badge: getComputedStyle(document.querySelector(".venn-badge")).opacity, scene: document.querySelector("#advantage").offsetHeight / innerHeight, answer: document.querySelector("#walkthrough-answer").textContent.trim().length, checked: document.querySelector("#walkthrough-checked").checkVisibility() }));
  report.ran("fallback/no-script");
  if (plain.body !== "visible" || plain.badge !== "1" || plain.scene > 2 || !plain.answer || !plain.checked) report.add("fallback/no-script", "no JavaScript", "Part of the page is invisible without JavaScript.");
  await finish(page, "no JavaScript", report);
}

async function checkLanguages(open, report) {
  const names = { uk: "Українська", en: "English", de: "Deutsch" };
  for (const language of LANGUAGES) {
    const page = await open(`?lang=${language}`, DESKTOP);
    const texts = await page.run(() => {
      const found = [];
      const collect = () => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) if (!walker.currentNode.parentElement.closest("script, .lang-switch")) found.push(walker.currentNode.nodeValue.trim());
        for (const element of document.querySelectorAll("[aria-label], [alt], [title], [placeholder]")) if (!element.closest(".lang-switch")) for (const name of ["aria-label", "alt", "title", "placeholder"]) found.push(element.getAttribute(name) ?? "");
      };
      document.querySelectorAll(".tabs [role=tab], [data-case], .choice-group input").forEach(element => { element.click(); collect(); });
      return { found: [...new Set(found)].filter(Boolean), title: document.title, html: document.documentElement.lang, active: document.querySelector(".lang-btns .active").textContent };
    });
    report.ran("i18n/visible", texts.found.length);
    if (texts.html !== language || !texts.active.includes(names[language])) report.add("i18n/switch", `?lang=${language}`, `The page is marked as ${texts.html} / ${texts.active}.`);
    if (language !== "uk") for (const text of [texts.title, ...texts.found]) if (CYRILLIC.test(text)) report.add("i18n/visible", `?lang=${language}`, `Not translated: "${text.slice(0, 60)}"`, "Give the element a data-i18n key, or put the text into content.*");
    await finish(page, `language ${language}`, report);
  }
}

async function checkHeader(open, report) {
  const phone = await open("?lang=de", PHONE);
  const read = () => phone.run(() => {
    const bar = document.querySelector(".lang-btns");
    const box = bar.getBoundingClientRect();
    const header = getComputedStyle(document.querySelector(".site-header"));
    const alpha = /rgba\([^)]*,\s*([\d.]+)\)/.exec(header.backgroundColor);
    return { shown: getComputedStyle(bar).visibility === "visible", left: box.left, right: box.right, width: document.documentElement.clientWidth, height: document.querySelector(".site-header").offsetHeight, alpha: alpha ? Number(alpha[1]) : 1, blur: header.backdropFilter, label: document.querySelector(".lang-current").textContent.trim(), expanded: document.querySelector(".lang-current").getAttribute("aria-expanded") };
  });
  const closed = await read();
  report.ran("header/phone");
  if (closed.height > 52) report.add("header/phone", "phone", `The header is ${closed.height}px high; 52px is the limit on phones.`);
  if (closed.alpha > 0.75 || !/blur/.test(closed.blur)) report.add("header/phone", "phone", "The header is no longer half transparent.");
  if (closed.shown || closed.label !== "DE") report.add("header/language", "phone", `Closed, the language control must show only the globe and two letters (shows "${closed.label}"${closed.shown ? " and the flags" : ""}).`);
  await phone.run(() => { document.querySelector(".lang-current").click(); });
  await sleep(700);
  const opened = await read();
  if (!opened.shown || opened.expanded !== "true" || opened.left < 0 || opened.right > opened.width) report.add("header/language", "phone", "The language bar does not open inside the screen.");
  await phone.run(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
  await sleep(700);
  if ((await read()).shown) report.add("header/language", "phone", "Escape does not close the language bar.");
  await finish(phone, "header phone", report);

  const desktop = await open("?lang=en", DESKTOP);
  const buttons = () => desktop.run(() => [...document.querySelectorAll(".lang-btns button")].map(button => ({ width: button.offsetWidth, flag: getComputedStyle(button, "::before").opacity, text: button.textContent })));
  const rest = await buttons();
  report.ran("header/language");
  if (rest.filter(button => button.width > 0).length !== 1 || rest.some(button => Number(button.flag) > 0)) report.add("header/language", "desktop", "At rest the switcher must show one language and no flag.");
  const spot = await desktop.run(() => { const box = document.querySelector(".lang-btns").getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; });
  await desktop.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...spot });
  await sleep(900);
  const open_ = await buttons();
  if (open_.some(button => button.width < 60 || Number(button.flag) < 1)) report.add("header/language", "desktop", "On hover the switcher must show three languages with flags.");
  await finish(desktop, "header desktop", report);
}

async function checkLinks(open, report) {
  for (const view of [PHONE, DESKTOP]) {
    const page = await open("?lang=de", view);
    const targets = await page.run(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map(link => link.getAttribute("href")))]);
    for (const target of targets) {
      const landed = await page.run(async hash => {
        document.documentElement.style.scrollBehavior = "auto";
        document.querySelector(`a[href="${hash}"]`).click();
        await new Promise(done => { setTimeout(done, 80); });
        const element = document.querySelector(hash);
        if (!element) return null;
        const heading = element.querySelector("h1, h2") ?? element;
        return { top: heading.getBoundingClientRect().top, header: document.querySelector(".site-header").getBoundingClientRect().bottom, screen: innerHeight };
      }, target);
      report.ran("links/anchors");
      if (!landed) report.add("links/anchors", `${view.width}px`, `${target} leads nowhere.`);
      else if (landed.top < landed.header - 1 || landed.top > landed.screen - 60) report.add("links/anchors", `${view.width}px`, `${target}: its heading is not visible after the jump (top ${Math.round(landed.top)}px).`);
    }
    await finish(page, `links ${view.width}`, report);
  }
}

async function checkKeyboard(open, report) {
  const page = await open("?lang=en", DESKTOP);
  const visited = new Set();
  for (let i = 0; i < 60; i++) {
    for (const type of ["keyDown", "keyUp"]) await page.send("Input.dispatchKeyEvent", { type, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    const focus = await page.run(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
      const target = element.matches("input") ? element.parentElement.querySelector("span") ?? element : element;
      const css = getComputedStyle(target);
      const box = target.getBoundingClientRect();
      const name = element.id || `${element.tagName.toLowerCase()} "${(element.textContent || element.value || element.getAttribute("aria-label") || "").trim().slice(0, 30)}"`;
      return { name, ring: (css.outlineStyle !== "none" && parseFloat(css.outlineWidth) >= 2) || css.boxShadow !== "none", onScreen: box.bottom > 0 && box.top < innerHeight, width: box.width };
    });
    if (!focus) break;
    visited.add(focus.name);
    report.ran("keyboard/focus");
    if (!focus.ring) report.add("keyboard/focus", "1440px", `${focus.name} shows no focus ring.`);
    if (!focus.onScreen || !focus.width) report.add("keyboard/focus", "1440px", `${focus.name} receives the focus but is not visible.`);
  }
  if (visited.size < 15) report.add("keyboard/focus", "1440px", `Tab reached only ${visited.size} elements.`);
  await finish(page, "keyboard", report);
}

async function checkAccessibility(open, report) {
  const axe = readFileSync(join(ROOT, "node_modules", "axe-core", "axe.min.js"), "utf8");
  for (const view of [PHONE, DESKTOP]) {
    for (const language of LANGUAGES) {
      const page = await open(`?lang=${language}`, view);
      await page.run(() => { document.querySelectorAll("details").forEach(element => { element.open = true; }); });
      await page.evaluate(`${axe};0`);
      const violations = await page.evaluate(`axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"], resultTypes: ["violations"] }).then(result => ({ passes: result.passes.length, list: result.violations.map(item => ({ id: item.id, help: item.help, nodes: item.nodes.slice(0, 3).map(node => node.target.join(" ") + " " + (node.any[0]?.message ?? "")) })) }))`);
      report.ran("accessibility/axe", violations.passes);
      for (const item of violations.list) for (const node of item.nodes) report.add(`accessibility/${item.id}`, `${view.width}px ${language}`, `${item.help}: ${node.slice(0, 140)}`);
      await finish(page, `accessibility ${view.width}-${language}`, report);
    }
  }
}

async function checkFacts(open, report) {
  for (const view of [PHONE, { width: 1024, height: 768 }, DESKTOP]) {
    const page = await open("?lang=de", view);
    const total = await page.evaluate("document.querySelectorAll('[data-fact]').length");
    for (let i = 0; i < total; i++) {
      const tip = await page.run(async index => {
        const tile = document.querySelectorAll("[data-fact]")[index];
        if (!tile.checkVisibility()) return null;
        tile.scrollIntoView({ block: "center", behavior: "instant" });
        tile.focus({ preventScroll: true });
        await new Promise(done => { requestAnimationFrame(() => requestAnimationFrame(done)); });
        const card = document.querySelector("#fact-tip");
        if (card.hidden) return { missing: true, name: tile.dataset.fact };
        const box = card.getBoundingClientRect();
        const target = tile.getBoundingClientRect();
        return { name: tile.dataset.fact, left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: document.documentElement.clientWidth, height: innerHeight, covers: box.top < target.bottom - 1 && box.bottom > target.top + 1, text: card.textContent.trim().length, header: document.querySelector(".site-header").offsetHeight };
      }, i);
      if (!tip) continue;
      report.ran("facts/card");
      if (tip.missing || tip.text < 20) report.add("facts/card", `${view.width}px`, `The logo "${tip.name}" shows no fact.`);
      else if (tip.left < 0 || tip.right > tip.width || tip.top < tip.header - 1 || tip.bottom > tip.height) report.add("facts/card", `${view.width}px`, `The fact card of "${tip.name}" leaves the screen.`);
      else if (tip.covers) report.add("facts/card", `${view.width}px`, `The fact card of "${tip.name}" covers its own logo.`);
    }
    await finish(page, `facts ${view.width}`, report);
  }
}

// Every page must stay free of errors and must not contact other servers.
export async function finish(page, where, report) {
  report.ran("page/errors");
  for (const message of page.messages) report.add("page/errors", where, message.slice(0, 200));
  for (const url of page.loads) if (!url.startsWith(page.base) && !url.startsWith("data:")) report.add("security/external", where, `The page contacts ${url.slice(0, 80)}.`);
  await page.close();
}

export const BEHAVIOUR = { demo: checkDemo, scene: checkScene, fallbacks: checkFallbacks, languages: checkLanguages, header: checkHeader, links: checkLinks, keyboard: checkKeyboard, accessibility: checkAccessibility, facts: checkFacts };
