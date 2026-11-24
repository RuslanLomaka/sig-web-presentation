"use strict";

// Everything stays inside this function, so nothing leaks into the global scope.
(() => {

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

  // Gaps in the archive: a shaded band, labelled once per run of missing points.
  const bandLeft = i => Math.max(x(i) - step / 2, margin.left);
  const bandRight = i => Math.min(x(i) + step / 2, width - margin.right);
  values.forEach((value, i) => {
    if (value !== null) return;
    ctx.fillStyle = "#fff0d2";
    ctx.fillRect(bandLeft(i), margin.top, bandRight(i) - bandLeft(i), plotHeight);
  });
  if (axis.noData) {
    ctx.font = "10px Roboto, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a5d0c";
    values.forEach((value, i) => {
      if (value !== null || (i > 0 && values[i - 1] === null)) return;
      let end = i;
      while (end + 1 < values.length && values[end + 1] === null) end++;
      const left = bandLeft(i);
      const right = bandRight(end);
      if (right - left >= ctx.measureText(axis.noData).width + 6) ctx.fillText(axis.noData, (left + right) / 2, margin.top + 10);
    });
    ctx.font = "12px Roboto, Arial, sans-serif";
  }

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
  const note = document.querySelector("#trend-note");
  const text = copy().trends[value];
  if (note.textContent !== text) note.textContent = text; // A live region: only announce real changes.
  drawChart(pressureChart, trendValues[value], { ...pressureAxis, labels: copy().axisLabels, noData: copy().noData });
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
  selected.scrollIntoView({ block: "nearest", inline: "nearest" }); // The tab row scrolls sideways on phones.
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
const walkthroughBody = walkthrough.querySelector(".walkthrough-body");
const walkthroughRole = document.querySelector("#walkthrough-role");
const scenarioButtons = [...walkthrough.querySelectorAll(".scenario-train [data-case]")];
const scenarioThumb = walkthrough.querySelector(".scenario-thumb");
const walkthroughTranscript = document.querySelector("#walkthrough-transcript");
const questionText = document.querySelector("#walkthrough-question");
const answerBubble = walkthrough.querySelector(".conversation-answer");
const thinking = document.querySelector("#walkthrough-thinking");
const thinkingLabel = document.querySelector("#walkthrough-thinking-label");
const answerParts = ["#walkthrough-answer-title", "#walkthrough-answer", "#walkthrough-limit"].map(selector => document.querySelector(selector));
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let caseIndex = 0; // The scenarios play one after another in the order of the buttons.
const caseName = () => scenarioButtons[caseIndex].dataset.case;
const walkthroughCase = () => copy().walkthrough.cases[caseName()];

// Pacing in milliseconds. The thinking timer shows simulated seconds, fast-forwarded.
const PACE = { start: 350, key: 38, punctuation: 170, send: 550, decide: 1300, source: 1350, compare: 1000, word: 80, part: 200, readBase: 3500, readPerWord: 200, fade: 700 };
const CHECKS_LEAVE = 240; // The checks fade out just before the answer starts.
const THINKING_SECONDS = { resources: 14, incident: 11, maintenance: 9, stock: 12 };

const typedText = document.createElement("span");
const ghostText = document.createElement("span"); // The untyped rest keeps the bubble at its final width.
ghostText.className = "chat-ghost";
const caret = document.createElement("span");
caret.className = "chat-caret";
caret.setAttribute("aria-hidden", "true");
// What the assistant checks is its own decision, so nothing of it shows before the question is sent: the
// rows appear one by one inside the reply while it thinks,
const checksList = document.querySelector("#walkthrough-checks");
const checkRows = [...checksList.querySelectorAll("li")]; // The decision, then one row per record.
const checks = [...checksList.querySelectorAll("[data-check]")];
const decidingLabel = document.querySelector("#walkthrough-deciding");
const checkedBox = document.querySelector("#walkthrough-checked"); // and what was checked, to open after the answer.
const checkedItems = [...checkedBox.querySelectorAll("li")];
// Screen readers get the static transcript instead of the animation; only the disclosure stays reachable.
[conversation.querySelector(".conversation-question"), ...answerBubble.children].forEach(element => {
  if (element !== checkedBox) element.setAttribute("aria-hidden", "true");
});

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
  const sourceStarts = [0, 1, 2].map(index => thinkStart + PACE.decide + index * PACE.source);
  const compareStart = sourceStarts[2] + PACE.source;
  const thinkEnd = compareStart + PACE.compare;
  const words = [];
  let at = thinkEnd + 250;
  [current.answerTitle, current.answer, current.limit].forEach((part, partIndex) => {
    part.split(/[ \n]+/).filter(Boolean).forEach(text => {
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
    seconds: THINKING_SECONDS[caseName()] ?? 12
  };
}

const countUntil = (times, t) => {
  let count = 0;
  while (count < times.length && times[count] <= t) count++;
  return count;
};

function stageAt(t) {
  if (t < timeline.thinkStart) return 0;
  if (t < timeline.sourceStarts[0]) return 1;
  if (t < timeline.sourceStarts[1]) return 2;
  if (t < timeline.sourceStarts[2]) return 3;
  if (t < timeline.compareStart) return 4;
  if (t < timeline.thinkEnd) return 5;
  return 6;
}

function renderWalkthrough(force = false) {
  if (force) shown = {};
  const t = elapsed;
  const text = copy().walkthrough;

  const characters = countUntil(timeline.charTimes, t);
  if (characters !== shown.characters) {
    typedText.textContent = timeline.characters.slice(0, characters).join("");
    ghostText.textContent = timeline.characters.slice(characters).join("");
    shown.characters = characters;
  }
  const typing = t < timeline.typeEnd + 300;
  if (typing !== shown.typing) {
    caret.hidden = !typing;
    shown.typing = typing;
  }

  const stage = stageAt(t);
  if (stage !== shown.stage) {
    walkthroughPhase.textContent = text.steps[stage] ?? timeline.current.sources[stage - 2][2];
    walkthroughProgress.value = stage;
    answerBubble.dataset.visible = stage >= 1;
    thinking.hidden = stage < 1;
    checkRows.forEach((row, index) => { row.dataset.state = stage > index + 1 ? "done" : stage === index + 1 ? "reading" : "wait"; });
    checksList.dataset.leaving = stage === 6;
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

  const citing = t >= timeline.streamEnd;
  if (citing !== shown.citing) {
    checkedBox.hidden = !citing;
    shown.citing = citing;
  }
  const checking = stage >= 1 && t < timeline.thinkEnd + CHECKS_LEAVE;
  if (checking !== shown.checking) {
    checksList.hidden = !checking;
    shown.checking = checking;
  }

  const fading = t >= timeline.holdEnd;
  if (fading !== shown.fading) {
    walkthroughBody.dataset.fading = fading;
    shown.fading = fading;
  }

  // The train fills up while its scenario plays (in half-percent steps).
  const finished = motionPreference.matches && !walkthroughPlaying;
  const progress = finished ? 100 : Math.round(Math.min(1, t / timeline.holdEnd) * 200) / 2;
  if (progress !== shown.progress) {
    scenarioThumb.style.setProperty("--progress", `${progress}%`);
    shown.progress = progress;
  }
  walkthroughToggle.textContent = walkthroughPlaying ? text.pause : text.play;
}

// Writes the texts of the current scenario into the widget.
function fillCase() {
  timeline = buildTimeline();
  const { role, question, answerTitle, answer, limit, sources } = timeline.current;
  walkthroughRole.textContent = role;
  questionText.replaceChildren(typedText, caret, ghostText);
  decidingLabel.textContent = copy().walkthrough.deciding;
  answerParts.forEach(part => part.replaceChildren());
  wordSpans = timeline.words.map(word => {
    const span = document.createElement("span");
    span.className = "stream-word";
    span.textContent = `${word.text} `;
    answerParts[word.part].append(span);
    return span;
  });
  sources.forEach(([title, description], index) => {
    checks[index].querySelector("strong").textContent = title;
    checks[index].querySelector("em").textContent = description;
    checkedItems[index].querySelector("strong").textContent = title;
    checkedItems[index].querySelector("span").textContent = description;
  });
  const sourceList = sources.map(([title, description], index) => `${index + 1}. ${title}: ${description}`).join(" ");
  walkthroughTranscript.textContent = `${role}: ${question} ${i18n.text("assistantName")}: ${answerTitle} ${answer} ${limit} ${copy().walkthrough.cites}: ${sourceList}`;
}

// Reserves the height of the tallest scenario, so the page moves neither while an answer
// streams in nor when the next scenario starts.
function reserveHeights() {
  const saved = { caseIndex, elapsed };
  closeChecked();
  conversation.style.minHeight = "";
  let conversationHeight = 0;
  scenarioButtons.forEach((button, index) => {
    caseIndex = index;
    fillCase();
    [timeline.thinkEnd - 1, timeline.streamEnd].forEach(moment => { // All checks listed, and the finished answer.
      elapsed = moment;
      renderWalkthrough(true);
      conversationHeight = Math.max(conversationHeight, conversation.offsetHeight);
    });
  });
  conversation.style.minHeight = `${conversationHeight}px`;
  caseIndex = saved.caseIndex;
  fillCase();
  elapsed = Math.min(saved.elapsed, timeline.end);
  renderWalkthrough(true);
  placeThumb();
}

// Slides the train onto the current scenario, whatever the layout of the buttons.
function placeThumb() {
  const button = scenarioButtons[caseIndex];
  scenarioThumb.style.width = `${button.offsetWidth}px`;
  scenarioThumb.style.height = `${button.offsetHeight}px`;
  scenarioThumb.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
}

// Opening "what the assistant checked" holds the demo, closing it lets the demo go on.
let heldByChecked = false;
function closeChecked() {
  if (heldByChecked) walkthroughPlaying = true;
  heldByChecked = false;
  checkedBox.open = false;
}
checkedBox.addEventListener("toggle", () => {
  if (checkedBox.open && walkthroughPlaying) {
    heldByChecked = true;
    walkthroughPlaying = false;
  } else if (!checkedBox.open && heldByChecked) {
    heldByChecked = false;
    walkthroughPlaying = true;
  }
  scheduleWalkthrough();
});

// Opens a scenario: from its first keystroke when playing, as a finished dialog otherwise.
function selectCase(index) {
  closeChecked();
  caseIndex = index;
  scenarioButtons.forEach((button, position) => button.setAttribute("aria-pressed", String(position === index)));
  fillCase();
  elapsed = walkthroughPlaying ? 0 : timeline.streamEnd;
  renderWalkthrough(true);
  placeThumb();
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
  if (elapsed >= timeline.end) {
    selectCase((caseIndex + 1) % scenarioButtons.length); // The train moves on; after the last scenario it starts over.
    return;
  }
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

// A click starts that scenario, also when the demo was paused (but not against a reduced-motion setting).
scenarioButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (!motionPreference.matches) walkthroughPlaying = true;
  selectCase(index);
}));
walkthroughToggle.addEventListener("click", () => {
  walkthroughPlaying = !walkthroughPlaying;
  closeChecked();
  if (walkthroughPlaying && elapsed >= timeline.holdEnd) elapsed = 0;
  scheduleWalkthrough();
});
document.addEventListener("visibilitychange", scheduleWalkthrough);
motionPreference.addEventListener("change", event => {
  if (!event.matches) return;
  walkthroughPlaying = heldByChecked = false;
  elapsed = timeline.streamEnd;
  scheduleWalkthrough();
});
// Only width changes matter: phones fire resize whenever the address bar slides in or out.
let resizeTimer;
let measuredWidth = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === measuredWidth) return;
  measuredWidth = window.innerWidth;
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(reserveHeights, 150);
});

