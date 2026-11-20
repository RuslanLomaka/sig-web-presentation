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
const levelChart = document.querySelector("#level-chart");
const pressureAxis = { min: 1, max: 3.5, ticks: [1, 1.5, 2, 2.5, 3, 3.5], labels: ["−5 хв", "−4", "−3", "−2", "−1", "Зупинка"] };
const levelAxis = { min: 10, max: 50, ticks: [10, 20, 30, 40, 50], labels: ["10:24", "", "10:30", "", "10:36", "", "10:42"] };

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
  if (levelChart.clientWidth) drawChart(levelChart, [45, 43, 37, 29, 24, 19, 15], levelAxis);
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
  scada: ["Події й вимірювання", "Сигнали, стани й часові мітки допомагають зіставити падіння рівня, зміну тиску та момент зупинки.", "У прикладі: журнал подій і тренд LT-101."],
  plc: ["Логіка роботи", "Проєкт контролера пояснює, від яких умов залежить запуск і які сигнали використовує обладнання.", "У прикладі: умови дозволу запуску P-204."],
  docs: ["Умови та процедури", "Інструкції дають контекст для перевірки порогів, умов подачі та допустимих режимів.", "У прикладі: інструкція насоса P-204."],
  team: ["Знання з практики", "Погоджені експертні правила й записи зміни допомагають вибрати перевірку та передати контекст наступній зміні.", "У прикладі: результат перевірки ще не внесено."]
}, ["#source-title", "#source-text", "#source-example"]);

bindChoice("#report-choice", {
  engineer: ["Передача зміни", "Перед зупинкою лінії B зафіксовано низький рівень LT-101 і падіння тиску PT-204. О 10:24:10 поріг запуску P-204 змінили з 35 % до 15 %. Перевірити фактичну подачу та умови запуску. Результат перевірки ще не внесено."],
  manager: ["Огляд для керівника", "Пріоритет зміни — розібратися з повторними зупинками лінії B. Команді потрібно перевірити подачу та оцінити можливий вплив зміни порога. Підтвердженої причини поки немає."]
}, ["#report-title", "#report-text"]);

bindChoice("#deployment-choice", {
  local: ["В інфраструктурі підприємства", "Залишається у визначеному периметрі", "Обчислення та обробка за політиками підприємства"],
  cloud: ["У погодженому хмарному середовищі", "До моделі надходить погоджений контекст", "Хмарні ресурси, передавання та зберігання за угодою"]
}, ["#deploy-model", "#deploy-data", "#deploy-terms"]);

document.querySelector("#trend-choice").addEventListener("change", updatePressure);
window.addEventListener("resize", updateCharts);
document.fonts.ready.then(updateCharts);

const pilotDialog = document.querySelector("#pilot-dialog");
document.querySelector("#pilot-open").addEventListener("click", () => pilotDialog.showModal());
