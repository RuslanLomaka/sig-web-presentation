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

const walkthrough = document.querySelector("#walkthrough");
const walkthroughToggle = document.querySelector("#walkthrough-toggle");
const walkthroughPhase = document.querySelector("#walkthrough-phase");
const walkthroughProgress = document.querySelector("#walkthrough-progress");
const walkthroughSelect = document.querySelector("#walkthrough-case");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const walkthroughDurations = [2000, 1500, 1500, 1700, 1000, 10500];
const walkthroughCase = () => copy().walkthrough.cases[walkthroughSelect.value];
const revealedWalkthroughElements = walkthrough.querySelectorAll("[data-show-step]");
const walkthroughSources = walkthrough.querySelectorAll("[data-source-step]");
let walkthroughStage = motionPreference.matches ? walkthroughDurations.length - 1 : 0;
let walkthroughPlaying = !motionPreference.matches;
let walkthroughOnscreen = false;
let walkthroughTimer;

function showWalkthroughStage() {
  const text = copy().walkthrough;
  revealedWalkthroughElements.forEach(element => {
    element.dataset.visible = walkthroughStage >= Number(element.dataset.showStep);
  });
  walkthroughSources.forEach(element => {
    element.dataset.reading = walkthroughStage === Number(element.dataset.sourceStep);
  });
  walkthroughPhase.textContent = text.steps[walkthroughStage] ?? walkthroughCase().sources[walkthroughStage - 1][2];
  walkthroughProgress.value = walkthroughStage;
  walkthroughToggle.textContent = walkthroughPlaying ? text.pause : text.play;
}

function scheduleWalkthrough() {
  window.clearTimeout(walkthroughTimer);
  if (!walkthroughPlaying || !walkthroughOnscreen || document.hidden) return;
  walkthroughTimer = window.setTimeout(() => {
    walkthroughStage = (walkthroughStage + 1) % walkthroughDurations.length;
    showWalkthroughStage();
    scheduleWalkthrough();
  }, walkthroughDurations[walkthroughStage]);
}

function updateWalkthroughCase() {
  const current = walkthroughCase();
  document.querySelector("#walkthrough-question").textContent = current.question;
  document.querySelector("#walkthrough-answer-title").textContent = current.answerTitle;
  document.querySelector("#walkthrough-answer").textContent = current.answer;
  document.querySelector("#walkthrough-limit").textContent = current.limit;
  walkthroughSources.forEach((source, index) => {
    const [title, description] = current.sources[index];
    source.querySelector("strong").textContent = title;
    source.querySelector("p").textContent = description;
  });
}

walkthroughSelect.addEventListener("change", () => {
  updateWalkthroughCase();
  walkthroughStage = walkthroughPlaying ? 0 : walkthroughDurations.length - 1;
  showWalkthroughStage();
  scheduleWalkthrough();
});
walkthroughToggle.addEventListener("click", () => {
  walkthroughPlaying = !walkthroughPlaying;
  showWalkthroughStage();
  scheduleWalkthrough();
});
document.querySelector("#walkthrough-replay").addEventListener("click", () => {
  walkthroughStage = 0;
  walkthroughPlaying = true;
  showWalkthroughStage();
  scheduleWalkthrough();
});
document.addEventListener("visibilitychange", scheduleWalkthrough);
motionPreference.addEventListener("change", event => {
  if (!event.matches) return;
  walkthroughPlaying = false;
  walkthroughStage = walkthroughDurations.length - 1;
  showWalkthroughStage();
  scheduleWalkthrough();
});

// A language change re-renders everything that demo.js wrote, keeping the current selections.
document.addEventListener("sig:languagechange", () => {
  renderers.forEach(render => render());
  updateWalkthroughCase();
  showWalkthroughStage();
  updateCharts();
});

document.querySelector("#walkthrough-actions").hidden = false;
document.querySelector("#walkthrough-selector").hidden = false;
document.querySelector("#walkthrough-status").hidden = false;
updateWalkthroughCase();
showWalkthroughStage();
const walkthroughObserver = new IntersectionObserver(([entry]) => {
  walkthroughOnscreen = entry.intersectionRatio >= 0.2;
  scheduleWalkthrough();
}, { threshold: 0.2 });
walkthroughObserver.observe(walkthrough);
