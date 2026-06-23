/**
 * 労働条件通知書ジェネレーター
 * 労働基準法第15条ほかに基づく明示事項を入力し、通知書（兼雇用契約書）を作成します。
 * index.html の data-ph と PLACEHOLDERS のキーを一致させてください。
 */

const EMPTY = "—";

const STORAGE_KEY = "labor-notice-generator-draft";
const STORAGE_VERSION = 1;
const SAVE_DEBOUNCE_MS = 500;

const DRAFT_EXTRA_FIELD_IDS = [
  "break-minutes",
  "break-start-time",
  "break-end-time",
  "commute-expense-desc",
  "commute-expense-limit",
  "monthly-gross-split-target",
  "monthly-scheduled-hours",
  "annual-holiday-days",
  "min-wage-prefecture",
];
const DRAFT_CHECKBOX_IDS = [
  "use-combined-title",
  "use-fixed-overtime",
  "use-salary-split",
  "use-computed-monthly-hours",
  "round-base-to-100",
  "use-probation",
  "is-part-time",
];

/** 割増賃金の計算の基礎に含める手当（名称一致で自動チェック。必要に応じて編集してください） */
const OT_BASE_ALLOWANCE_NAMES = [
  "役職手当",
  "職務手当",
  "住宅手当",
  "家族手当",
  "資格手当",
  "調整手当",
  "職能手当",
  "役割手当",
  "勤務地手当",
  "営業手当",
];

/** 割増の基礎から除外しやすい手当 */
const OT_BASE_EXCLUDED_ALLOWANCE_NAMES = [
  "通勤手当",
  "交通費",
  "出張手当",
  "食事手当",
  "皆勤手当",
];

const OT_PREMIUM_RATE = 1.25;
const DAYS_IN_YEAR = 365;

let saveTimer = null;
let isRestoringDraft = false;
let skipSaveOnce = false;
let isApplyingSalarySplit = false;
function isUnderscorePlaceholder(text) {
  const t = trimValue(text);
  return t !== "" && /^[＿_－—‐\s]+$/.test(t);
}

function sanitizeNameField(inputId) {
  const el = document.getElementById(inputId);
  if (el && isUnderscorePlaceholder(el.value)) {
    el.value = "";
  }
}

const PLACEHOLDERS = {
  労働者氏名: { inputId: "worker-name", introLabel: "氏名" },
  使用者名称: { inputId: "employer-name", emptyDefault: "" },
  契約期間: { inputId: "contract-period" },
  更新上限: { inputId: "renewal-limit", emptyDefault: "" },
  無期転換申込: { inputId: "indefinite-conversion", emptyDefault: "" },
  無期転換後条件: { inputId: "indefinite-conditions", emptyDefault: "" },
  試用期間: { inputId: "probation-period" },
  試用期間中の労働条件: {
    inputId: "probation-conditions",
    emptyDefault: "本通知書に記載の労働条件と同一とする。",
  },
  本採用判断基準: {
    inputId: "probation-dismissal",
    emptyDefault:
      "試用期間中又は試用期間満了時に、勤務成績、業務遂行能力、勤務態度、健康状態その他従業員としての適格性を総合的に勘案し、本採用の可否を判断する。",
  },
  就業場所: { inputId: "work-location" },
  就業場所変更の範囲: { inputId: "work-location-scope" },
  業務内容: { inputId: "job-duties" },
  業務内容変更の範囲: { inputId: "job-duties-scope" },
  労働時間制度: { inputId: "work-hours-system", emptyDefault: "" },
  始業時刻: { inputId: "work-start-time", emptyDefault: "" },
  終業時刻: { inputId: "work-end-time", emptyDefault: "" },
  所定労働時間: { inputId: "scheduled-hours" },
  休憩時間: { emptyDefault: "" },
  時間外労働の有無: { inputId: "overtime-policy" },
  休日: { inputId: "holidays" },
  勤務日: { inputId: "work-days" },
  休暇: { inputId: "paid-leave" },
  月給支給総額: {},
  基本給: { inputId: "base-salary" },
  固定残業代時間: { inputId: "fixed-ot-hours", emptyDefault: "" },
  固定残業代金額: { inputId: "fixed-ot-amount", emptyDefault: "" },
  固定残業代超過: { inputId: "fixed-ot-excess", emptyDefault: "" },
  賃金決定計算支払: { inputId: "wage-method" },
  昇給: { inputId: "salary-increase" },
  賞与: { inputId: "bonus-policy" },
  交通費: {},
  賃金締切日: { inputId: "wage-cutoff-day", emptyDefault: "毎月末日" },
  賃金支払日: { inputId: "payday" },
  作成年: { inputId: "document-year" },
  作成月: { inputId: "document-month" },
  作成日: { inputId: "document-day" },
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
  名前: { inputId: "representative-name", emptyDefault: "" },
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

function normalizeDigits(text) {
  return trimValue(text)
    .replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    })
    .replace(/[，]/g, ",");
}

