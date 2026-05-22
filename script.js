/**
 * 労働条件通知書ジェネレーター
 * 労働基準法第15条ほかに基づく明示事項を入力し、通知書（兼雇用契約書）を作成します。
 * index.html の data-ph と PLACEHOLDERS のキーを一致させてください。
 */

const EMPTY = "—";

const PLACEHOLDERS = {
  労働者氏名: { inputId: "worker-name", introLabel: "氏名" },
  使用者名称: { inputId: "employer-name", emptyDefault: "" },
  契約期間: { inputId: "contract-period" },
  更新上限: { inputId: "renewal-limit", emptyDefault: "" },
  無期転換申込: { inputId: "indefinite-conversion", emptyDefault: "" },
  無期転換後条件: { inputId: "indefinite-conditions", emptyDefault: "" },
  就業場所: { inputId: "work-location" },
  就業場所変更の範囲: { inputId: "work-location-scope" },
  業務内容: { inputId: "job-duties" },
  業務内容変更の範囲: { inputId: "job-duties-scope" },
  始業時刻: { inputId: "work-start-time", emptyDefault: "" },
  終業時刻: { inputId: "work-end-time", emptyDefault: "" },
  所定労働時間: { inputId: "scheduled-hours" },
  休憩時間: { inputId: "break-display", emptyDefault: "" },
  時間外労働の有無: { inputId: "overtime-policy" },
  休日: { inputId: "holidays" },
  勤務日: { inputId: "work-days" },
  休暇: { inputId: "paid-leave" },
  基本給: { inputId: "base-salary" },
  固定残業代時間: { inputId: "fixed-ot-hours", emptyDefault: "" },
  固定残業代金額: { inputId: "fixed-ot-amount", emptyDefault: "" },
  固定残業代超過: { inputId: "fixed-ot-excess", emptyDefault: "" },
  賃金決定計算支払: { inputId: "wage-method" },
  昇給: { inputId: "salary-increase" },
  賃金支払日: { inputId: "payday" },
  退職に関する事項: {
    inputId: "retirement-policy",
    emptyDefault: "退職する１ヶ月前に届け出ること",
  },
  パート昇給: { inputId: "part-raise", emptyDefault: "" },
  パート賞与: { inputId: "part-bonus", emptyDefault: "" },
  パート退職金: { inputId: "part-severance", emptyDefault: "" },
  相談窓口: { inputId: "consultation-desk", emptyDefault: "" },
  その他明示事項: { inputId: "other-disclosure", emptyDefault: "" },
  特記事項: { inputId: "special-notes", emptyDefault: "なし" },
  事業所名称所在地: { inputId: "employer-address" },
  肩書: { inputId: "representative-title", emptyDefault: "" },
  名前: { inputId: "representative-name", emptyDefault: "" },
  労働者合意氏名: { inputId: "worker-agreement-name", emptyDefault: "" },
};

function trimValue(value) {
  return (value || "").trim();
}

function readInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return null;
  let text;
  if (el.type === "radio") {
    text = getRadioValue(inputId);
  } else if (el.type === "checkbox") {
    text = el.checked ? "on" : "";
  } else {
    text = el.value;
  }
  text = trimValue(text);
  return text === "" ? null : text;
}

function getRadioValue(name) {
  const checked = document.querySelector('input[name="' + name + '"]:checked');
  return checked ? checked.value : "";
}

function tableText(value) {
  return value === null ? EMPTY : value;
}

function introText(value, introLabel) {
  return value === null ? introLabel : value;
}

function parseTimeToMinutes(text) {
  const s = trimValue(text).replace(/[：]/g, ":");
  if (s === "") return null;

  let m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);

  m = s.match(/^(\d{1,2})時(\d{1,2})分?$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);

  m = s.match(/^(\d{1,2})時$/);
  if (m) return parseInt(m[1], 10) * 60;

  return null;
}

function formatDurationMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return minutes + "分";
  if (minutes === 0) return hours + "時間";
  return hours + "時間" + minutes + "分";
}

