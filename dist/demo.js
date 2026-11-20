"use strict";

const trendCases = {
  "12": {
    values: [2.9, 2.9, 2.7, 2.4, 1.9, 1.4],
    note: "12 квітня тиск знизився з 2,9 до 1,4 бар."
  },
  "18": {
    values: [2.8, 2.7, 2.8, 2.3, 1.9, 1.6],
    note: "18 квітня тиск знизився з 2,8 до 1,6 бар."
  },
  "24": {
    values: [2.9, 2.8, null, null, 2.2, null],
    note: "24 квітня частина записів відсутня. Тиск у момент зупинки невідомий."
  }
};
const pressureChart = document.querySelector("#pressure-chart");
const pressureAxis = { min: 1, max: 3.5, ticks: [1, 1.5, 2, 2.5, 3, 3.5], labels: ["−5 хв", "−4", "−3", "−2", "−1", "Зупинка"] };

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
    ctx.fillText(tick.toLocaleString("uk-UA"), margin.left - 7, y(tick));
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
  const { values, note } = trendCases[value];
  document.querySelector("#trend-note").textContent = note;
  drawChart(pressureChart, values, pressureAxis);
}

function updateCharts() {
  if (pressureChart.clientWidth) updatePressure();
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

function bindButtons(attribute, content, selectors) {
  const buttons = [...document.querySelectorAll(`[data-${attribute}]`)];
  const outputs = selectors.map(selector => document.querySelector(selector));
  buttons.forEach(button => button.addEventListener("click", () => {
    buttons.forEach(item => item.setAttribute("aria-pressed", item === button));
    content[button.dataset[attribute]].forEach((value, index) => {
      outputs[index].textContent = value;
    });
  }));
}

function bindChoice(fieldset, content, selectors) {
  const outputs = selectors.map(selector => document.querySelector(selector));
  document.querySelector(fieldset).addEventListener("change", event => {
    content[event.target.value].forEach((value, index) => {
      outputs[index].textContent = value;
    });
  });
}

bindButtons("event", {
  level: ["LT-101 · Низький рівень", "Рівень у приймальному бункері був низьким за 4 секунди до зупинки лінії."],
  pressure: ["PT-204 · Падіння тиску", "Тиск знизився через 2 секунди після спрацювання сигналу низького рівня."],
  stop: ["Лінія B · Зупинка", "Журнал зафіксував зупинку о 10:42:20. Для визначення причини потрібна перевірка подачі."]
}, ["#event-title", "#event-description"]);

bindButtons("source", {
  scada: ["Події й вимірювання", "Записи показують, що сталося першим: падіння рівня, зміна тиску чи зупинка.", "Приклад — журнал подій і графік рівня."],
  plc: ["Умови запуску", "З програми контролера видно, за яких умов обладнання може запуститися.", "Приклад — які сигнали потрібні для запуску насоса."],
  docs: ["Як має працювати обладнання", "Інструкції та схеми допомагають звірити умови роботи й знайти, що переглянути.", "Приклад — розділ інструкції про запуск насоса."],
  team: ["Що вже перевіряли", "Інженер записує підтверджений випадок. Наступна зміна може знайти його, якщо проблема повториться.", "Приклад — що перевірили минулого разу й що це показало."]
}, ["#source-title", "#source-text", "#source-example"]);

bindChoice("#report-choice", {
  engineer: ["Передача зміни", "Перед зупинкою лінії B зафіксовано низький рівень LT-101 і падіння тиску PT-204. О 10:24:10 поріг запуску P-204 змінили з 35 % до 15 %. Перевірити фактичну подачу та умови запуску. Результат перевірки ще не внесено."],
  manager: ["Огляд для керівника", "Пріоритет зміни — розібратися з повторними зупинками лінії B. Команді потрібно перевірити подачу та оцінити можливий вплив зміни порога. Підтвердженої причини поки немає."]
}, ["#report-title", "#report-text"]);

bindChoice("#resource-choice", {
  energy: [
    "144 кВт·год", "168 кВт·год", "0,12 → 0,14 кВт·год",
    "Де шукати перевитрату електроенергії?",
    "За того самого обсягу зміна B витратила на 24 кВт·год більше.",
    "Зіставте покази лічильника з графіком роботи. Окремо перегляньте споживання, коли випуску не було."
  ],
  water: [
    "4 200 л", "4 800 л", "3,5 → 4,0 л",
    "Де шукати перевитрату води?",
    "За того самого обсягу зміна B витратила на 600 л більше.",
    "Звірте покази лічильника із записами промивання. Перевірте, чи відрізнялися тривалість або кількість циклів."
  ]
}, ["#resource-before", "#resource-after", "#resource-per-unit", "#resource-question", "#resource-finding", "#resource-check"]);

bindChoice("#deployment-choice", {
  local: ["В інфраструктурі підприємства", "Залишається у визначеному периметрі", "Обчислення та обробка за політиками підприємства"],
  cloud: ["У погодженому хмарному середовищі", "До моделі надходить погоджений контекст", "Хмарні ресурси, передавання та зберігання за угодою"]
}, ["#deploy-model", "#deploy-data", "#deploy-terms"]);

document.querySelector("#trend-choice").addEventListener("change", updatePressure);
window.addEventListener("resize", updateCharts);
document.fonts.ready.then(updateCharts);

const walkthrough = document.querySelector("#walkthrough");
const walkthroughToggle = document.querySelector("#walkthrough-toggle");
const walkthroughPhase = document.querySelector("#walkthrough-phase");
const walkthroughProgress = document.querySelector("#walkthrough-progress");
const walkthroughSelect = document.querySelector("#walkthrough-case");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const walkthroughSteps = [
  { label: "Інженер ставить запитання", duration: 2000 },
  { duration: 1500 },
  { duration: 1500 },
  { duration: 1700 },
  { label: "Асистент зіставляє записи", duration: 1000 },
  { label: "Інженер отримує підказку", duration: 10500 }
];
const walkthroughCases = {
  resources: {
    question: "Чому на той самий обсяг пішло більше електроенергії?",
    answerTitle: "Почніть із періодів без роботи.",
    answer: "Лічильник показує витрати навіть тоді, коли ділянка нічого не випускала.",
    limit: "Спершу з’ясуйте, яке споживання в цей час потрібне за регламентом.",
    sources: [
      ["Лічильник", "Витрати зросли зі 144 до 168 кВт·год.", "Асистент читає покази лічильника"],
      ["Обсяг роботи", "Обидві зміни випустили по 1 200 одиниць.", "Асистент порівнює випуск"],
      ["Графік роботи", "Частина витрат припала на час без випуску.", "Асистент перевіряє графік роботи"]
    ]
  },
  incident: {
    question: "Лінія B зупинилася. Що перевірити першим?",
    answerTitle: "Перевірте подачу до насоса.",
    answer: "Перед зупинкою впали рівень на вході й тиск. Нестача подачі може це пояснити.",
    limit: "Даних про витрату немає. Причину ще треба перевірити.",
    sources: [
      ["Журнал подій", "Рівень і тиск впали перед зупинкою.", "Асистент читає журнал подій"],
      ["Історія рівня", "Рівень падав ще до сигналу про зупинку.", "Асистент дивиться історію рівня"],
      ["Інструкція насоса", "В інструкції є умови запуску й подачі.", "Асистент звіряється з інструкцією"]
    ]
  }
};
const revealedWalkthroughElements = walkthrough.querySelectorAll("[data-show-step]");
const walkthroughSources = walkthrough.querySelectorAll("[data-source-step]");
let walkthroughCase = walkthroughCases[walkthroughSelect.value];
let walkthroughStage = motionPreference.matches ? walkthroughSteps.length - 1 : 0;
let walkthroughPlaying = !motionPreference.matches;
let walkthroughOnscreen = false;
let walkthroughTimer;

function showWalkthroughStage() {
  revealedWalkthroughElements.forEach(element => {
    element.dataset.visible = walkthroughStage >= Number(element.dataset.showStep);
  });
  walkthroughSources.forEach(element => {
    element.dataset.reading = walkthroughStage === Number(element.dataset.sourceStep);
  });
  walkthroughPhase.textContent = walkthroughSteps[walkthroughStage].label ?? walkthroughCase.sources[walkthroughStage - 1][2];
  walkthroughProgress.value = walkthroughStage;
  walkthroughToggle.textContent = walkthroughPlaying ? "Пауза" : "Відтворити";
}

function scheduleWalkthrough() {
  window.clearTimeout(walkthroughTimer);
  if (!walkthroughPlaying || !walkthroughOnscreen || document.hidden) return;
  walkthroughTimer = window.setTimeout(() => {
    walkthroughStage = (walkthroughStage + 1) % walkthroughSteps.length;
    showWalkthroughStage();
    scheduleWalkthrough();
  }, walkthroughSteps[walkthroughStage].duration);
}

function updateWalkthroughCase() {
  walkthroughCase = walkthroughCases[walkthroughSelect.value];
  document.querySelector("#walkthrough-question").textContent = walkthroughCase.question;
  document.querySelector("#walkthrough-answer-title").textContent = walkthroughCase.answerTitle;
  document.querySelector("#walkthrough-answer").textContent = walkthroughCase.answer;
  document.querySelector("#walkthrough-limit").textContent = walkthroughCase.limit;
  walkthroughSources.forEach((source, index) => {
    const [title, description] = walkthroughCase.sources[index];
    source.querySelector("strong").textContent = title;
    source.querySelector("p").textContent = description;
  });
}

walkthroughSelect.addEventListener("change", () => {
  updateWalkthroughCase();
  walkthroughStage = walkthroughPlaying ? 0 : walkthroughSteps.length - 1;
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
  walkthroughStage = walkthroughSteps.length - 1;
  showWalkthroughStage();
  scheduleWalkthrough();
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