function formatYenComma(text) {
  const digits = normalizeDigits(text).replace(/[^\d]/g, "");
  if (digits === "") return null;
  const n = parseInt(digits, 10);
  if (isNaN(n)) return trimValue(text);
  return n.toLocaleString("ja-JP");
}

/** 支給内容＋上限（円）を通知書用の1行にまとめる */
function formatCommuteExpenseDisplay() {
  const desc = trimValue(document.getElementById("commute-expense-desc")?.value);
  const limitRaw = document.getElementById("commute-expense-limit")?.value ?? "";
  const limit = formatYenComma(limitRaw);
  const descPart = desc === "" ? "必要に応じて実費支給" : desc;

  if (limit) {
    return descPart + "（上限" + limit + "円）";
  }
  if (desc === "" && trimValue(limitRaw) === "") {
    return "必要に応じて実費支給（上限15,000円）";
  }
  return descPart;
}

function migrateCommuteDraftFields(data) {
  if (!data.fields) return;
  if (Object.prototype.hasOwnProperty.call(data.fields, "commute-expense-desc")) return;

  const legacy = data.fields["commute-expense-limit"];
  if (legacy === undefined) {
    data.fields["commute-expense-desc"] = "必要に応じて実費支給";
    return;
  }

  const normalized = normalizeDigits(legacy);
  const digitsOnly = normalized.replace(/[^0-9]/g, "");

  if (digitsOnly !== "" && normalized.replace(/[0-9,]/g, "") === "") {
    data.fields["commute-expense-limit"] = digitsOnly;
    data.fields["commute-expense-desc"] = "必要に応じて実費支給";
    return;
  }

  if (digitsOnly !== "") {
    data.fields["commute-expense-limit"] = digitsOnly;
    data.fields["commute-expense-desc"] =
      trimValue(legacy.replace(/[0-9０-９,，\s円￥¥]/g, "").replace(/上限/g, "")) ||
      "必要に応じて実費支給";
    return;
  }

  data.fields["commute-expense-desc"] = legacy;
  data.fields["commute-expense-limit"] = "";
}

function parseYenAmount(text) {
  const digits = trimValue(text).replace(/[^\d]/g, "");
  if (digits === "") return null;
  const n = parseInt(digits, 10);
  return isNaN(n) ? null : n;
}

/** 基本給＋固定残業代（有効時）＋手当の合計 */
function computeMonthlyGrossTotal() {
  let total = 0;
  let hasAny = false;

  function add(text) {
    const n = parseYenAmount(text);
    if (n !== null) {
      total += n;
      hasAny = true;
    }
  }

  add(document.getElementById("base-salary")?.value);

  if (document.getElementById("use-fixed-overtime")?.checked) {
    add(document.getElementById("fixed-ot-amount")?.value);
  }

  document.querySelectorAll("#allowance-rows .allowance-row").forEach(function (row) {
    add(row.querySelector(".allowance-amount")?.value);
  });

  return hasAny ? total : null;
}

function parseHoursNumber(text) {
  const raw = normalizeDigits(text).replace(/[^\d.]/g, "");
  if (raw === "") return null;
  const n = parseFloat(raw);
  return isNaN(n) || n <= 0 ? null : n;
}

function formatYenPlain(amount) {
  return Math.round(amount).toLocaleString("ja-JP");
}

function matchAllowancePreset(name, presets) {
  const n = trimValue(name);
  if (n === "") return false;
  return presets.some(function (preset) {
    return n === preset || n.includes(preset) || preset.includes(n);
  });
}