function updateScheduledHoursFromTimes() {
  const startEl = document.getElementById("work-start-time");
  const endEl = document.getElementById("work-end-time");
  const scheduledEl = document.getElementById("scheduled-hours");
  if (!startEl || !endEl || !scheduledEl) return;

  const start = parseTimeToMinutes(startEl.value);
  const end = parseTimeToMinutes(endEl.value);
  if (start === null || end === null) return;

  let endMinutes = end;
  if (endMinutes <= start) endMinutes += 24 * 60;

  const breakRaw = trimValue(document.getElementById("break-minutes")?.value);
  const breakMinutes = breakRaw === "" ? 0 : parseInt(breakRaw, 10);
  if (isNaN(breakMinutes) || breakMinutes < 0) return;

  const workMinutes = endMinutes - start - breakMinutes;
  if (workMinutes <= 0) {
    scheduledEl.value = "";
    return;
  }

  scheduledEl.value = "1日" + formatDurationMinutes(workMinutes);
}

/** 休憩（分）→ 通知書用の表示欄 */
function updateBreakDisplay() {
  const breakInput = document.getElementById("break-minutes");
  const display = document.getElementById("break-display");
  if (!breakInput || !display) return;

  const raw = trimValue(breakInput.value);
  display.value = raw === "" ? "" : raw + "分";
}

function createAllowanceRow(name, amount) {
  const row = document.createElement("div");
  row.className = "allowance-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "allowance-name";
  nameInput.placeholder = "手当名（例：家族手当）";
  nameInput.value = name || "";

  const amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.className = "allowance-amount";
  amountInput.placeholder = "金額（円）";
  amountInput.value = amount || "";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-allowance-btn";
  removeBtn.textContent = "削除";
  removeBtn.addEventListener("click", function () {
    row.remove();
    applyPlaceholders();
  });

  row.appendChild(nameInput);
  row.appendChild(amountInput);
  row.appendChild(removeBtn);
  return row;
}

function collectAllowances() {
  const rows = document.querySelectorAll("#allowance-rows .allowance-row");
  const items = [];

  rows.forEach(function (row) {
    const name = trimValue(row.querySelector(".allowance-name")?.value);
    const amount = trimValue(row.querySelector(".allowance-amount")?.value);
    if (name === "" && amount === "") return;
    items.push({
      name: name === "" ? EMPTY : name,
      amount: amount === "" ? EMPTY : amount,
    });
  });

  return items;
}

function renderAllowancePreview() {
  const container = document.getElementById("allowance-preview-list");
  if (!container) return;

  container.innerHTML = "";
  collectAllowances().forEach(function (item) {
    const line = document.createElement("p");
    line.className = "wage-line";
    line.textContent = "・" + item.name + "：" + item.amount + "円";
    container.appendChild(line);
  });

  const otContainer = document.getElementById("fixed-ot-preview");
  if (!otContainer) return;

  otContainer.innerHTML = "";
  const fixedHours = trimValue(document.getElementById("fixed-ot-hours")?.value);
  const fixedAmount = trimValue(document.getElementById("fixed-ot-amount")?.value);
  const fixedExcess = trimValue(document.getElementById("fixed-ot-excess")?.value);

  if (fixedHours !== "" || fixedAmount !== "") {
    const line = document.createElement("p");
    line.className = "wage-line";
    const h = fixedHours === "" ? EMPTY : fixedHours;
    const a = fixedAmount === "" ? EMPTY : fixedAmount;
    line.textContent = "・固定残業代：" + a + "円（" + h + "時間分）";
    otContainer.appendChild(line);

    if (fixedExcess !== "") {
      const sub = document.createElement("p");
      sub.className = "wage-sub";
      sub.textContent = "　" + fixedExcess;
      otContainer.appendChild(sub);
    }
  }
}

function syncUiOptions() {
  const combined = document.getElementById("use-combined-title")?.checked;
  const titleEl = document.getElementById("notice-title");
  const agreementEl = document.getElementById("agreement-section");

  const combinedTitle = "労働条件通知書兼労働契約書";
  const simpleTitle = "労働条件通知書";

  if (titleEl) {
    titleEl.textContent = combined ? combinedTitle : simpleTitle;
  }

  const footerTitle = document.getElementById("print-footer-title");
  if (footerTitle) {
    footerTitle.textContent = combined ? combinedTitle : simpleTitle;
  }

  if (agreementEl) {
    agreementEl.hidden = !combined;
  }

  const legalCombined = document.getElementById("notice-legal-combined");
  if (legalCombined) {
    legalCombined.hidden = !combined;
  }

  const isFixed = getRadioValue("contract-type") === "fixed";
  document.querySelectorAll(".contract-2024-only").forEach(function (el) {
    el.hidden = !isFixed;
  });

  const partTime = document.getElementById("is-part-time")?.checked;
  document.querySelectorAll(".parttime-only").forEach(function (el) {
    el.hidden = !partTime;
  });

  const useFixedOt = document.getElementById("use-fixed-overtime")?.checked;
  const otForm = document.getElementById("fixed-ot-form");
  const otPreview = document.getElementById("fixed-ot-preview");
  if (otForm) otForm.hidden = !useFixedOt;
  if (otPreview) otPreview.hidden = !useFixedOt;
}

