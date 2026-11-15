"use client";
import { useMemo, useState } from "react";
import data from "@/lib/survey.json";
import { statistics } from "@/lib/stats";
import type { ResponseRow } from "@/lib/db";
import Brand from "./Brand";
const fa = (n: number, d = 0) =>
  n.toLocaleString("fa-IR", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
const date = (s: string) =>
  new Date(s).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const colors = ["#c4ccd1", "#9bbfc1", "#65a8a2", "#278879", "#075e50"];
export default function Dashboard({
  responses,
}: {
  responses: Omit<ResponseRow, "token">[];
}) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [tab, setTab] = useState("overview"),
    [search, setSearch] = useState(""),
    [section, setSection] = useState(-1),
    [detail, setDetail] = useState<number | null>(null),
    [loading, setLoading] = useState(""),
    [error, setError] = useState("");
  const stats = useMemo(
    () => statistics(responses as ResponseRow[]),
    [responses],
  );
  const filtered = responses.filter((r) =>
    (
      r.profile.firstName +
      " " +
      r.profile.lastName +
      " " +
      r.profile.phone
    ).includes(search),
  );
  const selected = responses.find((r) => r.id === detail);
  async function download(mode: string, id?: number) {
    setLoading(id ? "pdf-" + id : mode);
    setError("");
    try {
      const r = await fetch(
        "/api/admin/report?mode=" + mode + (id ? "&id=" + id : ""),
      );
      if (!r.ok) {
        const b = await r.json();
        throw new Error(b.error || "دریافت گزارش انجام نشد.");
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = id ? "response-" + id + ".pdf" : "survey-" + mode + ".pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "اتصال برقرار نشد.");
    } finally {
      setLoading("");
    }
  }
  async function remove(r: Omit<ResponseRow, "token">) {
    if (
      !window.confirm(
        `پاسخ «${r.profile.firstName} ${r.profile.lastName}» با کد ${r.id} برای همیشه حذف شود؟ این کار قابل بازگشت نیست و آمار را تغییر می‌دهد.`,
      )
    )
      return;
    setDeleting(r.id);
    setError("");
    try {
      const response = await fetch("/api/admin/responses/" + r.id, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.reload();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "حذف انجام نشد. اتصال را بررسی کنید.",
      );
      setDeleting(null);
    }
  }
  const reportActions = (id?: number) => (
    <div className="actions">
      <button
        className="secondary"
        disabled={!!loading}
        onClick={() => download(id ? "individual" : "summary", id)}
      >
        {loading === (id ? "pdf-" + id : "summary")
          ? "در حال ساخت…"
          : "↓ دانلود PDF"}
      </button>
      <a
        className="secondary"
        target="_blank"
        rel="noreferrer"
        href={"/admin/report?mode=" + (id ? "individual&id=" + id : "summary")}
      >
        چاپ گزارش ↗
      </a>
    </div>
  );
  return (
    <>
      <header className="site-header">
        <Brand />
        <div className="actions">
          <span className="admin-tag">پنل پژوهشگر</span>
          <button
            className="quiet"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.reload();
            }}
          >
            خروج ↗
          </button>
        </div>
      </header>
      <div className="dashboard">
        <aside className="dash-nav">
          <span className="eyebrow">فضای مدیریت</span>
          {[
            ["overview", "◫", "نمای کلی"],
            ["responses", "☷", "پاسخ‌دهندگان"],
            ["questions", "◷", "تحلیل سؤال‌ها"],
            ["matrix", "▦", "ماتریس تأثیر"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setDetail(null);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
          <div className="nav-bottom">
            <b>پژوهش سرمایه‌گذاری شهری</b>
            <p>۵۶ سؤال · ۸ عامل · توسعه پایدار</p>
            <a href="/" target="_blank" rel="noreferrer">
              مشاهده پرسشنامه ↗
            </a>
          </div>
        </aside>
        <main className="dash-main">
          <div className="page-title">
            <div>
              <span className="eyebrow">داده‌ها به روایت دیدگاه‌ها</span>
              <h1>
                {tab === "overview"
                  ? "نمای کلی پژوهش"
                  : tab === "responses"
                    ? "پاسخ‌دهندگان"
                    : tab === "questions"
                      ? "تحلیل سؤال‌ها"
                      : "ماتریس تأثیر مستقیم"}
              </h1>
              <p className="muted">{data.title}</p>
            </div>
            {reportActions()}
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="metrics">
            <div className="metric">
              <span>پاسخ‌های ثبت‌شده</span>
              <strong>
                {fa(responses.length)} <small>نفر</small>
              </strong>
              <p>پرسشنامه‌های کامل</p>
            </div>
            <div className="metric">
              <span>پاسخ به سؤال‌ها</span>
              <strong>{fa(responses.length * 56)}</strong>
              <p>در مجموع ۸ بخش</p>
            </div>
            <div className="metric">
              <span>میانگین تأثیر</span>
              <strong>
                {responses.length ? fa(stats.mean, 2) : "—"} <small>از ۴</small>
              </strong>
              <p>کدگذاری گزینه‌ها از صفر تا چهار</p>
            </div>
            <div className="metric">
              <span>آخرین مشارکت</span>
              <strong className="last-date">
                {responses.length
                  ? new Date(responses[0].created_at).toLocaleDateString(
                      "fa-IR",
                    )
                  : "—"}
              </strong>
              <p>آخرین پاسخ دریافتی</p>
            </div>
          </div>
          {!responses.length && (
            <div className="card empty">
              <span>◌</span>
              <h2>هنوز پاسخی ثبت نشده است</h2>
              <p>
                لینک صفحه اصلی را برای شرکت‌کنندگان ارسال کنید. آمار پس از اولین
                ثبت نمایش داده می‌شود.
              </p>
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.origin);
                    setError("لینک پرسشنامه کپی شد.");
                  } catch {
                    setError("آدرس صفحه اصلی را از نوار مرورگر کپی کنید.");
                  }
                }}
              >
                کپی لینک پرسشنامه
              </button>
            </div>
          )}
          {tab === "overview" && (
            <>
              <div className="chart-grid">
                <section className="card">
                  <div className="card-heading">
                    <div>
                      <h2>توزیع میزان تأثیر</h2>
                      <p>مجموع گزینه‌های انتخاب‌شده در تمام سؤال‌ها</p>
                    </div>
                    <span className="pill">۵ سطح</span>
                  </div>
                  <div className="distribution">
                    {stats.distribution.map((n, i) => (
                      <div className="bar-row" key={i}>
                        <span>{data.options[i]}</span>
                        <div className="bar-track">
                          <div
                            style={{
                              width: `${responses.length ? (n / (responses.length * 56)) * 100 : 0}%`,
                              background: colors[i],
                            }}
                          />
                        </div>
                        <b>{fa(n)}</b>
                        <small>
                          {responses.length
                            ? fa((n / (responses.length * 56)) * 100, 1)
                            : "۰"}
                          ٪
                        </small>
                      </div>
                    ))}
                  </div>
                  <p className="chart-note">
                    هر شرکت‌کننده ۵۶ انتخاب دارد؛ درصدها بر مبنای تعداد کل
                    انتخاب‌ها محاسبه می‌شوند.
                  </p>
                </section>
                <section className="card">
                  <div className="card-heading">
                    <div>
                      <h2>میانگین تأثیر هر عامل</h2>
                      <p>میانگین هفت رابطه خروجی هر بخش، از ۴</p>
                    </div>
                  </div>
                  <div className="section-bars">
                    {stats.sections.map((s, i) => (
                      <div className="section-bar" key={i}>
                        <div>
                          <span>{s.label}</span>
                          <b>{responses.length ? fa(s.mean, 2) : "—"}</b>
                        </div>
                        <div className="bar-track">
                          <div style={{ width: `${(s.mean / 4) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <section className="card">
                <div className="card-heading">
                  <div>
                    <h2>تازه‌ترین پاسخ‌ها</h2>
                    <p>آخرین مشارکت‌کنندگان پژوهش</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setTab("responses")}
                  >
                    مشاهده همه ←
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>نام و نام خانوادگی</th>
                        <th>تاریخ ثبت</th>
                        <th>وضعیت</th>
                        <th>گزارش</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td>
                            {r.profile.firstName} {r.profile.lastName}
                          </td>
                          <td>{date(r.created_at)}</td>
                          <td>
                            <span className="pill">تکمیل‌شده</span>
                          </td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => {
                                setTab("responses");
                                setDetail(r.id);
                              }}
                            >
                              مشاهده ←
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {tab === "responses" && (
            <>
              <section className="card">
                <div className="card-heading">
                  <div>
                    <h2>فهرست پاسخ‌ها</h2>
                    <p>گزارش کامل شامل پاسخ‌ها و مشخصات تمام افراد است.</p>
                  </div>
                  <button
                    className="primary"
                    disabled={!!loading || !responses.length}
                    onClick={() => download("all")}
                  >
                    {loading === "all"
                      ? "در حال ساخت گزارش…"
                      : "↓ PDF تمام پاسخ‌ها"}
                  </button>
                </div>
                <input
                  className="search"
                  placeholder="جست‌وجوی نام یا شماره تماس…"
                  aria-label="جست‌وجوی پاسخ‌دهندگان"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>کد</th>
                        <th>نام و نام خانوادگی</th>
                        <th>شماره تماس</th>
                        <th>تاریخ ثبت</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          <td>{fa(r.id)}</td>
                          <td>
                            {r.profile.firstName} {r.profile.lastName}
                          </td>
                          <td dir="ltr">{r.profile.phone || "—"}</td>
                          <td>{date(r.created_at)}</td>
                          <td>
                            <div className="actions">
                              <button
                                className="text-button"
                                onClick={() => setDetail(r.id)}
                              >
                                مشاهده پاسخ‌ها ←
                              </button>
                              <button
                                className="danger-button"
                                disabled={deleting !== null}
                                onClick={() => remove(r)}
                              >
                                {deleting === r.id ? "در حال حذف…" : "حذف پاسخ"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered.length && (
                    <p className="muted">نتیجه‌ای یافت نشد.</p>
                  )}
                </div>
              </section>
              {selected && (
                <section className="card detail">
                  <div className="card-heading">
                    <div>
                      <h2>
                        {selected.profile.firstName} {selected.profile.lastName}
                      </h2>
                      <p>
                        کد {fa(selected.id)} · {date(selected.created_at)}
                      </p>
                    </div>
                    {reportActions(selected.id)}
                  </div>
                  <dl className="profile-details">
                    {[
                      ["شماره تماس", selected.profile.phone],
                      ["سمت سازمانی", selected.profile.position],
                      ["سازمان", selected.profile.organization],
                      ["مدرک تحصیلی", selected.profile.education],
                      ["رشته", selected.profile.field],
                      ["سابقه مرتبط", selected.profile.experience],
                      ["حوزه تخصص", selected.profile.expertise.join("، ")],
                      ["سایر تخصص‌ها", selected.profile.otherExpertise],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  {data.questions.map((q) => (
                    <div className="answer-row" key={q.id}>
                      <p>
                        <b>{fa(q.id)}.</b> {q.text}
                      </p>
                      <span className="pill">
                        {data.options[selected.answers[q.id - 1]]}
                      </span>
                    </div>
                  ))}
                  <h3>توضیحات تکمیلی</h3>
                  <p className="notes-text">
                    {selected.notes || "ثبت نشده است."}
                  </p>
                </section>
              )}
            </>
          )}
          {tab === "questions" && (
            <>
              <div className="filter-row">
                <label>
                  بخش پرسشنامه{" "}
                  <select
                    value={section}
                    onChange={(e) => setSection(Number(e.target.value))}
                  >
                    <option value={-1}>همه بخش‌ها</option>
                    {data.shortSections.map((s, i) => (
                      <option key={s} value={i}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="muted">تعداد و درصد انتخاب هر گزینه</span>
              </div>
              {stats.questions
                .filter((q) => section === -1 || q.section === section)
                .map((q) => (
                  <section key={q.id} className="card question-analysis">
                    <div className="card-heading">
                      <h3>
                        <span className="qnumber">{fa(q.id)}</span> {q.text}
                      </h3>
                      <span className="pill">
                        میانگین {responses.length ? fa(q.mean, 2) : "—"}
                      </span>
                    </div>
                    {q.counts.map((n, i) => (
                      <div className="bar-row" key={i}>
                        <span>{data.options[i]}</span>
                        <div className="bar-track">
                          <div
                            style={{
                              width: `${responses.length ? (n / responses.length) * 100 : 0}%`,
                              background: colors[i],
                            }}
                          />
                        </div>
                        <b>{fa(n)}</b>
                        <small>
                          {responses.length
                            ? fa((n / responses.length) * 100, 1)
                            : "۰"}
                          ٪
                        </small>
                      </div>
                    ))}
                  </section>
                ))}
            </>
          )}
          {tab === "matrix" && (
            <section className="card">
              <h2>میانگین اثر هر عامل بر عوامل دیگر</h2>
              <p className="muted">
                سطر = عامل تأثیرگذار، ستون = عامل تأثیرپذیر. قطر اصلی فاقد سؤال
                است.
              </p>
              <div className="table-wrap">
                <table className="matrix">
                  <thead>
                    <tr>
                      <th>عامل ↓ / اثر بر ←</th>
                      {data.shortSections.map((_, i) => (
                        <th key={i}>{fa(i + 1)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.matrix.map((row, i) => (
                      <tr key={i}>
                        <th>
                          {fa(i + 1)}. {data.shortSections[i]}
                        </th>
                        {row.map((v, j) => (
                          <td
                            key={j}
                            style={{
                              background:
                                v === null
                                  ? "#eef1ee"
                                  : `rgba(9,120,94,${0.04 + ((v || 0) / 4) * 0.6})`,
                            }}
                          >
                            {v === null
                              ? "—"
                              : responses.length
                                ? fa(v, 2)
                                : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="matrix-legend">
                {data.shortSections.map((s, i) => (
                  <span key={s}>
                    {fa(i + 1)}. {s}
                  </span>
                ))}
              </div>
              <p className="chart-note">
                این جدول میانگین خام پاسخ‌هاست. تحلیل نهایی روابط علّی به روش
                DEMATEL در این گزارش انجام نمی‌شود.
              </p>
            </section>
          )}
          <footer className="form-footer">
            اطلاعات این پنل محرمانه است · فقط پاسخ‌های ثبت نهایی‌شده در آمار
            محاسبه می‌شوند.
          </footer>
        </main>
      </div>
    </>
  );
}