// A language change re-renders everything that demo.js wrote, keeping the current selections.
document.addEventListener("sig:languagechange", () => {
  renderers.forEach(render => render());
  reserveHeights();
  selectCase(caseIndex);
  updateCharts();
});

document.querySelector("#walkthrough-bar").hidden = false;
document.querySelector("#walkthrough-status").hidden = false;
reserveHeights();
selectCase(0); // Reduced motion: not playing, so this shows the finished dialog.
window.setTimeout(() => scenarioThumb.classList.add("is-ready"), 100); // Slide only after the first placement.
document.fonts.ready.then(reserveHeights); // Web fonts change line breaks: measure again.
let walkthroughSeen = false;
const walkthroughObserver = new IntersectionObserver(entries => {
  const { intersectionRect, boundingClientRect } = entries[entries.length - 1];
  // Half of the demo, or half of the screen where the demo is taller than the screen.
  walkthroughOnscreen = intersectionRect.height >= 0.5 * Math.min(boundingClientRect.height, window.innerHeight);
  if (walkthroughOnscreen && !walkthroughSeen) {
    walkthroughSeen = true;
    if (walkthroughPlaying) elapsed = 0; // Visitors see the dialog from its first keystroke.
  }
  scheduleWalkthrough();
}, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
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
  factTip.style.setProperty("--arrow-x", `${Math.round(tile.left + tile.width / 2 - left - factTip.clientLeft)}px`);
}

