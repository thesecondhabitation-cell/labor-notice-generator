/**
 * 地域別最低賃金チェック（入力支援・通知書には出力しない）
 * データ: 2025年度（令和7年度）地域別最低賃金
 */
(function () {
  const FISCAL_YEAR_LABEL = "2025年度（令和7年度）";
  const REFERENCE_URL =
    "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_rousai/rousai_koyou/minimumichiran_r7/";

  const PREFECTURES = [
    { id: "北海道", name: "北海道", hourly: 1075 },
    { id: "青森県", name: "青森県", hourly: 1029 },
    { id: "岩手県", name: "岩手県", hourly: 1031 },
    { id: "宮城県", name: "宮城県", hourly: 1038 },
    { id: "秋田県", name: "秋田県", hourly: 1031 },
    { id: "山形県", name: "山形県", hourly: 1032 },
    { id: "福島県", name: "福島県", hourly: 1033 },
    { id: "茨城県", name: "茨城県", hourly: 1074 },
    { id: "栃木県", name: "栃木県", hourly: 1068 },
    { id: "群馬県", name: "群馬県", hourly: 1063 },
    { id: "埼玉県", name: "埼玉県", hourly: 1141 },
    { id: "千葉県", name: "千葉県", hourly: 1140 },
    { id: "東京都", name: "東京都", hourly: 1226 },
    { id: "神奈川県", name: "神奈川県", hourly: 1225 },
    { id: "新潟県", name: "新潟県", hourly: 1050 },
    { id: "富山県", name: "富山県", hourly: 1062 },
    { id: "石川県", name: "石川県", hourly: 1054 },
    { id: "福井県", name: "福井県", hourly: 1053 },
    { id: "山梨県", name: "山梨県", hourly: 1052 },
    { id: "長野県", name: "長野県", hourly: 1061 },
    { id: "岐阜県", name: "岐阜県", hourly: 1065 },
    { id: "静岡県", name: "静岡県", hourly: 1097 },
    { id: "愛知県", name: "愛知県", hourly: 1140 },
    { id: "三重県", name: "三重県", hourly: 1087 },
    { id: "滋賀県", name: "滋賀県", hourly: 1080 },
    { id: "京都府", name: "京都府", hourly: 1122 },
    { id: "大阪府", name: "大阪府", hourly: 1177 },
    { id: "兵庫県", name: "兵庫県", hourly: 1116 },
    { id: "奈良県", name: "奈良県", hourly: 1051 },
    { id: "和歌山県", name: "和歌山県", hourly: 1045 },
    { id: "鳥取県", name: "鳥取県", hourly: 1030 },
    { id: "島根県", name: "島根県", hourly: 1033 },
    { id: "岡山県", name: "岡山県", hourly: 1047 },
    { id: "広島県", name: "広島県", hourly: 1085 },
    { id: "山口県", name: "山口県", hourly: 1043 },
    { id: "徳島県", name: "徳島県", hourly: 1046 },
    { id: "香川県", name: "香川県", hourly: 1036 },
    { id: "愛媛県", name: "愛媛県", hourly: 1033 },
    { id: "高知県", name: "高知県", hourly: 1023 },
    { id: "福岡県", name: "福岡県", hourly: 1057 },
    { id: "佐賀県", name: "佐賀県", hourly: 1030 },
    { id: "長崎県", name: "長崎県", hourly: 1031 },
    { id: "熊本県", name: "熊本県", hourly: 1034 },
    { id: "大分県", name: "大分県", hourly: 1035 },
    { id: "宮崎県", name: "宮崎県", hourly: 1023 },
    { id: "鹿児島県", name: "鹿児島県", hourly: 1026 },
    { id: "沖縄県", name: "沖縄県", hourly: 1023 },
  ];

  const PREFECTURE_ALIASES = [
    { id: "北海道", patterns: ["北海道"] },
    { id: "青森県", patterns: ["青森"] },
    { id: "岩手県", patterns: ["岩手"] },
    { id: "宮城県", patterns: ["宮城"] },
    { id: "秋田県", patterns: ["秋田"] },
    { id: "山形県", patterns: ["山形"] },
    { id: "福島県", patterns: ["福島"] },
    { id: "茨城県", patterns: ["茨城"] },
    { id: "栃木県", patterns: ["栃木"] },
    { id: "群馬県", patterns: ["群馬"] },
    { id: "埼玉県", patterns: ["埼玉"] },
    { id: "千葉県", patterns: ["千葉"] },
    { id: "東京都", patterns: ["東京都", "東京"] },
    { id: "神奈川県", patterns: ["神奈川"] },
    { id: "新潟県", patterns: ["新潟"] },
    { id: "富山県", patterns: ["富山"] },
    { id: "石川県", patterns: ["石川"] },
    { id: "福井県", patterns: ["福井"] },
    { id: "山梨県", patterns: ["山梨"] },
    { id: "長野県", patterns: ["長野"] },
    { id: "岐阜県", patterns: ["岐阜"] },
    { id: "静岡県", patterns: ["静岡"] },
    { id: "愛知県", patterns: ["愛知"] },
    { id: "三重県", patterns: ["三重"] },
    { id: "滋賀県", patterns: ["滋賀"] },
    { id: "京都府", patterns: ["京都府", "京都"] },
    { id: "大阪府", patterns: ["大阪府", "大阪"] },
    { id: "兵庫県", patterns: ["兵庫"] },
    { id: "奈良県", patterns: ["奈良"] },
    { id: "和歌山県", patterns: ["和歌山"] },
    { id: "鳥取県", patterns: ["鳥取"] },
    { id: "島根県", patterns: ["島根"] },
    { id: "岡山県", patterns: ["岡山"] },
    { id: "広島県", patterns: ["広島"] },
    { id: "山口県", patterns: ["山口"] },
    { id: "徳島県", patterns: ["徳島", "德島"] },
    { id: "香川県", patterns: ["香川"] },
    { id: "愛媛県", patterns: ["愛媛"] },
    { id: "高知県", patterns: ["高知"] },
    { id: "福岡県", patterns: ["福岡"] },
    { id: "佐賀県", patterns: ["佐賀"] },
    { id: "長崎県", patterns: ["長崎"] },
    { id: "熊本県", patterns: ["熊本"] },
    { id: "大分県", patterns: ["大分"] },
    { id: "宮崎県", patterns: ["宮崎"] },
    { id: "鹿児島県", patterns: ["鹿児島", "鹿児"] },
    { id: "沖縄県", patterns: ["沖縄"] },
  ];

  /** 手当名に含まれると除外寄りに判定するキーワード（優先） */
  const ALLOWANCE_EXCLUSION_KEYWORDS = [
    { keyword: "時間外", reason: "時間外労働に対応する手当" },
    { keyword: "固定残業", reason: "固定残業代" },
    { keyword: "深夜", reason: "深夜労働に対応する手当" },
    { keyword: "休日", reason: "休日労働に対応する手当" },
    { keyword: "通勤", reason: "通勤に対応する手当" },
    { keyword: "交通", reason: "通勤・交通に対応する手当" },
    { keyword: "家族", reason: "家族に対応する手当" },
    { keyword: "扶養", reason: "扶養に対応する手当" },
    { keyword: "住宅", reason: "住宅に対応する手当" },
    { keyword: "臨時", reason: "臨時の支給" },
    { keyword: "賞与", reason: "賞与" },
    { keyword: "インセンティブ", reason: "成果連動の支給" },
    { keyword: "歩合", reason: "成果連動の支給" },
  ];

  /** 除外とみなす手当名パターン */
  const ALLOWANCE_EXCLUDED_PATTERNS = [
    { pattern: "残業代", reason: "時間外労働に対応する賃金" },
    { pattern: "子ども", reason: "家族・扶養に対応する手当" },
    { pattern: "児童", reason: "家族・扶養に対応する手当" },
    { pattern: "皆勤", reason: "勤怠条件付きの手当" },
    { pattern: "精勤", reason: "勤怠条件付きの手当" },
    { pattern: "ボーナス", reason: "賞与" },
    { pattern: "呼出", reason: "時間外・随時呼出に対応する手当" },
  ];

  /** 対象とみなす手当名パターン（除外キーワードより後に評価） */
  const ALLOWANCE_INCLUDED_PATTERNS = [
    { pattern: "役職", reason: "通常の労働に対する手当" },
    { pattern: "職務", reason: "通常の労働に対する手当" },
    { pattern: "資格", reason: "通常の労働に対する手当" },
    { pattern: "技能", reason: "通常の労働に対する手当" },
    { pattern: "調整", reason: "通常の労働に対する手当" },
    { pattern: "処遇改善", reason: "通常の労働に対する手当" },
    { pattern: "ベースアップ", reason: "通常の労働に対する手当" },
    { pattern: "地域", reason: "通常の労働に対する手当" },
  ];

  function trimValue(value) {
    return (value || "").trim();
  }

  function parseYenAmount(text) {
    const digits = trimValue(text).replace(/[^\d]/g, "");
    if (digits === "") return null;
    const n = parseInt(digits, 10);
    return isNaN(n) ? null : n;
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

  function getBreakMinutesForCalculation() {
    const breakMode = document.querySelector('input[name="break-mode"]:checked')?.value;
    if (breakMode === "range") {
      const start = parseTimeToMinutes(document.getElementById("break-start-time")?.value);
      const end = parseTimeToMinutes(document.getElementById("break-end-time")?.value);
      if (start === null || end === null) return null;
      let endMinutes = end;
      if (endMinutes <= start) endMinutes += 24 * 60;
      return endMinutes - start;
    }
    return parseBreakMinutesFromInput(document.getElementById("break-minutes")?.value);
  }

  function parseDailyWorkMinutesFromScheduled(text) {
    const s = trimValue(text);
    if (s === "") return null;

    let m = s.match(/1\s*日\s*(\d+)\s*時間(?:\s*(\d+)\s*分)?/);
    if (m) {
      const hours = parseInt(m[1], 10);
      const minutes = m[2] ? parseInt(m[2], 10) : 0;
      return hours * 60 + minutes;
    }

    m = s.match(/^(\d+)\s*時間(?:\s*(\d+)\s*分)?$/);
    if (m) {
      const hours = parseInt(m[1], 10);
      const minutes = m[2] ? parseInt(m[2], 10) : 0;
      return hours * 60 + minutes;
    }

    return null;
  }

  function parseDailyWorkMinutesFromTimes() {
    const start = parseTimeToMinutes(document.getElementById("work-start-time")?.value);
    const end = parseTimeToMinutes(document.getElementById("work-end-time")?.value);
    if (start === null || end === null) return null;

    let endMinutes = end;
    if (endMinutes <= start) endMinutes += 24 * 60;

    const breakMinutes = getBreakMinutesForCalculation();
    if (breakMinutes === null) return null;

    const workMinutes = endMinutes - start - breakMinutes;
    return workMinutes > 0 ? workMinutes : null;
  }

  function parseWorkDaysPerWeek(text) {
    const s = trimValue(text).replace(/[～〜~\-－—]/g, "〜");
    if (s === "") return null;

    const weekMatch = s.match(/週\s*([0-9０-９]+)\s*日/);
    if (weekMatch) {
      const n = parseInt(weekMatch[1].replace(/[０-９]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
      }), 10);
      if (n >= 1 && n <= 7) return n;
    }

    if (/毎日|週7日|7日/.test(s)) return 7;

    const dayChars = ["月", "火", "水", "木", "金", "土", "日"];
    const rangeMatch = s.match(/([月火水木金土日])[^月火水木金土日]*〜[^月火水木金土日]*([月火水木金土日])/);
    if (rangeMatch) {
      const startIdx = dayChars.indexOf(rangeMatch[1]);
      const endIdx = dayChars.indexOf(rangeMatch[2]);
      if (startIdx >= 0 && endIdx >= 0) {
        return endIdx >= startIdx ? endIdx - startIdx + 1 : 7 - startIdx + endIdx + 1;
      }
    }

    const found = dayChars.filter(function (day) {
      return s.includes(day);
    });
    if (found.length >= 2) return found.length;
    if (found.length === 1) return 1;

    return null;
  }

  function formatHoursMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return hours + "時間";
    return hours + "時間" + minutes + "分";
  }

  function formatYen(n) {
    return Math.round(n).toLocaleString("ja-JP");
  }

  function formatHourly(n) {
    return n.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function getPrefectureById(id) {
    return PREFECTURES.find(function (p) {
      return p.id === id;
    });
  }

  function guessPrefectureFromText(text) {
    const normalized = trimValue(text);
    if (normalized === "") return null;

    let matched = null;
    PREFECTURE_ALIASES.forEach(function (entry) {
      entry.patterns.forEach(function (pattern) {
        if (normalized.includes(pattern)) {
          if (!matched || pattern.length > matched.pattern.length) {
            matched = { id: entry.id, pattern: pattern };
          }
        }
      });
    });

    return matched ? matched.id : null;
  }

  function tryAutoSelectPrefecture() {
    const select = document.getElementById("min-wage-prefecture");
    if (!select || select.dataset.userSelected === "true") return;

    const text = [
      document.getElementById("work-location")?.value,
      document.getElementById("employer-address")?.value,
    ].join(" ");

    const guessed = guessPrefectureFromText(text);
    if (guessed) select.value = guessed;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeAllowanceName(name) {
    return trimValue(name).replace(/\s+/g, "");
  }

  /** @returns {{ category: "included"|"excluded"|"review", reason: string }} */
  function classifyAllowanceName(name) {
    const normalized = normalizeAllowanceName(name);
    if (normalized === "") {
      return { category: "review", reason: "手当名が未入力のため判定できません" };
    }

    let match;
    match = ALLOWANCE_EXCLUSION_KEYWORDS.find(function (entry) {
      return normalized.includes(entry.keyword);
    });
    if (match) return { category: "excluded", reason: match.reason };

    match = ALLOWANCE_EXCLUDED_PATTERNS.find(function (entry) {
      return normalized.includes(entry.pattern);
    });
    if (match) return { category: "excluded", reason: match.reason };

    match = ALLOWANCE_INCLUDED_PATTERNS.find(function (entry) {
      return normalized.includes(entry.pattern);
    });
    if (match) return { category: "included", reason: match.reason };

    return {
      category: "review",
      reason: "手当名から対象・除外を自動判定できませんでした",
    };
  }

  function formatItemAmount(amount) {
    if (amount === null || amount === undefined) return "（金額なし）";
    return formatYen(amount) + "円";
  }

  function collectWageComponents() {
    const included = [];
    const excluded = [];
    const review = [];

    const baseSalary = parseYenAmount(document.getElementById("base-salary")?.value);
    if (baseSalary !== null) {
      included.push({
        label: "基本給",
        amount: baseSalary,
        reason: "通常の労働時間・労働日に対応する賃金",
      });
    }

    document.querySelectorAll("#allowance-rows .allowance-row").forEach(function (row) {
      const name = trimValue(row.querySelector(".allowance-name")?.value);
      const amount = parseYenAmount(row.querySelector(".allowance-amount")?.value);
      if (name === "" && amount === null) return;

      const label = name || "（名称未入力）";
      const classification = classifyAllowanceName(name);
      const item = {
        label: label,
        amount: amount,
        reason: classification.reason,
      };

      if (classification.category === "included") {
        if (amount !== null) {
          included.push(item);
        } else {
          review.push({
            label: label,
            amount: null,
            reason: "対象手当ですが金額が未入力のため判定に含めていません",
          });
        }
      } else if (classification.category === "excluded") {
        excluded.push(item);
      } else {
        review.push(item);
      }
    });

    if (document.getElementById("use-fixed-overtime")?.checked) {
      const fixedAmount = parseYenAmount(document.getElementById("fixed-ot-amount")?.value);
      excluded.push({
        label: "固定残業代",
        amount: fixedAmount,
        reason: "時間外労働に対応する賃金のため対象外",
      });
    }

    return { included: included, excluded: excluded, review: review, baseSalary: baseSalary };
  }

  function renderBreakdownGroup(title, items, listClass) {
    if (!items.length) return "";

    const listHtml = items
      .map(function (item) {
        let amountText = formatItemAmount(item.amount);
        if (item.amount === null && item.note) {
          amountText = escapeHtml(item.note);
        }
        return (
          "<li>" +
          '<span class="min-wage-item-name">' +
          escapeHtml(item.label) +
          "</span> " +
          '<span class="min-wage-item-amount">' +
          amountText +
          "</span>" +
          (item.reason
            ? '<span class="min-wage-item-reason">（' + escapeHtml(item.reason) + "）</span>"
            : "") +
          "</li>"
        );
      })
      .join("");

    return (
      '<div class="min-wage-check-group">' +
      '<p class="min-wage-check-group-title">' +
      escapeHtml(title) +
      "</p>" +
      '<ul class="min-wage-check-breakdown ' +
      listClass +
      '">' +
      listHtml +
      "</ul></div>"
    );
  }

  function runMinimumWageCheck() {
    tryAutoSelectPrefecture();

    const prefectureId = document.getElementById("min-wage-prefecture")?.value ?? "";
    const prefecture = getPrefectureById(prefectureId);
    const wageComponents = collectWageComponents();

    const dailyMinutes =
      parseDailyWorkMinutesFromScheduled(document.getElementById("scheduled-hours")?.value) ??
      parseDailyWorkMinutesFromTimes();

    const daysPerWeek =
      parseWorkDaysPerWeek(document.getElementById("work-days")?.value) ?? 5;

    const missing = [];
    if (!prefecture) missing.push("最低賃金の地域");
    if (wageComponents.baseSalary === null) missing.push("基本給");
    if (dailyMinutes === null) missing.push("1日の所定労働時間（始業・終業・休憩、または所定労働時間）");

    if (missing.length > 0) {
      return {
        status: "incomplete",
        missing: missing,
        wageComponents: wageComponents,
      };
    }

    const eligibleMonthly = wageComponents.included.reduce(function (sum, item) {
      return sum + (item.amount || 0);
    }, 0);

    const dailyHours = dailyMinutes / 60;
    const monthlyHours = dailyHours * daysPerWeek * (52 / 12);
    const computedHourly = eligibleMonthly / monthlyHours;
    const minHourly = prefecture.hourly;
    const requiredMonthly = minHourly * monthlyHours;
    const shortfallMonthly = requiredMonthly - eligibleMonthly;
    const shortfallHourly = minHourly - computedHourly;
    const isOk = computedHourly >= minHourly;

    const daysNote =
      parseWorkDaysPerWeek(document.getElementById("work-days")?.value) === null
        ? "（勤務日未入力のため週5日で試算）"
        : "";

    return {
      status: isOk ? "ok" : "error",
      hasReview: wageComponents.review.length > 0,
      prefecture: prefecture,
      wageComponents: wageComponents,
      eligibleMonthly: eligibleMonthly,
      dailyMinutes: dailyMinutes,
      daysPerWeek: daysPerWeek,
      daysNote: daysNote,
      monthlyHours: monthlyHours,
      computedHourly: computedHourly,
      minHourly: minHourly,
      requiredMonthly: requiredMonthly,
      shortfallMonthly: shortfallMonthly,
      shortfallHourly: shortfallHourly,
    };
  }

  function renderMinimumWageCheck(result) {
    const container = document.getElementById("min-wage-check-result");
    if (!container) return;

    let className = "min-wage-check-result min-wage-check-result--" + result.status;
    if (result.hasReview) className += " min-wage-check-result--has-review";
    container.className = className;

    const breakdownHtml = result.wageComponents
      ? renderBreakdownGroup(
          "最低賃金チェックに含めた手当",
          result.wageComponents.included,
          "min-wage-check-breakdown--included"
        ) +
        renderBreakdownGroup(
          "除外した手当",
          result.wageComponents.excluded,
          "min-wage-check-breakdown--excluded"
        ) +
        renderBreakdownGroup(
          "要確認の手当",
          result.wageComponents.review,
          "min-wage-check-breakdown--review"
        )
      : "";

    if (result.status === "incomplete") {
      container.innerHTML =
        '<p class="min-wage-check-summary">チェックに必要な入力が不足しています。</p>' +
        '<ul class="min-wage-check-list">' +
        result.missing
          .map(function (item) {
            return "<li>" + escapeHtml(item) + "</li>";
          })
          .join("") +
        "</ul>" +
        breakdownHtml;
      return;
    }

    const reviewWarning = result.hasReview
      ? '<p class="min-wage-check-review-warning">要確認の手当は判定額に含めていません。支給の実態を確認してください。</p>'
      : "";

    const verdict =
      result.status === "ok"
        ? '<p class="min-wage-check-verdict min-wage-check-verdict--ok">最低賃金を上回っています</p>'
        : '<p class="min-wage-check-verdict min-wage-check-verdict--error">最低賃金を下回る可能性があります</p>';

    const shortfallBlock =
      result.status === "error"
        ? '<p class="min-wage-check-shortfall">不足目安：時給換算で約' +
          formatHourly(result.shortfallHourly) +
          "円／月額で約" +
          formatYen(result.shortfallMonthly) +
          "円</p>"
        : "";

    container.innerHTML =
      verdict +
      reviewWarning +
      breakdownHtml +
      '<dl class="min-wage-check-details">' +
      "<dt>対象賃金の合計（月額）</dt><dd>" +
      formatYen(result.eligibleMonthly) +
      "円</dd>" +
      "<dt>換算時給（対象賃金ベース）</dt><dd>" +
      formatHourly(result.computedHourly) +
      "円</dd>" +
      "<dt>地域別最低賃金（" +
      escapeHtml(result.prefecture.name) +
      "）</dt><dd>" +
      formatYen(result.minHourly) +
      "円</dd>" +
      "<dt>月間所定労働時間</dt><dd>" +
      formatHourly(result.monthlyHours) +
      "時間（1日" +
      formatHoursMinutes(result.dailyMinutes) +
      " × 週" +
      result.daysPerWeek +
      "日 × 52週 ÷ 12ヶ月" +
      result.daysNote +
      "）</dd>" +
      "<dt>最低賃金相当の月額</dt><dd>約" +
      formatYen(result.requiredMonthly) +
      "円</dd>" +
      "</dl>" +
      shortfallBlock;
  }

  function updateMinimumWageCheck() {
    renderMinimumWageCheck(runMinimumWageCheck());
  }

  function initMinimumWageCheck() {
    const select = document.getElementById("min-wage-prefecture");
    if (!select || select.options.length > 1) return;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "選択してください（就業場所から自動推定）";
    select.appendChild(placeholder);

    PREFECTURES.forEach(function (pref) {
      const option = document.createElement("option");
      option.value = pref.id;
      option.textContent = pref.name + "（" + pref.hourly.toLocaleString("ja-JP") + "円）";
      select.appendChild(option);
    });

    select.addEventListener("change", function () {
      select.dataset.userSelected = "true";
      updateMinimumWageCheck();
    });
  }

  window.updateMinimumWageCheck = updateMinimumWageCheck;
  window.initMinimumWageCheck = initMinimumWageCheck;
})();
