"use strict";

// Texts come from i18n.js (window.SIG_I18N) in the current language.
const i18n = window.SIG_I18N;
const copy = () => i18n.content;
const renderers = [];

const trendValues = {
  "12": [2.9, 2.9, 2.7, 2.4, 1.9, 1.4],
  "18": [2.8, 2.7, 2.8, 2.3, 1.9, 1.6],
  "24": [2.9, 2.8, null, null, 2.2, null]
};
const pressureChart = document.querySelector("#pressure-chart");
const pressureAxis = { min: 1, max: 3.5, ticks: [1, 1.5, 2, 2.5, 3, 3.5] };

function drawChart(canvas, values, axis) {
  if (!canvas.clientWidth) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  const margin = { left: 35, right: 29, top: 13, bottom: 27 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = i => margin.left + plotWidth * i / (values.length - 1);
  const y = value => margin.top + plotHeight * (axis.max - value) / (axis.max - axis.min);
  const step = plotWidth / (values.length - 1);
  ctx.font = "12px Roboto, Arial, sans-serif";
  ctx.textBaseline = "middle";

  values.forEach((value, i) => {
    if (value !== null) return;
    const left = Math.max(x(i) - step / 2, margin.left);
    const right = Math.min(x(i) + step / 2, width - margin.right);
    ctx.fillStyle = "#fff0d2";
    ctx.fillRect(left, margin.top, right - left, plotHeight);
  });

  ctx.textAlign = "right";
  axis.ticks.forEach(tick => {
    ctx.strokeStyle = "#dce5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, y(tick));
    ctx.lineTo(width - margin.right, y(tick));
    ctx.stroke();
    ctx.fillStyle = "#52655a";
    ctx.fillText(tick.toLocaleString(i18n.numberLocale), margin.left - 7, y(tick));
  });
  ctx.textAlign = "center";
  axis.labels.forEach((label, i) => ctx.fillText(label, x(i), height - 13));

  ctx.strokeStyle = "#26703a";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let continuing = false;
  values.forEach((value, i) => {
    if (value === null) {
      continuing = false;
      return;
    }
    if (continuing) ctx.lineTo(x(i), y(value));
    else ctx.moveTo(x(i), y(value));
    continuing = true;
  });
  ctx.stroke();
  ctx.fillStyle = "#26703a";
  values.forEach((value, i) => {
    if (value === null) return;
    ctx.beginPath();
    ctx.arc(x(i), y(value), 3.4, 0, 2 * Math.PI);
    ctx.fill();
  });
}

function updatePressure() {
  const { value } = document.querySelector('input[name="trend"]:checked');
  document.querySelector("#trend-note").textContent = copy().trends[value];
  drawChart(pressureChart, trendValues[value], { ...pressureAxis, labels: copy().axisLabels });
}

// The note always follows the language; drawChart itself skips the hidden canvas.
function updateCharts() {
  updatePressure();
}

const tabList = document.querySelector("[data-tabs]");
const tabs = [...tabList.querySelectorAll('[role="tab"]')];
function selectTab(selected) {
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute("aria-selected", active);
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  });
  updateCharts();
}
tabs.forEach(tab => tab.addEventListener("click", () => selectTab(tab)));
tabList.addEventListener("keydown", event => {
  const index = tabs.indexOf(event.target);
  if (index === -1) return;
  let nextIndex;
  switch (event.key) {
    case "ArrowRight": nextIndex = (index + 1) % tabs.length; break;
    case "ArrowLeft": nextIndex = (index - 1 + tabs.length) % tabs.length; break;
    case "Home": nextIndex = 0; break;
    case "End": nextIndex = tabs.length - 1; break;
    default: return;
  }
  event.preventDefault();
  const selected = tabs[nextIndex];
  selectTab(selected);
  selected.focus();
});

