// Drives an installed Chromium or Chrome over the DevTools protocol. No packages needed.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";

export const sleep = ms => new Promise(done => { setTimeout(done, ms); });

// The bare program first: distribution wrappers may load extensions.
const CANDIDATES = [process.env.CHROME_PATH, "/usr/lib/chromium/chromium", "/opt/google/chrome/chrome", "/usr/bin/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];

export class Browser {
  // Now and then a browser hangs while it starts on a busy computer: try again with a fresh one.
  static async launch() {
    for (let attempt = 1; ; attempt++) {
      const browser = await Browser.start();
      const answered = await Promise.race([browser.send("Browser.getVersion").then(() => true), sleep(10000).then(() => false)]);
      if (answered) return browser;
      await browser.close();
      if (attempt === 3) throw new Error("The browser starts but does not answer.");
    }
  }

  static async start() {
    const path = CANDIDATES.find(candidate => candidate && existsSync(candidate));
    if (!path) throw new Error("No Chromium or Chrome found. Install one, or set CHROME_PATH.");
    const profile = mkdtempSync(join(tmpdir(), "site-check-"));
    // Headless browsers report no mouse; the blink settings give desktop pages one (hover: hover, pointer: fine).
    const args = [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
      "--disable-extensions", "--disable-component-update", "--disable-background-networking", "--disable-sync", "--disable-lcd-text", "--font-render-hinting=none",
      "--force-color-profile=srgb", "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4", "--remote-debugging-port=0", `--user-data-dir=${profile}`
    ];
    if (process.env.GITHUB_ACTIONS) args.push("--no-sandbox"); // Throw-away runner that opens only this site.
    const process_ = spawn(path, [...args, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
    process.once("exit", () => process_.kill("SIGKILL")); // Never leave a browser behind.
    for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => process.exit(1));
    const address = await new Promise((done, fail) => {
      let output = "";
      const timer = setTimeout(() => fail(new Error(`The browser did not start: ${output.slice(-300)}`)), 20000);
      process_.stderr.on("data", data => {
        output += data;
        const found = /DevTools listening on (ws:\S+)/.exec(output);
        if (found) { clearTimeout(timer); done(found[1]); }
      });
    });
    const browser = new Browser();
    Object.assign(browser, { process: process_, profile, pending: new Map(), listeners: new Map(), lastId: 0 });
    browser.socket = new WebSocket(address);
    await new Promise((done, fail) => { browser.socket.onopen = done; browser.socket.onerror = fail; });
    browser.socket.onmessage = event => browser.receive(JSON.parse(event.data));
    return browser;
  }

  receive(message) {
    const waiting = this.pending.get(message.id);
    if (waiting) {
      this.pending.delete(message.id);
      if (message.error) waiting.fail(new Error(message.error.message));
      else waiting.done(message.result);
    } else this.listeners.get(message.sessionId)?.(message);
  }

  // No answer within half a minute is an error, so a check can fail but never hang.
  send(method, params = {}, sessionId = undefined) {
    const id = ++this.lastId;
    return new Promise((done, fail) => {
      const timer = setTimeout(() => { this.pending.delete(id); fail(new Error(`No answer: ${method} ${JSON.stringify(params).slice(0, 160)}`)); }, 30000);
      this.pending.set(id, { done: result => { clearTimeout(timer); done(result); }, fail: error => { clearTimeout(timer); fail(error); } });
      this.socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  // options: width, height, mobile (touch + phone), motion (default: reduced), scale, script (runs before the page's own)
  async open(url, options = {}) {
    const { browserContextId } = await this.send("Target.createBrowserContext");
    const { targetId } = await this.send("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await this.send("Target.attachToTarget", { targetId, flatten: true });
    const page = new Page(this, { browserContextId, targetId, sessionId, options });
    await page.prepare();
    if (url) await page.goto(url);
    return page;
  }

  async close() {
    const gone = new Promise(done => { this.process.once("exit", done); });
    this.send("Browser.close").catch(() => undefined);
    await Promise.race([gone, sleep(4000)]);
    this.socket.close();
    this.process.kill("SIGKILL");
    rmSync(this.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

class Page {
  constructor(browser, details) { Object.assign(this, details, { browser, messages: [], loads: [] }); }

  send(method, params) { return this.browser.send(method, params, this.sessionId); }

  async prepare() {
    const { width, height, mobile = false, motion = false, scale = 1, script } = this.options;
    this.browser.listeners.set(this.sessionId, message => this.receive(message));
    for (const domain of ["Page", "Runtime", "Log", "Network"]) await this.send(`${domain}.enable`);
    await this.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile });
    await this.send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
    await this.send("Emulation.setFocusEmulationEnabled", { enabled: true });
    await this.send("Emulation.setEmulatedMedia", { features: [
      { name: "prefers-reduced-motion", value: motion ? "no-preference" : "reduce" },
      ...(mobile ? [["hover", "none"], ["any-hover", "none"], ["pointer", "coarse"], ["any-pointer", "coarse"]] : []).map(([name, value]) => ({ name, value }))
    ] });
    if (script) await this.send("Page.addScriptToEvaluateOnNewDocument", { source: script });
  }

  receive({ method, params }) {
    if (method === "Log.entryAdded" && ["error", "warning"].includes(params.entry.level)) this.messages.push(`${params.entry.text} ${params.entry.url ?? ""}`.trim());
    if (method === "Runtime.exceptionThrown") this.messages.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
    if (method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(params.type)) this.messages.push(params.args.map(arg => arg.value ?? arg.description).join(" "));
    if (method === "Network.requestWillBeSent") this.loads.push(params.request.url);
    if (method === "Page.loadEventFired") this.loaded?.();
  }

  async goto(url) {
    const loaded = new Promise(done => { this.loaded = done; });
    await this.send("Page.navigate", { url });
    await Promise.race([loaded, sleep(15000).then(() => { throw new Error(`Timeout: ${url}`); })]);
    await this.evaluate("document.fonts.ready.then(() => true)");
    await sleep(60);
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  }

  // Runs a function in the page: page.run((a, b) => document.title, 1, 2)
  run(callback, ...args) { return this.evaluate(`(${callback})(...${JSON.stringify(args)})`); }

  async screenshot(clip) {
    const { data } = await this.send("Page.captureScreenshot", clip ? { format: "png", clip: { scale: 1, ...clip } } : { format: "png" });
    return Buffer.from(data, "base64");
  }

  async close() {
    this.browser.listeners.delete(this.sessionId);
    await this.browser.send("Target.disposeBrowserContext", { browserContextId: this.browserContextId }).catch(() => undefined);
  }
}

// Decodes an 8-bit RGB or RGBA PNG (what captureScreenshot returns) into { width, height, at(x, y) → [r, g, b] }.
export function decodePng(buffer) {
  let position = 8;
  const data = [];
  const header = {};
  while (position < buffer.length) {
    const length = buffer.readUInt32BE(position);
    const type = buffer.toString("latin1", position + 4, position + 8);
    const body = buffer.subarray(position + 8, position + 8 + length);
    if (type === "IHDR") Object.assign(header, { width: body.readUInt32BE(0), height: body.readUInt32BE(4), channels: body[9] === 6 ? 4 : 3 });
    if (type === "IDAT") data.push(body);
    position += 12 + length;
  }
  const { width, height, channels } = header;
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
    if (pa <= pb && pa <= pc) return a;
    return pb <= pc ? b : c;
  };
  const predictors = [() => 0, a => a, (a, b) => b, (a, b) => (a + b) >> 1, paeth];
  for (let y = 0; y < height; y++) {
    const predict = predictors[raw[y * (stride + 1)]];
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? pixels[y * stride + i - channels] : 0;
      const up = y ? pixels[(y - 1) * stride + i] : 0;
      const corner = y && i >= channels ? pixels[(y - 1) * stride + i - channels] : 0;
      pixels[y * stride + i] = raw[y * (stride + 1) + 1 + i] + predict(left, up, corner);
    }
  }
  return { width, height, at: (x, y) => [...pixels.subarray((y * width + x) * channels, (y * width + x) * channels + 3)] };
}