function showFact(tile) {
  const text = copy().facts[tile.dataset.fact];
  if (!text) return;
  if (factTile && factTile !== tile) factTile.removeAttribute("aria-describedby");
  factTile = tile;
  const titleSource = tile.dataset.fact === "more" ? tile.closest(".integration-group").querySelector("h3") : tile.querySelector(".logo-word, .logo-name") || tile;
  factTitle.textContent = titleSource.textContent.trim();
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
    const visible = items.filter(item => item.getClientRects().length);
    const index = visible.indexOf(document.activeElement);
    if (index === -1) return;
    let next;
    switch (event.key) {
      case "ArrowRight": case "ArrowDown": next = (index + 1) % visible.length; break;
      case "ArrowLeft": case "ArrowUp": next = (index - 1 + visible.length) % visible.length; break;
      case "Home": next = 0; break;
      case "End": next = visible.length - 1; break;
      default: return;
    }
    event.preventDefault();
    items.forEach(item => { item.tabIndex = -1; });
    visible[next].tabIndex = 0;
    visible[next].focus();
  });
});

document.addEventListener("keydown", event => { if (event.key === "Escape") hideFact(); });
document.addEventListener("pointerdown", event => { if (factTile && !event.target.closest("[data-fact]")) hideFact(); });
window.addEventListener("scroll", positionFact, { passive: true });
window.addEventListener("resize", positionFact);
// Phones: long logo groups show six tiles and a "Show all (n)" button (the CSS applies only to narrow screens).
const logoToggleLabels = [];
document.querySelectorAll(".logo-grid").forEach(grid => {
  const count = grid.children.length;
  if (count <= 6) return;
  grid.classList.add("is-collapsed");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "logo-toggle";
  const label = () => {
    const collapsed = grid.classList.contains("is-collapsed");
    button.textContent = collapsed ? copy().showAll.replace("{n}", count) : copy().showLess;
    button.setAttribute("aria-expanded", String(!collapsed));
  };
  button.addEventListener("click", () => {
    grid.classList.toggle("is-collapsed");
    hideFact();
    label();
  });
  grid.after(button);
  logoToggleLabels.push(label);
  label();
});