// Buttons that show one entry of copy()[group]; the pressed button decides which.
function bindButtons(attribute, group, selectors) {
  const buttons = [...document.querySelectorAll(`[data-${attribute}]`)];
  const outputs = selectors.map(selector => document.querySelector(selector));
  const render = () => {
    const pressed = buttons.find(button => button.getAttribute("aria-pressed") === "true") || buttons[0];
    copy()[group][pressed.dataset[attribute]].forEach((value, index) => {
      outputs[index].textContent = value;
    });
  };
  buttons.forEach(button => button.addEventListener("click", () => {
    buttons.forEach(item => item.setAttribute("aria-pressed", item === button));
    render();
  }));
  renderers.push(render);
  render();
}

// Radio groups that show one entry of copy()[group]; the checked radio decides which.
function bindChoice(fieldset, group, selectors) {
  const field = document.querySelector(fieldset);
  const outputs = selectors.map(selector => document.querySelector(selector));
  const render = () => {
    copy()[group][field.querySelector("input:checked").value].forEach((value, index) => {
      outputs[index].textContent = value;
    });
  };
  field.addEventListener("change", render);
  renderers.push(render);
  render();
}

bindButtons("event", "events", ["#event-title", "#event-description"]);
bindButtons("source", "sources", ["#source-title", "#source-text", "#source-example"]);
bindChoice("#report-choice", "reports", ["#report-title", "#report-text"]);
bindChoice("#resource-choice", "resources", ["#resource-before", "#resource-after", "#resource-per-unit", "#resource-question", "#resource-finding", "#resource-check"]);
bindChoice("#deployment-choice", "deployments", ["#deploy-model", "#deploy-data", "#deploy-terms"]);

document.querySelector("#trend-choice").addEventListener("change", updatePressure);
updatePressure();
window.addEventListener("resize", updateCharts);
document.fonts.ready.then(updateCharts);

// ---------------------------------------------------------------------------
// Chat walkthrough: the engineer types the question, the assistant "thinks"
// (a simulated, fast-forwarded timer while it reads the sources) and then
// streams its answer word by word. One clock drives everything, so pausing,
// scrolling away, switching case or language never leaves a half-drawn state.
// ---------------------------------------------------------------------------
const walkthrough = document.querySelector("#walkthrough");
const conversation = document.querySelector("#walkthrough-conversation");
const walkthroughToggle = document.querySelector("#walkthrough-toggle");
const walkthroughPhase = document.querySelector("#walkthrough-phase");
const walkthroughProgress = document.querySelector("#walkthrough-progress");
const walkthroughSelect = document.querySelector("#walkthrough-case");
const walkthroughTranscript = document.querySelector("#walkthrough-transcript");
const questionText = document.querySelector("#walkthrough-question");
const answerBubble = walkthrough.querySelector(".conversation-answer");
const thinking = document.querySelector("#walkthrough-thinking");
const thinkingLabel = document.querySelector("#walkthrough-thinking-label");
const answerParts = ["#walkthrough-answer-title", "#walkthrough-answer", "#walkthrough-limit"].map(selector => document.querySelector(selector));
const sourceSteps = walkthrough.querySelectorAll(".walkthrough-sources [data-show-step]");
const sourceItems = walkthrough.querySelectorAll("[data-source-step]");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const walkthroughCase = () => copy().walkthrough.cases[walkthroughSelect.value];

// Pacing in milliseconds. The thinking timer shows simulated seconds, fast-forwarded.
const PACE = { start: 350, key: 38, punctuation: 170, send: 550, source: 1350, compare: 1000, word: 80, part: 200, readBase: 3500, readPerWord: 200, fade: 700 };
const THINKING_SECONDS = { resources: 14, incident: 11 };

const typedText = document.createElement("span");
const caret = document.createElement("span");
caret.className = "chat-caret";
caret.setAttribute("aria-hidden", "true");
conversation.setAttribute("aria-hidden", "true"); // Screen readers get the static transcript instead.

let timeline;
let wordSpans = [];
let elapsed = 0;
let walkthroughPlaying = !motionPreference.matches;
let walkthroughOnscreen = false;
let frame = 0;
let lastTick = 0;
let shown = {};