function suggestAllowanceInOtBase(name) {
  if (matchAllowancePreset(name, OT_BASE_EXCLUDED_ALLOWANCE_NAMES)) return false;
  return matchAllowancePreset(name, OT_BASE_ALLOWANCE_NAMES);
}

function sumAllowancesByOtBase() {
  let included = 0;
  let excluded = 0;

  document.querySelectorAll("#allowance-rows .allowance-row").forEach(function (row) {
    const n = parseYenAmount(row.querySelector(".allowance-amount")?.value);
    if (n === null) return;
    if (row.querySelector(".allowance-in-ot-base")?.checked) {
      included += n;
    } else {
      excluded += n;
    }
  });

  return { included: included, excluded: excluded };
}

function formatHoursDisplay(hours) {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** 「1日8時間」「1日7時間30分」などから1日の所定労働時間（時間）を取り出す */
function parseDailyHoursFromScheduledText(text) {
  const s = trimValue(text);
  if (s === "") return null;

  let m = s.match(/^1日(\d+)時間(?:(\d+)分?)?$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    return h + min / 60;
  }

  m = s.match(/^(\d+(?:\.\d+)?)\s*時間$/);
  if (m) return parseFloat(m[1]);

  return null;
}

/** 1日の所定労働時間（時間）。所定労働時間欄 → 始業・終業・休憩の順で取得 */
function getDailyWorkHoursForCalculation() {
  const fromScheduled = parseDailyHoursFromScheduledText(
    document.getElementById("scheduled-hours")?.value
  );
  if (fromScheduled !== null && fromScheduled > 0) return fromScheduled;

  const start = parseTimeToMinutes(document.getElementById("work-start-time")?.value);
  const end = parseTimeToMinutes(document.getElementById("work-end-time")?.value);
  if (start === null || end === null) return null;

  let endMinutes = end;
  if (endMinutes <= start) endMinutes += 24 * 60;

  const breakMinutes = getBreakMinutesForCalculation();
  if (breakMinutes === null) return null;

  const workMinutes = endMinutes - start - breakMinutes;
  if (workMinutes <= 0) return null;

  return workMinutes / 60;
}

/** 年間休日（日）と1日の所定労働時間から月平均所定労働時間を算出 */
function computeMonthlyScheduledHoursFromAnnualHolidays() {
  const annualRaw = trimValue(document.getElementById("annual-holiday-days")?.value);
  if (annualRaw === "") return null;

  const annualHolidays = parseInt(normalizeDigits(annualRaw), 10);
  if (isNaN(annualHolidays) || annualHolidays < 0 || annualHolidays >= DAYS_IN_YEAR) {
    return null;
  }

  const dailyHours = getDailyWorkHoursForCalculation();
  if (dailyHours === null || dailyHours <= 0) return null;

  const annualWorkDays = DAYS_IN_YEAR - annualHolidays;
  if (annualWorkDays <= 0) return null;

  const annualWorkHours = dailyHours * annualWorkDays;
  return Math.round((annualWorkHours / 12) * 10) / 10;
}

function applyMonthlyHoursFromAnnualHolidays() {
  const splitActive =
    document.getElementById("use-fixed-overtime")?.checked &&
    document.getElementById("use-salary-split")?.checked;
  const useComputed = document.getElementById("use-computed-monthly-hours")?.checked;
  const monthlyEl = document.getElementById("monthly-scheduled-hours");

  if (!monthlyEl) return;

  if (!splitActive || !useComputed) {
    monthlyEl.readOnly = false;
    return;
  }

  const computed = computeMonthlyScheduledHoursFromAnnualHolidays();
  if (computed !== null) {
    isApplyingSalarySplit = true;
    monthlyEl.value = formatHoursDisplay(computed);
    isApplyingSalarySplit = false;
  }
  monthlyEl.readOnly = true;
}

/**
 * 総支給額 G = 基本給 + 手当 + 固定残業代
 * 固定残業代 F = (基本給 + 割増基礎手当) / H × T × 1.25
 */
function computeSalarySplit() {
  const gross = parseYenAmount(document.getElementById("monthly-gross-split-target")?.value);
  let monthlyHours = parseHoursNumber(document.getElementById("monthly-scheduled-hours")?.value);
  const fixedHours = parseHoursNumber(document.getElementById("fixed-ot-hours")?.value);
  const useComputedMonthly = document.getElementById("use-computed-monthly-hours")?.checked;

  if (useComputedMonthly && monthlyHours === null) {
    const derived = computeMonthlyScheduledHoursFromAnnualHolidays();
    if (derived !== null) monthlyHours = derived;
  }

  if (gross === null || monthlyHours === null || fixedHours === null) {
    if (useComputedMonthly && gross !== null && fixedHours !== null) {
      return { ok: false, reason: "missing_annual_holiday_calc" };
    }
    return { ok: false, reason: "incomplete" };
  }

  const allowances = sumAllowancesByOtBase();
  const factor = 1 + (fixedHours * OT_PREMIUM_RATE) / monthlyHours;
  const otBaseTotal = (gross - allowances.excluded) / factor;
  const fixedOt = Math.round((otBaseTotal / monthlyHours) * fixedHours * OT_PREMIUM_RATE);
  const base = Math.round(otBaseTotal - allowances.included);

  if (base < 0) {
    return { ok: false, reason: "negative_base" };
  }

  let finalBase = base;
  let finalFixedOt = fixedOt;
  const roundTo100 = document.getElementById("round-base-to-100")?.checked;

  if (roundTo100) {
    finalBase = Math.floor(base / 100) * 100;
    finalFixedOt = gross - finalBase - allowances.included - allowances.excluded;
    if (finalFixedOt < 0) {
      return { ok: false, reason: "negative_fixed_ot" };
    }
  }

  const recomposed = finalBase + allowances.included + allowances.excluded + finalFixedOt;
  const hourlyOtBase = otBaseTotal / monthlyHours;

  let monthlyHoursMeta = null;
  if (useComputedMonthly) {
    const annualDays = parseInt(
      normalizeDigits(document.getElementById("annual-holiday-days")?.value ?? ""),
      10
    );
    const dailyHours = getDailyWorkHoursForCalculation();
    if (!isNaN(annualDays) && dailyHours !== null) {
      monthlyHoursMeta = {
        annualHolidays: annualDays,
        dailyHours: dailyHours,
        annualWorkDays: DAYS_IN_YEAR - annualDays,
      };
    }
  }

  return {
    ok: true,
    base: finalBase,
    fixedOt: finalFixedOt,
    otBaseTotal: Math.round(otBaseTotal),
    hourlyOtBase: hourlyOtBase,
    monthlyHours: monthlyHours,
    monthlyHoursMeta: monthlyHoursMeta,
    allowancesIncluded: allowances.included,
    allowancesExcluded: allowances.excluded,
    grossTarget: gross,
    recomposed: recomposed,
    roundingDiff: gross - recomposed,
    baseRoundedTo100: roundTo100,
    baseBeforeRound: roundTo100 ? base : null,
  };
}

function applySalarySplit() {
  const splitEnabled =
    document.getElementById("use-fixed-overtime")?.checked &&
    document.getElementById("use-salary-split")?.checked;

  const summaryEl = document.getElementById("salary-split-summary");
  const baseEl = document.getElementById("base-salary");
  const fixedAmountEl = document.getElementById("fixed-ot-amount");

  applyMonthlyHoursFromAnnualHolidays();

  if (!splitEnabled) {
    if (summaryEl) {
      summaryEl.hidden = true;
      summaryEl.textContent = "";
    }
    if (baseEl) baseEl.readOnly = false;
    if (fixedAmountEl) fixedAmountEl.readOnly = false;
    return;
  }

  if (baseEl) baseEl.readOnly = true;
  if (fixedAmountEl) fixedAmountEl.readOnly = true;

  const result = computeSalarySplit();
  if (!result.ok) {
    if (summaryEl) {
      summaryEl.hidden = false;
      if (result.reason === "negative_base") {
        summaryEl.textContent =
          "按分できません。割増基礎に含める手当が多すぎるか、総支給額が不足しています。";
      } else if (result.reason === "negative_fixed_ot") {
        summaryEl.textContent =
          "100円単位の切り下げ後、固定残業代がマイナスになります。総支給額または手当を見直してください。";
      } else if (result.reason === "missing_annual_holiday_calc") {
        summaryEl.textContent =
          "年間休日（日数）と1日の所定労働時間（始業・終業または所定労働時間欄）を入力してください。";
      } else {
        summaryEl.textContent = "総支給額・月所定労働時間・固定残業時間を入力してください。";
      }
    }
    return;
  }

  isApplyingSalarySplit = true;
  if (baseEl) baseEl.value = String(result.base);
  if (fixedAmountEl) fixedAmountEl.value = String(result.fixedOt);
  isApplyingSalarySplit = false;

  if (summaryEl) {
    summaryEl.hidden = false;
    let msg =
      "按分結果：基本給 " +
      formatYenPlain(result.base) +
      "円／固定残業代 " +
      formatYenPlain(result.fixedOt) +
      "円（割増基礎 " +
      formatYenPlain(result.otBaseTotal) +
      "円）";

    if (result.monthlyHoursMeta) {
      msg +=
        "／月平均所定 " +
        formatHoursDisplay(result.monthlyHours) +
        "時間（年間休日" +
        result.monthlyHoursMeta.annualHolidays +
        "日・1日" +
        formatHoursDisplay(result.monthlyHoursMeta.dailyHours) +
        "h・年間" +
        result.monthlyHoursMeta.annualWorkDays +
        "日より算出）";
    }

    msg +=
      "／時間単価（割増基礎） " + formatYenPlain(result.hourlyOtBase) + "円";

    if (result.baseRoundedTo100 && result.baseBeforeRound !== null) {
      msg +=
        " ※基本給を100円未満切り下げ（" +
        formatYenPlain(result.baseBeforeRound) +
        "円→" +
        formatYenPlain(result.base) +
        "円、差額は固定残業代に反映）";
    } else if (result.roundingDiff !== 0) {
      msg += " ※端数調整により合計との差 " + result.roundingDiff + "円";
    }
    summaryEl.textContent = msg;
  }
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

function formatTimeDisplay(text) {
  const mins = parseTimeToMinutes(text);
  if (mins === null) return "";
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return h + ":" + String(m).padStart(2, "0");
}

/** 休憩（分）入力から所定労働時間の計算用分数を取り出す */
function parseBreakMinutesFromInput(text) {
  const s = trimValue(text);
  if (s === "") return 0;

  const minutesMatch = s.match(/^(\d+)\s*分$/);
  if (minutesMatch) return parseInt(minutesMatch[1], 10);

  const hoursMatch = s.match(/^(\d+)\s*時間(?:\s*(\d+)\s*分)?$/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    const minutes = hoursMatch[2] ? parseInt(hoursMatch[2], 10) : 0;
    return hours * 60 + minutes;
  }

  if (/^\d+$/.test(s)) return parseInt(s, 10);

  return null;
}

/** 所定労働時間の計算用（分）。未入力・不正時は null */
function getBreakMinutesForCalculation() {
  if (getRadioValue("break-mode") === "range") {
    const start = parseTimeToMinutes(document.getElementById("break-start-time")?.value);
    const end = parseTimeToMinutes(document.getElementById("break-end-time")?.value);
    if (start === null || end === null) return null;
    let endMinutes = end;
    if (endMinutes <= start) endMinutes += 24 * 60;
    return endMinutes - start;
  }

  return parseBreakMinutesFromInput(document.getElementById("break-minutes")?.value);
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

  const breakMinutes = getBreakMinutesForCalculation();
  if (breakMinutes === null) return;

  const workMinutes = endMinutes - start - breakMinutes;
  if (workMinutes <= 0) {
    scheduledEl.value = "";
    return;
  }

  scheduledEl.value = "1日" + formatDurationMinutes(workMinutes);
}

/** 休憩 → 通知書用の表示（分 or 時刻帯）。入力内容をそのまま反映 */
function getBreakDisplayText() {
  if (getRadioValue("break-mode") === "range") {
    const startRaw = trimValue(document.getElementById("break-start-time")?.value);
    const endRaw = trimValue(document.getElementById("break-end-time")?.value);
    if (startRaw === "" && endRaw === "") return null;

    const startText = formatTimeDisplay(startRaw) || startRaw;
    const endText = formatTimeDisplay(endRaw) || endRaw;
    if (startRaw !== "" && endRaw !== "") return startText + "〜" + endText;
    return startRaw !== "" ? startText : endText;
  }

  const raw = trimValue(document.getElementById("break-minutes")?.value);
  if (raw === "") return null;
  return raw;
}

function collectAllowanceDraft() {
  const items = [];
  document.querySelectorAll("#allowance-rows .allowance-row").forEach(function (row) {
    items.push({
      name: row.querySelector(".allowance-name")?.value ?? "",
      amount: row.querySelector(".allowance-amount")?.value ?? "",
      inOtBase: !!row.querySelector(".allowance-in-ot-base")?.checked,
    });
  });
  return items;
}

function collectDraft() {
  const fields = {};
  Object.keys(PLACEHOLDERS).forEach(function (key) {
    const id = PLACEHOLDERS[key].inputId;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el || el.type === "checkbox" || el.type === "radio") return;
    fields[id] = el.value;
  });

  DRAFT_EXTRA_FIELD_IDS.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) fields[id] = el.value;
  });

  const checkboxes = {};
  DRAFT_CHECKBOX_IDS.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) checkboxes[id] = el.checked;
  });

  return {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    contractType: getRadioValue("contract-type"),
    breakMode: getRadioValue("break-mode"),
    checkboxes: checkboxes,
    fields: fields,
    allowances: collectAllowanceDraft(),
  };
}

