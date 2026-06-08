/**
 * 労働条件通知書の Word 書き出し
 * プレビュー（#notice-document）の DOM をそのまま HTML 化し、Word で開ける形式で保存します。
 */

const WORD_HTML_STYLES =
  "body{margin:0;}" +
  ".notice-document{background:#fff;width:210mm;margin:0 auto;padding:20mm 19mm 18mm;" +
  "font-family:'MS Mincho','Yu Mincho','Hiragino Mincho ProN',serif;font-size:10.5pt;line-height:1.45;color:#000;}" +
  ".notice-title{text-align:center;font-size:12pt;font-weight:bold;margin:0 0 0.5rem;}" +
  ".notice-addressee{margin:0 0 0.6rem;font-size:11pt;}" +
  ".notice-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:0.6rem;}" +
  ".notice-table th,.notice-table td{border:1px solid #000;padding:0.35rem 0.45rem;vertical-align:top;}" +
  ".cell-label{width:14.3%;text-align:center;font-weight:normal;}" +
  ".cell-body p{margin:0 0 0.15rem;}.cell-body p:last-child{margin-bottom:0;}" +
  ".indent{text-indent:1em;padding-left:0.5em;}.small{font-size:9.5pt;}" +
  ".wage-line{padding-left:0.2em;}.wage-total{font-weight:bold;margin-bottom:0.35rem;}" +
  ".wage-sub{font-size:9.5pt;margin:0 0 0.2rem;padding-left:1em;}" +
  ".ph-multiline,.cell-body .ph{white-space:pre-wrap;word-break:break-word;}" +
  ".notice-endmatter{margin-top:0.5rem;}.notice-note{margin:0.5rem 0 1.5rem;font-size:10pt;}" +
  ".notice-date-line,.notice-employer-line{text-align:right;margin:0.2rem 0;white-space:pre-wrap;}" +
  ".notice-signatory{text-align:right;margin:0.8rem 0 0;padding-right:1em;}" +
  ".notice-signatory-name{margin:0;border:none;text-decoration:none;}" +
  ".agreement-section{margin-top:1.2rem;border:none;}" +
  ".agreement-heading{font-size:11pt;font-weight:bold;text-align:center;margin:0 0 0.5rem;border:none;}" +
  ".agreement-lead{text-align:center;margin:0 0 0.8rem;}" +
  ".agreement-grid-table{width:100%;border:none;border-collapse:collapse;margin-top:0.5rem;}" +
  ".agreement-grid-table td{width:50%;vertical-align:top;border:none;padding:0 0.75rem;}" +
  ".signatory-row{display:flex;align-items:flex-end;gap:2em;margin-bottom:0.5rem;min-height:1.5em;border:none;}" +
  ".signatory-blank{flex:1;min-width:0;min-height:2.4em;}" +
  ".signatory-seal{flex-shrink:0;text-align:right;margin-left:1em;}";

function prepareExportClone() {
  const source = document.getElementById("notice-document");
  if (!source) return null;

  const clone = source.cloneNode(true);
  clone.querySelectorAll("[hidden]").forEach(function (el) {
    el.remove();
  });
  clone.querySelectorAll("#fixed-ot-preview:empty, #allowance-preview-list:empty").forEach(function (el) {
    el.remove();
  });

  clone.querySelectorAll(".agreement-grid").forEach(function (grid) {
    const parties = Array.from(grid.querySelectorAll(".agreement-party"));
    if (parties.length === 0) return;

    const table = document.createElement("table");
    table.className = "agreement-grid-table";
    const tr = document.createElement("tr");
    parties.forEach(function (party) {
      const td = document.createElement("td");
      td.innerHTML = party.innerHTML;
      tr.appendChild(td);
    });
    table.appendChild(tr);
    grid.replaceWith(table);
  });

  return clone;
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportNoticeAsWord() {
  const app = window.laborNoticeApp;
  app.applyPlaceholders();

  const clone = prepareExportClone();
  if (!clone) return;

  const title = document.getElementById("notice-title")?.textContent || "労働条件通知書";
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
    'xmlns="http://www.w3.org/TR/REC-html40">' +
    "<head><meta charset='utf-8'><title>" +
    title +
    "</title>" +
    "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->" +
    "<style>" +
    WORD_HTML_STYLES +
    "</style></head><body>" +
    clone.outerHTML +
    "</body></html>";

  const blob = new Blob(["\ufeff", html], {
    type: "application/msword",
  });
  downloadBlob(blob, app.getDownloadBaseName() + ".doc");
}

function exportNoticeAsDocx() {
  const btn = document.getElementById("export-word-btn");
  const label = btn?.textContent;

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "書き出し中…";
    }
    exportNoticeAsWord();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = label || "Wordで書き出し";
    }
  }
}

function initWordExport() {
  const btn = document.getElementById("export-word-btn");
  if (btn) {
    btn.addEventListener("click", exportNoticeAsDocx);
  }
}

document.addEventListener("DOMContentLoaded", initWordExport);
