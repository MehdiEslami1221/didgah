import { readFileSync } from "node:fs";
import { join } from "node:path";
import data from "./survey.json";
import type { ResponseRow } from "./db";
import { statistics } from "./stats";
const e = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const fa = (n: number, d = 0) =>
  n.toLocaleString("fa-IR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
function individual(r: ResponseRow) {
  return `<section class="person"><h1>پاسخ فردی · کد ${fa(r.id)}</h1><h2>${e(r.profile.firstName)} ${e(r.profile.lastName)}</h2><p>${new Date(r.created_at).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })} · زمان تهران</p><table><tbody>${[
    ["شماره تماس", r.profile.phone],
    ["سمت سازمانی", r.profile.position],
    ["سازمان محل خدمت", r.profile.organization],
    ["مدرک تحصیلی", r.profile.education],
    ["رشته تحصیلی", r.profile.field],
    ["سابقه کاری مرتبط", r.profile.experience],
    ["حوزه تخصص", r.profile.expertise.join("، ")],
    ["سایر تخصص‌ها", r.profile.otherExpertise],
  ]
    .map(([k, v]) => `<tr><th>${k}</th><td>${e(v || "—")}</td></tr>`)
    .join("")}</tbody></table>${data.sections
    .map(
      (s, si) =>
        `<h3>${e(s)}</h3><table><thead><tr><th>شماره</th><th>پرسش</th><th>پاسخ</th></tr></thead><tbody>${data.questions
          .filter((q) => q.section === si)
          .map(
            (q) =>
              `<tr><td>${fa(q.id)}</td><td>${e(q.text)}</td><td class="nowrap">${data.options[r.answers[q.id - 1]]}</td></tr>`,
          )
          .join("")}</tbody></table>`,
    )
    .join(
      "",
    )}<h3>توضیحات تکمیلی</h3><p class="notes">${e(r.notes || "ثبت نشده است.")}</p></section>`;
}
export function reportHtml(
  rows: ResponseRow[],
  mode: "summary" | "all" | "individual",
) {
  const stats = statistics(rows);
  let body = "";
  if (mode !== "individual")
    body = `<h1>گزارش تجمیعی پژوهش</h1><p>${e(data.title)}</p><div class="metrics">تعداد شرکت‌کنندگان: <b>${fa(rows.length)}</b> · تعداد پاسخ‌ها: <b>${fa(rows.length * 56)}</b> · میانگین تأثیر: <b>${rows.length ? fa(stats.mean, 2) : "—"}</b> از ۴</div><p class="note">کدگذاری: بدون تأثیر = ۰، کم = ۱، متوسط = ۲، زیاد = ۳، بسیار زیاد = ۴. این گزارش توصیفی است و تحلیل نهایی DEMATEL محسوب نمی‌شود.</p><h2>توزیع کلی گزینه‌ها</h2>${stats.distribution.map((n, i) => `<div class="bar"><span>${data.options[i]}</span><div><i style="width:${rows.length ? (n / (rows.length * 56)) * 100 : 0}%"></i></div><b>${fa(n)} · ${rows.length ? fa((n / (rows.length * 56)) * 100, 1) : "۰"}٪</b></div>`).join("")}<h2>میانگین تأثیر هر عامل</h2>${stats.sections.map((s) => `<div class="bar"><span>${e(s.label)}</span><div><i style="width:${(s.mean / 4) * 100}%"></i></div><b>${rows.length ? fa(s.mean, 2) : "—"}</b></div>`).join("")}<h2>ماتریس میانگین اثر مستقیم</h2><p class="note">سطر عامل تأثیرگذار و ستون عامل تأثیرپذیر است. قطر اصلی فاقد سؤال است.</p><table class="matrix"><thead><tr><th>عامل</th>${data.shortSections.map((_, i) => `<th>${fa(i + 1)}</th>`).join("")}</tr></thead><tbody>${stats.matrix.map((row, i) => `<tr><th>${fa(i + 1)}. ${e(data.shortSections[i])}</th>${row.map((v) => `<td style="background:rgba(8,119,101,${v === null ? 0 : 0.05 + (v / 4) * 0.4})">${v === null || !rows.length ? "—" : fa(v, 2)}</td>`).join("")}</tr>`).join("")}</tbody></table><h2>آمار تفصیلی سؤال‌ها</h2><p class="note">در هر خانه: تعداد (درصد از شرکت‌کنندگان). میانگین هر سؤال از صفر تا چهار است.</p>${data.sections
      .map(
        (s, si) =>
          `<h3>${e(s)}</h3><table class="question-table"><thead><tr><th>سؤال</th>${data.options.map((o) => `<th>${o}</th>`).join("")}<th>میانگین</th></tr></thead><tbody>${stats.questions
            .filter((q) => q.section === si)
            .map(
              (q) =>
                `<tr><td>${fa(q.id)}. ${e(q.text)}</td>${q.counts.map((n) => `<td>${fa(n)}<br/>(${rows.length ? fa((n / rows.length) * 100, 1) : "۰"}٪)</td>`).join("")}<td>${rows.length ? fa(q.mean, 2) : "—"}</td></tr>`,
            )
            .join("")}</tbody></table>`,
      )
      .join("")}`;
  if (mode === "all" || mode === "individual")
    body += rows.map(individual).join("");
  const font = readFileSync(
    join(process.cwd(), "public/fonts/vazirmatn-arabic-400-normal.woff2"),
  ).toString("base64");
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>گزارش پژوهش سرمایه‌گذاری شهری</title><style>@font-face{font-family:Vazir;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}*{box-sizing:border-box}body{font:12px/1.95 Vazir,Tahoma,sans-serif;color:#173b35;margin:0 auto;max-width:1000px;padding:30px}h1{font-size:23px;margin:12px 0}h2{font-size:18px;margin-top:26px}h3{font-size:13px;color:#087765;margin-top:22px;break-after:avoid}p{margin:8px 0}table{width:100%;border-collapse:collapse;margin:14px 0;font-size:10px;table-layout:auto}th,td{border:1px solid #dce4dc;padding:7px 8px;vertical-align:top;text-align:right;overflow-wrap:anywhere}th{background:#eff4ed;font-weight:600}thead{display:table-header-group}tr{break-inside:avoid}.question-table td:not(:first-child){text-align:center;min-width:47px}.question-table td:first-child{width:45%}.question-table th{font-size:9px}.matrix td{text-align:center}.nowrap{white-space:nowrap}.metrics{background:#eef5ed;padding:15px;margin:20px 0}.note{font-size:10px;color:#657b6c}.bar{display:flex;align-items:center;gap:15px;margin:11px 0;break-inside:avoid}.bar>span{width:195px;font-size:11px}.bar>div{flex:1;height:12px;background:#f1f4ee;border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;background:#087765}.bar b{width:115px;font-size:10px;text-align:left}.person{break-before:page}.person:first-child{break-before:auto}.notes{white-space:pre-wrap;overflow-wrap:anywhere}.toolbar{display:flex;gap:12px;padding:14px;background:#eef5ed;margin-bottom:20px}.toolbar button,.toolbar a{font:inherit;padding:8px 15px;border:1px solid #c9dbcc;border-radius:6px;background:white;color:#087765;text-decoration:none;cursor:pointer}@page{size:A4;margin:15mm 12mm 18mm}@media print{body{padding:0;font-size:11px;max-width:none}.toolbar{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${body}</body></html>`;
}