function buildTimeline() {
  const current = walkthroughCase();
  const characters = [...current.question];
  const charTimes = [];
  let time = PACE.start;
  characters.forEach(character => {
    charTimes.push(time);
    // Small, repeatable variation makes the typing feel human.
    time += PACE.key + (character.codePointAt(0) * 7) % 17 + (/[,.?!:;]/.test(character) ? PACE.punctuation : 0);
  });
  const typeEnd = time;
  const thinkStart = typeEnd + PACE.send;
  const sourceStarts = [0, 1, 2].map(index => thinkStart + index * PACE.source);
  const compareStart = thinkStart + 3 * PACE.source;
  const thinkEnd = compareStart + PACE.compare;
  const words = [];
  let at = thinkEnd + 250;
  [current.answerTitle, current.answer, current.limit].forEach((part, partIndex) => {
    part.split(/\s+/).filter(Boolean).forEach(text => {
      words.push({ part: partIndex, text, at });
      at += PACE.word;
    });
    at += PACE.part;
  });
  const streamEnd = at;
  const holdEnd = streamEnd + PACE.readBase + words.length * PACE.readPerWord;
  return {
    current, characters, charTimes, typeEnd, thinkStart, sourceStarts, compareStart, thinkEnd,
    words, streamEnd, holdEnd, end: holdEnd + PACE.fade,
    seconds: THINKING_SECONDS[walkthroughSelect.value] ?? 12
  };
}

const countUntil = (times, t) => {
  let count = 0;
  while (count < times.length && times[count] <= t) count++;
  return count;
};

function stageAt(t) {
  if (t < timeline.thinkStart) return 0;
  if (t < timeline.sourceStarts[1]) return 1;
  if (t < timeline.sourceStarts[2]) return 2;
  if (t < timeline.compareStart) return 3;
  if (t < timeline.thinkEnd) return 4;
  return 5;
}

function renderWalkthrough(force = false) {
  if (force) shown = {};
  const t = elapsed;
  const text = copy().walkthrough;

  const characters = countUntil(timeline.charTimes, t);
  if (characters !== shown.characters) {
    typedText.textContent = timeline.characters.slice(0, characters).join("");
    shown.characters = characters;
  }
  const typing = t < timeline.typeEnd + 300;
  if (typing !== shown.typing) {
    caret.hidden = !typing;
    shown.typing = typing;
  }

  const stage = stageAt(t);
  if (stage !== shown.stage) {
    sourceSteps.forEach(element => { element.dataset.visible = stage >= Number(element.dataset.showStep); });
    sourceItems.forEach(element => { element.dataset.reading = stage === Number(element.dataset.sourceStep); });
    walkthroughPhase.textContent = text.steps[stage] ?? timeline.current.sources[stage - 1][2];
    walkthroughProgress.value = stage;
    answerBubble.dataset.visible = stage >= 1;
    thinking.hidden = stage < 1;
    shown.stage = stage;
  }

  if (stage >= 1) {
    const done = t >= timeline.thinkEnd;
    const fraction = Math.min(1, (t - timeline.thinkStart) / (timeline.thinkEnd - timeline.thinkStart));
    const seconds = done ? timeline.seconds : Math.max(1, Math.round(timeline.seconds * fraction));
    const label = (done ? text.thought : text.thinking).replace("{s}", seconds);
    if (label !== shown.label) {
      thinkingLabel.textContent = label;
      thinking.dataset.done = done;
      shown.label = label;
    }
  }

  const words = countUntil(timeline.words.map(word => word.at), t);
  if (words !== shown.words) {
    wordSpans.forEach((span, index) => { span.hidden = index >= words; });
    shown.words = words;
  }

  const fading = t >= timeline.holdEnd;
  if (fading !== shown.fading) {
    conversation.dataset.fading = fading;
    shown.fading = fading;
  }
  walkthroughToggle.textContent = walkthroughPlaying ? text.pause : text.play;
}