document.addEventListener("sig:languagechange", () => {
  logoToggleLabels.forEach(label => label());
  if (factTile) showFact(factTile);
});

// ---------------------------------------------------------------------------
// Three circles: scrolling plays the scene step by step (1-3: a circle comes in, 4: the circles
// meet, 5: Sintelligence appears where they overlap). Scrolling back rewinds it. The motion itself
// is CSS; without motion, or on very low screens, the styles show the finished picture.
// ---------------------------------------------------------------------------
const sceneStage = document.querySelector("#advantage-stage");
const scene = sceneStage.parentElement;
// Where each step starts, in screen heights after the stage has reached the top.
const STEP_STARTS = [-0.42, 0.22, 0.72, 1.22, 1.62];
let sceneStep = -1;
function playScene() {
  const scrolled = -scene.getBoundingClientRect().top / window.innerHeight;
  const step = STEP_STARTS.filter(start => scrolled >= start).length;
  if (step === sceneStep) return;
  sceneStep = step;
  STEP_STARTS.forEach((start, index) => sceneStage.classList.toggle(`s${index + 1}`, step > index));
}
playScene();
window.addEventListener("scroll", playScene, { passive: true });
window.addEventListener("resize", playScene);
document.documentElement.classList.add("scene-ready"); // Animate only from now on.
})();