function setAllowanceRows(items) {
  const list = document.getElementById("allowance-rows");
  if (!list) return;

  list.innerHTML = "";
  const rows =
    items && items.length > 0
      ? items
      : [
          { name: "", amount: "" },
          { name: "", amount: "" },
        ];

  rows.forEach(function (item) {
    const inOtBase =
      item.inOtBase === undefined ? undefined : !!item.inOtBase;
    list.appendChild(createAllowanceRow(item.name || "", item.amount || "", inOtBase));
  });
}

function applyDraft(data) {
  if (!data || data.version !== STORAGE_VERSION) return false;

  migrateCommuteDraftFields(data);

  if (data.contractType) {
    const radio = document.querySelector(
      'input[name="contract-type"][value="' + data.contractType + '"]'
    );
    if (radio) radio.checked = true;
  }

  if (data.breakMode) {
    const breakRadio = document.querySelector(
      'input[name="break-mode"][value="' + data.breakMode + '"]'
    );
    if (breakRadio) breakRadio.checked = true;
  }

  if (data.checkboxes) {
    DRAFT_CHECKBOX_IDS.forEach(function (id) {
      if (!Object.prototype.hasOwnProperty.call(data.checkboxes, id)) return;
      const el = document.getElementById(id);
      if (el) el.checked = !!data.checkboxes[id];
    });
  }

  if (data.fields) {
    Object.keys(data.fields).forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el.type !== "checkbox" && el.type !== "radio") {
        el.value = data.fields[id] ?? "";
      }
    });
  }

  if (data.allowances) {
    setAllowanceRows(data.allowances);
  }

  const minWagePref = document.getElementById("min-wage-prefecture");
  if (minWagePref && trimValue(minWagePref.value) !== "") {
    minWagePref.dataset.userSelected = "true";
  }

  return true;
}