// Keeps the box at its final height so the page does not move while the answer streams in.
function reserveConversationHeight() {
  const saved = elapsed;
  conversation.style.minHeight = "";
  elapsed = timeline.streamEnd;
  renderWalkthrough(true);
  conversation.style.minHeight = `${conversation.offsetHeight}px`;
  elapsed = saved;
  renderWalkthrough(true);
}

function rebuildWalkthrough({ restart }) {
  timeline = buildTimeline();
  questionText.replaceChildren(typedText, caret);
  answerParts.forEach(part => part.replaceChildren());
  wordSpans = timeline.words.map(word => {
    const span = document.createElement("span");
    span.className = "stream-word";
    span.textContent = `${word.text} `;
    answerParts[word.part].append(span);
    return span;
  });
  sourceItems.forEach((source, index) => {
    const [title, description] = timeline.current.sources[index];
    source.querySelector("strong").textContent = title;
    source.querySelector("p").textContent = description;
  });
  const { question, answerTitle, answer, limit } = timeline.current;
  walkthroughTranscript.textContent = `${i18n.text("roleEngineer")}: ${question} ${i18n.text("assistantName")}: ${answerTitle} ${answer} ${limit}`;
  if (restart) elapsed = 0;
  else elapsed = Math.min(elapsed, timeline.streamEnd);
  reserveConversationHeight();
  scheduleWalkthrough();
}

const walkthroughActive = () => walkthroughPlaying && walkthroughOnscreen && !document.hidden;

// A ~30 fps timer rather than requestAnimationFrame: some embedded or occluded views pause
// animation frames while still reporting the page as visible. Rendering only touches what changed.
const TICK = 33;
function tick() {
  frame = 0;
  if (!walkthroughActive()) return;
  const now = performance.now();
  if (lastTick) elapsed += Math.min(now - lastTick, 100);
  lastTick = now;
  if (elapsed >= timeline.end) elapsed = 0;
  renderWalkthrough();
  frame = window.setTimeout(tick, TICK);
}

function scheduleWalkthrough() {
  if (walkthroughActive()) {
    if (!frame) {
      lastTick = 0;
      frame = window.setTimeout(tick, TICK);
    }
  } else if (frame) {
    window.clearTimeout(frame);
    frame = 0;
  }
  renderWalkthrough();
}

walkthroughSelect.addEventListener("change", () => rebuildWalkthrough({ restart: walkthroughPlaying }));
walkthroughToggle.addEventListener("click", () => {
  walkthroughPlaying = !walkthroughPlaying;
  if (walkthroughPlaying && elapsed >= timeline.holdEnd) elapsed = 0;
  scheduleWalkthrough();
});
document.querySelector("#walkthrough-replay").addEventListener("click", () => {
  elapsed = 0;
  walkthroughPlaying = true;
  scheduleWalkthrough();
});
document.addEventListener("visibilitychange", scheduleWalkthrough);
motionPreference.addEventListener("change", event => {
  if (!event.matches) return;
  walkthroughPlaying = false;
  elapsed = timeline.streamEnd;
  scheduleWalkthrough();
});
let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(reserveConversationHeight, 150);
});

// A language change re-renders everything that demo.js wrote, keeping the current selections.
document.addEventListener("sig:languagechange", () => {
  renderers.forEach(render => render());
  rebuildWalkthrough({ restart: walkthroughPlaying });
  updateCharts();
});

document.querySelector("#walkthrough-actions").hidden = false;
document.querySelector("#walkthrough-selector").hidden = false;
document.querySelector("#walkthrough-status").hidden = false;
if (motionPreference.matches) elapsed = Number.MAX_SAFE_INTEGER; // Reduced motion: show the finished dialog.
rebuildWalkthrough({ restart: !motionPreference.matches });
const walkthroughObserver = new IntersectionObserver(([entry]) => {
  walkthroughOnscreen = entry.intersectionRatio >= 0.2;
  scheduleWalkthrough();
}, { threshold: 0.2 });
walkthroughObserver.observe(walkthrough);