function collectValues() {
  const values = {};
  Object.keys(PLACEHOLDERS).forEach(function (key) {
    values[key] = readInput(PLACEHOLDERS[key].inputId);
  });

  const now = new Date();
  values.作成年 = String(now.getFullYear());
  values.作成月 = String(now.getMonth() + 1);
  values.作成日 = String(now.getDate());

  if (getRadioValue("contract-type") !== "fixed") {
    values.契約期間 = null;
    values.更新上限 = null;
    values.無期転換申込 = null;
    values.無期転換後条件 = null;
  }

  return values;
}

function applyPlaceholders() {
  updateScheduledHoursFromTimes();
  updateBreakDisplay();
  syncUiOptions();

  const values = collectValues();

  document.querySelectorAll("[data-ph]").forEach(function (el) {
    const key = el.getAttribute("data-ph");
    const raw = values[key];
    const cfg = PLACEHOLDERS[key];
    const isIntro = el.classList.contains("ph-intro");

    let text;
    if (isIntro) {
      text = introText(raw, el.getAttribute("data-intro-label") || (cfg && cfg.introLabel));
      el.classList.toggle("is-empty", raw === null);
    } else {
      if (raw === null && cfg && Object.prototype.hasOwnProperty.call(cfg, "emptyDefault")) {
        text = cfg.emptyDefault;
      } else {
        text = tableText(raw);
      }
      el.classList.remove("is-empty");
    }

    el.textContent = text;
  });

  renderAllowancePreview();

  const workerName = trimValue(document.getElementById("worker-name")?.value);
  const agreeNameEl = document.getElementById("worker-agreement-name");
  if (agreeNameEl && trimValue(agreeNameEl.value) === "" && workerName !== "") {
    agreeNameEl.value = workerName;
    const agreePh = document.querySelector('[data-ph="労働者合意氏名"]');
    if (agreePh) agreePh.textContent = workerName;
  }

  const contractType = getRadioValue("contract-type");
  const periodWrap = document.getElementById("contract-period-display");
  const markNone = document.getElementById("mark-none");
  const markFixed = document.getElementById("mark-fixed");

  if (periodWrap) periodWrap.hidden = contractType !== "fixed";
  if (markNone && markFixed) {
    if (contractType === "fixed") {
      markNone.textContent = "□";
      markFixed.textContent = "■";
    } else {
      markNone.textContent = "■";
      markFixed.textContent = "□";
    }
  }
}

function initAllowances() {
  const list = document.getElementById("allowance-rows");
  const addBtn = document.getElementById("add-allowance-btn");
  if (!list) return;

  list.appendChild(createAllowanceRow("", ""));
  list.appendChild(createAllowanceRow("", ""));

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      list.appendChild(createAllowanceRow("", ""));
      list.lastElementChild?.querySelector(".allowance-name")?.focus();
      applyPlaceholders();
    });
  }

  list.addEventListener("input", applyPlaceholders);
}

function init() {
  const form = document.getElementById("input-form");
  const printBtn = document.getElementById("print-btn");

  initAllowances();

  if (form) {
    form.addEventListener("input", applyPlaceholders);
    form.addEventListener("change", applyPlaceholders);
  }

  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  window.addEventListener("beforeprint", function () {
    document.querySelectorAll(".ph-intro.is-empty").forEach(function (el) {
      el.dataset.previewText = el.textContent;
      el.textContent = EMPTY;
      el.classList.remove("is-empty");
    });
  });

  window.addEventListener("afterprint", function () {
    document.querySelectorAll(".ph-intro[data-preview-text]").forEach(function (el) {
      delete el.dataset.previewText;
    });
    applyPlaceholders();
  });

  applyPlaceholders();
}

document.addEventListener("DOMContentLoaded", init);