function formatSavedAt(iso) {
  if (!iso) return "自動保存しました";
  const saved = new Date(iso);
  if (isNaN(saved.getTime())) return "自動保存しました";

  const diff = Date.now() - saved.getTime();
  if (diff < 60 * 1000) return "たった今自動保存";
  if (diff < 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 1000)) + "分前に自動保存";
  }

  return (
    saved.toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + "に自動保存"
  );
}

function setDraftStatus(message, className) {
  const el = document.getElementById("draft-status");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("is-restored", "is-error");
  if (className) el.classList.add(className);
}

function persistDraft() {
  try {
    const draft = collectDraft();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setDraftStatus(formatSavedAt(draft.savedAt));
    return true;
  } catch (err) {
    setDraftStatus("自動保存に失敗しました（ブラウザの保存容量等）", "is-error");
    return false;
  }
}

function scheduleSave() {
  if (isRestoringDraft) return;
  if (skipSaveOnce) {
    skipSaveOnce = false;
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistDraft, SAVE_DEBOUNCE_MS);
}

function loadDraftFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    isRestoringDraft = true;
    const ok = applyDraft(data);
    isRestoringDraft = false;

    if (ok) {
      skipSaveOnce = true;
      setDraftStatus("前回の入力を復元しました（" + formatSavedAt(data.savedAt) + "）", "is-restored");
      applyPlaceholders();
    }
    return ok;
  } catch (err) {
    isRestoringDraft = false;
    return false;
  }
}