// ---------------------------------------------------------------------------
// Logo facts: a small card with a fact about the product appears on mouse
// hover, keyboard focus or a tap. Arrow keys move between logos in a group,
// so each group is a single stop in the Tab order.
// ---------------------------------------------------------------------------
const factTiles = [...document.querySelectorAll(".logo-grid [data-fact]")];
const factTip = document.createElement("div");
factTip.className = "fact-tip";
factTip.id = "fact-tip";
factTip.setAttribute("role", "tooltip");
factTip.hidden = true;
const factTitle = document.createElement("strong");
const factText = document.createElement("p");
factTip.append(factTitle, factText);
document.body.append(factTip);
let factTile = null;

function positionFact() {
  if (!factTile) return;
  const tile = factTile.getBoundingClientRect();
  const width = factTip.offsetWidth;
  const height = factTip.offsetHeight;
  const margin = 12;
  const left = Math.max(margin, Math.min(tile.left + tile.width / 2 - width / 2, window.innerWidth - width - margin));
  const header = document.querySelector(".site-header").getBoundingClientRect().bottom;
  const above = tile.top - height - 12 >= header + 8;
  factTip.dataset.placement = above ? "top" : "bottom";
  factTip.style.left = `${Math.round(left)}px`;
  factTip.style.top = `${Math.round(above ? tile.top - height - 12 : tile.bottom + 12)}px`;
  factTip.style.setProperty("--arrow-x", `${Math.round(tile.left + tile.width / 2 - left)}px`);
}

function showFact(tile) {
  const text = copy().facts[tile.dataset.fact];
  if (!text) return;
  if (factTile && factTile !== tile) factTile.removeAttribute("aria-describedby");
  factTile = tile;
  factTitle.textContent = (tile.querySelector(".logo-word, .logo-name") || tile).textContent.trim();
  factText.textContent = text;
  factTip.hidden = false;
  tile.setAttribute("aria-describedby", factTip.id);
  positionFact();
}

function hideFact() {
  if (!factTile) return;
  factTile.removeAttribute("aria-describedby");
  factTile = null;
  factTip.hidden = true;
}

factTiles.forEach(tile => {
  tile.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") showFact(tile); });
  tile.addEventListener("pointerleave", event => { if (event.pointerType === "mouse" && factTile === tile) hideFact(); });
  tile.addEventListener("pointerup", event => {
    if (event.pointerType === "mouse") return;
    if (factTile === tile) hideFact();
    else showFact(tile);
  });
  tile.addEventListener("focus", () => { if (tile.matches(":focus-visible")) showFact(tile); });
  tile.addEventListener("blur", () => { if (factTile === tile) hideFact(); });
});

document.querySelectorAll(".logo-grid").forEach(grid => {
  const items = [...grid.querySelectorAll("[data-fact]")];
  items.forEach((item, index) => { item.tabIndex = index === 0 ? 0 : -1; });
  grid.addEventListener("keydown", event => {
    const index = items.indexOf(document.activeElement);
    if (index === -1) return;
    let next;
    switch (event.key) {
      case "ArrowRight": case "ArrowDown": next = (index + 1) % items.length; break;
      case "ArrowLeft": case "ArrowUp": next = (index - 1 + items.length) % items.length; break;
      case "Home": next = 0; break;
      case "End": next = items.length - 1; break;
      default: return;
    }
    event.preventDefault();
    items[index].tabIndex = -1;
    items[next].tabIndex = 0;
    items[next].focus();
  });
});

document.addEventListener("keydown", event => { if (event.key === "Escape") hideFact(); });
document.addEventListener("pointerdown", event => { if (factTile && !event.target.closest("[data-fact]")) hideFact(); });
window.addEventListener("scroll", positionFact, { passive: true });
window.addEventListener("resize", positionFact);
document.addEventListener("sig:languagechange", () => { if (factTile) showFact(factTile); });