function exportDraftFile() {
  const draft = collectDraft();
  const blob = new Blob([JSON.stringify(draft, null, 2)], {
    type: "application/json",
  });
  const worker = trimValue(draft.fields["worker-name"]);
  const date = new Date().toISOString().slice(0, 10);
  const base = worker ? "労働条件通知書-" + worker + "-" + date : "労働条件通知書-下書き-" + date;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = base + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  persistDraft();
  setDraftStatus("ファイルに保存しました（" + formatSavedAt(draft.savedAt) + "）");
}

function initDraftPersistence() {
  const exportBtn = document.getElementById("export-draft-btn");
  const importBtn = document.getElementById("import-draft-btn");
  const importFile = document.getElementById("import-draft-file");
  const clearBtn = document.getElementById("clear-draft-btn");

  if (exportBtn) {
    exportBtn.addEventListener("click", exportDraftFile);
  }

  if (importBtn && importFile) {
    importBtn.addEventListener("click", function () {
      importFile.click();
    });
    importFile.addEventListener("change", function () {
      const file = importFile.files && importFile.files[0];
      importFile.value = "";
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result);
          isRestoringDraft = true;
          const ok = applyDraft(data);
          isRestoringDraft = false;
          if (!ok) {
            setDraftStatus("ファイルの形式が正しくありません", "is-error");
            return;
          }
          skipSaveOnce = true;
          sanitizeNameField("worker-name");
          initDocumentDateDefaults();
          applyPlaceholders();
          persistDraft();
          setDraftStatus("ファイルから読み込みしました（" + formatSavedAt(data.savedAt) + "）", "is-restored");
        } catch (err) {
          isRestoringDraft = false;
          setDraftStatus("ファイルの読み込みに失敗しました", "is-error");
        }
      };
      reader.readAsText(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (!window.confirm("このブラウザに保存した下書きを消去し、ページを初期状態に戻しますか？")) {
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }
}

function createAllowanceRow(name, amount, inOtBase) {
  const row = document.createElement("div");
  row.className = "allowance-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "allowance-name";
  nameInput.placeholder = "手当名（例：役職手当）";
  nameInput.value = name || "";

  const amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.className = "allowance-amount";
  amountInput.placeholder = "金額（円）";
  amountInput.value = amount || "";

  const otBaseLabel = document.createElement("label");
  otBaseLabel.className = "allowance-ot-base-label";
  otBaseLabel.title = "割増賃金の計算の基礎に含める";

  const otBaseInput = document.createElement("input");
  otBaseInput.type = "checkbox";
  otBaseInput.className = "allowance-in-ot-base";
  otBaseInput.checked =
    inOtBase !== undefined ? inOtBase : suggestAllowanceInOtBase(nameInput.value);

  otBaseLabel.appendChild(otBaseInput);
  otBaseLabel.appendChild(document.createTextNode("基礎"));

  nameInput.addEventListener("input", function () {
    otBaseInput.checked = suggestAllowanceInOtBase(nameInput.value);
    applyPlaceholders();
  });

  amountInput.addEventListener("input", applyPlaceholders);
  otBaseInput.addEventListener("change", applyPlaceholders);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-allowance-btn";
  removeBtn.textContent = "削除";
  removeBtn.addEventListener("click", function () {
    row.remove();
    applyPlaceholders();
    scheduleSave();
  });

  row.appendChild(nameInput);
  row.appendChild(amountInput);
  row.appendChild(otBaseLabel);
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

  const isFixed = getRadioValue("contract-type") === "fixed";
  document.querySelectorAll(".contract-2024-only, .contract-fixed-only").forEach(function (el) {
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

  const useSalarySplit = document.getElementById("use-salary-split")?.checked;
  const splitPanel = document.getElementById("salary-split-panel");
  if (splitPanel) splitPanel.hidden = !useFixedOt || !useSalarySplit;

  const splitCheckboxWrap = document.getElementById("use-salary-split-wrap");
  if (splitCheckboxWrap) splitCheckboxWrap.hidden = !useFixedOt;

  const useComputedMonthly = document.getElementById("use-computed-monthly-hours")?.checked;
  const computedMonthlyWrap = document.getElementById("use-computed-monthly-hours-wrap");
  if (computedMonthlyWrap) {
    computedMonthlyWrap.hidden = !useFixedOt || !useSalarySplit;
  }
  const monthlyHoursHint = document.getElementById("monthly-hours-manual-hint");
  if (monthlyHoursHint) {
    monthlyHoursHint.hidden = useComputedMonthly && useFixedOt && useSalarySplit;
  }

  const useProbation = document.getElementById("use-probation")?.checked;
  const probationForm = document.getElementById("probation-form");
  if (probationForm) probationForm.hidden = !useProbation;
  document.querySelectorAll(".probation-only").forEach(function (el) {
    el.hidden = !useProbation;
  });

  const breakByRange = getRadioValue("break-mode") === "range";
  const breakMinutesForm = document.getElementById("break-minutes-form");
  const breakRangeForm = document.getElementById("break-range-form");
  if (breakMinutesForm) breakMinutesForm.hidden = breakByRange;
  if (breakRangeForm) breakRangeForm.hidden = !breakByRange;
}

function collectValues() {
  const values = {};
  Object.keys(PLACEHOLDERS).forEach(function (key) {
    const inputId = PLACEHOLDERS[key].inputId;
    if (!inputId) return;
    values[key] = readInput(inputId);
  });

  if (getRadioValue("contract-type") !== "fixed") {
    values.契約期間 = null;
    values.更新上限 = null;
    values.無期転換申込 = null;
    values.無期転換後条件 = null;
  }

  if (!document.getElementById("use-probation")?.checked) {
    values.試用期間 = null;
    values.試用期間中の労働条件 = null;
    values.本採用判断基準 = null;
  }

  values.交通費 = formatCommuteExpenseDisplay();
  values.休憩時間 = getBreakDisplayText();

  const gross = computeMonthlyGrossTotal();
  values.月給支給総額 = gross === null ? null : formatYenComma(String(gross));

  return values;
}

function applyPlaceholders() {
  updateScheduledHoursFromTimes();
  syncUiOptions();
  applySalarySplit();

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

  const grossDisplay = document.getElementById("monthly-gross-display");
  if (grossDisplay) {
    grossDisplay.textContent =
      values.月給支給総額 === null ? EMPTY : values.月給支給総額;
  }

  const systemLine = document.getElementById("work-hours-system-line");
  const systemText = trimValue(values.労働時間制度 ?? "");
  if (systemLine) {
    systemLine.hidden = systemText === "";
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

  if (typeof window.updateMinimumWageCheck === "function") {
    window.updateMinimumWageCheck();
  }

  scheduleSave();
}

function initDocumentDateDefaults() {
  const y = document.getElementById("document-year");
  const m = document.getElementById("document-month");
  const d = document.getElementById("document-day");
  if (!y || !m || !d) return;

  const now = new Date();
  if (trimValue(y.value) === "") y.value = String(now.getFullYear());
  if (trimValue(m.value) === "") m.value = String(now.getMonth() + 1);
  if (trimValue(d.value) === "") d.value = String(now.getDate());
}

function initAllowances() {
  const list = document.getElementById("allowance-rows");
  const addBtn = document.getElementById("add-allowance-btn");
  if (!list) return;

  setAllowanceRows(null);

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      list.appendChild(createAllowanceRow("", ""));
      list.lastElementChild?.querySelector(".allowance-name")?.focus();
      applyPlaceholders();
    });
  }

}

function init() {
  const form = document.getElementById("input-form");
  const printBtn = document.getElementById("print-btn");

  initAllowances();
  if (typeof window.initMinimumWageCheck === "function") {
    window.initMinimumWageCheck();
  }
  loadDraftFromStorage();
  initDocumentDateDefaults();
  sanitizeNameField("worker-name");
  initDraftPersistence();

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

window.laborNoticeApp = {
  applyPlaceholders: applyPlaceholders,
  getDownloadBaseName: function () {
    const worker = trimValue(document.getElementById("worker-name")?.value);
    const date = new Date().toISOString().slice(0, 10);
    return worker
      ? "労働条件通知書-" + worker + "-" + date
      : "労働条件通知書-" + date;
  },
};
