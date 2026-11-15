"use client";
import { useEffect, useState } from "react";
import data from "@/lib/survey.json";
import type { Profile } from "@/lib/db";
import Brand from "./Brand";
const initial: Profile = {
  firstName: "",
  lastName: "",
  phone: "",
  position: "",
  organization: "",
  education: "",
  field: "",
  experience: "",
  expertise: [],
  otherExpertise: "",
};
const expertise = [
  "مدیریت دولتی",
  "خط‌مشی‌گذاری عمومی",
  "مدیریت شهری",
  "سرمایه‌گذاری شهری",
  "برنامه‌ریزی شهری",
  "توسعه پایدار",
  "سایر",
];
const fa = (n: number) => n.toLocaleString("fa-IR");
export default function Survey() {
  const [profile, setProfile] = useState<Profile>(initial),
    [answers, setAnswers] = useState<(number | null)[]>(Array(56).fill(null)),
    [notes, setNotes] = useState(""),
    [step, setStep] = useState(-1),
    [token, setToken] = useState(""),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState<number | null>(null),
    [resumed, setResumed] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("urban-draft-v1") || "null",
      );
      if (
        saved &&
        Array.isArray(saved.answers) &&
        saved.answers.length === 56 &&
        saved.profile &&
        saved.token
      ) {
        setProfile({ ...initial, ...saved.profile });
        setAnswers(
          saved.answers.map((v: unknown) =>
            typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 4
              ? v
              : null,
          ),
        );
        setNotes(saved.notes || "");
        setToken(saved.token);
        setResumed(true);
      } else setToken(crypto.randomUUID());
    } catch {
      setToken(crypto.randomUUID());
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && !done) {
      try {
        localStorage.setItem(
          "urban-draft-v1",
          JSON.stringify({ profile, answers, notes, token }),
        );
      } catch {}
    }
  }, [profile, answers, notes, token, ready, done]);
  const count = answers.filter((v) => v !== null).length;
  const update = (key: keyof Profile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));
  function move(n: number) {
    setError("");
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function next() {
    const missing = data.questions.filter(
      (q) => q.section === step && answers[q.id - 1] === null,
    );
    if (missing.length) {
      setError("لطفاً به همه سؤال‌های این بخش پاسخ دهید.");
      document
        .getElementById("question-" + missing[0].id)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    move(step + 1);
  }
  async function submit() {
    if (busy) return;
    if (count !== 56) {
      setError("لطفاً همه سؤال‌ها را پاسخ دهید.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, profile, answers, notes }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setDone(result.id);
      try {
        localStorage.removeItem("urban-draft-v1");
      } catch {}
      window.scrollTo(0, 0);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "ثبت انجام نشد. اتصال اینترنت را بررسی کنید؛ پاسخ‌های شما حفظ شده‌اند.",
      );
    } finally {
      setBusy(false);
    }
  }
  const field = (key: keyof Profile, label: string, required = false) => (
    <label className="field" key={key}>
      {label}
      {required ? <b className="required"> *</b> : <small>اختیاری</small>}
      <input
        required={required}
        minLength={required ? 2 : undefined}
        maxLength={key === "phone" ? 20 : key === "experience" ? 2 : 100}
        type={key === "phone" ? "tel" : "text"}
        inputMode={key === "experience" ? "numeric" : undefined}
        value={profile[key] as string}
        onChange={(e) => update(key, e.target.value)}
        autoComplete={
          key === "firstName"
            ? "given-name"
            : key === "lastName"
              ? "family-name"
              : key === "phone"
                ? "tel"
                : "off"
        }
        pattern={
          key === "phone"
            ? "[+0-9۰-۹٠-٩ ()-]{7,20}"
            : key === "experience"
              ? "[0-9۰-۹٠-٩]{0,2}"
              : undefined
        }
      />
    </label>
  );
  return (
    <>
      <header className="site-header">
        <Brand />
        <a className="quiet" href="/admin">
          ورود مدیر <span>↗</span>
        </a>
      </header>
      <main className="survey-layout">
        <aside className="survey-aside">
          <span className="eyebrow">پژوهش دانشگاهی / توسعه پایدار</span>
          <h1>
            شهرهای بهتر،
            <br />
            <em>با دیدگاه شما.</em>
          </h1>
          <p>ارزیابی تأثیر متقابل عوامل اجرای خط‌مشی‌های سرمایه‌گذاری شهری</p>
          <div className="urban-art" aria-hidden="true">
            <div className="sun" />
            <div className="building b1" />
            <div className="building b2" />
            <div className="building b3" />
            <div className="building b4" />
            <div className="tree t1" />
            <div className="tree t2" />
            <div className="ground" />
          </div>
          <div className="aside-stats">
            <div>
              <strong>۵۶</strong>
              <span>پرسش تخصصی</span>
            </div>
            <div>
              <strong>۸</strong>
              <span>بخش پژوهش</span>
            </div>
            <div>
              <strong>۵</strong>
              <span>سطح تأثیر</span>
            </div>
          </div>
          <div className="privacy">
            <span>◉</span>
            <p>
              پاسخ‌های شما محرمانه است و صرفاً برای اهداف علمی و پژوهشی استفاده
              می‌شود.
            </p>
          </div>
          {step >= 0 && !done && (
            <nav className="section-nav" aria-label="بخش‌های پرسشنامه">
              {data.shortSections.map((s, i) => (
                <button
                  key={s}
                  className={step === i ? "active" : ""}
                  onClick={() => move(i)}
                >
                  <span>
                    {answers.slice(i * 7, i * 7 + 7).every((v) => v !== null)
                      ? "✓"
                      : fa(i + 1)}
                  </span>
                  {s}
                </button>
              ))}
            </nav>
          )}
        </aside>
        <section className="survey-main">
          {done ? (
            <div className="card success">
              <div className="success-icon">✓</div>
              <span className="eyebrow">ثبت نهایی انجام شد</span>
              <h2>از همراهی شما سپاسگزاریم</h2>
              <p>
                پاسخ‌های شما با موفقیت ثبت شد و در اختیار پژوهشگر قرار گرفت.
              </p>
              <div className="receipt">
                کد ثبت پاسخ <strong>{fa(done)}</strong>
              </div>
              <p className="muted">می‌توانید این صفحه را ببندید.</p>
            </div>
          ) : (
            <>
              <div className="step-head">
                <span>
                  {step === -1
                    ? "پیش از شروع"
                    : step === 8
                      ? "مرور و ثبت نهایی"
                      : `بخش ${fa(step + 1)} از ۸`}
                </span>
                <span>{fa(count)} از ۵۶ پاسخ</span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={56}
                aria-label="پیشرفت پاسخ‌ها"
              >
                <div style={{ width: `${(count / 56) * 100}%` }} />
              </div>
              {step === -1 ? (
                <>
                  <section className="intro">
                    <span className="eyebrow">خوش آمدید</span>
                    <h2>هر دیدگاه، بخشی از تصویر بزرگ‌تر</h2>
                    <p>{data.intro}</p>
                  </section>
                  <form
                    className="card"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        !profile.firstName.trim() ||
                        !profile.lastName.trim()
                      ) {
                        setError("نام و نام خانوادگی را وارد کنید.");
                        return;
                      }
                      move(0);
                    }}
                  >
                    <div className="card-heading">
                      <span className="number-badge">۰۱</span>
                      <div>
                        <h3>آشنایی با شما</h3>
                        <p>
                          نام و نام خانوادگی الزامی است؛ سایر مشخصات
                          اختیاری‌اند.
                        </p>
                      </div>
                    </div>
                    {resumed && (
                      <div className="notice">
                        پاسخ‌های نیمه‌کاره شما بازیابی شد. می‌توانید ادامه دهید.
                      </div>
                    )}
                    <div className="fields">
                      {field("firstName", "نام", true)}
                      {field("lastName", "نام خانوادگی", true)}
                      {field("phone", "شماره تماس")}
                    </div>
                    <details className="optional">
                      <summary>
                        مشخصات تخصصی و سازمانی <small>اختیاری</small>
                      </summary>
                      <div className="fields">
                        {field("position", "سمت سازمانی")}
                        {field("organization", "سازمان محل خدمت")}
                        <label className="field">
                          مدرک تحصیلی
                          <select
                            value={profile.education}
                            onChange={(e) =>
                              update("education", e.target.value)
                            }
                          >
                            <option value="">انتخاب کنید</option>
                            {["کارشناسی", "کارشناسی ارشد", "دکتری تخصصی"].map(
                              (s) => (
                                <option key={s}>{s}</option>
                              ),
                            )}
                          </select>
                        </label>
                        {field("field", "رشته تحصیلی")}
                        {field("experience", "سابقه کاری مرتبط (سال)")}
                      </div>
                      <fieldset className="expertise">
                        <legend>حوزه تخصص</legend>
                        {expertise.map((s) => (
                          <label key={s}>
                            <input
                              type="checkbox"
                              checked={profile.expertise.includes(s)}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  expertise: e.target.checked
                                    ? [...p.expertise, s]
                                    : p.expertise.filter((x) => x !== s),
                                }))
                              }
                            />
                            {s}
                          </label>
                        ))}
                      </fieldset>
                      {profile.expertise.includes("سایر") &&
                        field("otherExpertise", "سایر حوزه‌های تخصص")}
                    </details>
                    <div className="form-bottom">
                      <span className="muted">
                        برای هر سؤال فقط یک گزینه انتخاب کنید.
                      </span>
                      <button className="primary" disabled={!ready}>
                        شروع پرسشنامه <span>←</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : step < 8 ? (
                <>
                  <section className="intro compact">
                    <span className="eyebrow">عامل تأثیرگذار مستقیم</span>
                    <h2>{data.shortSections[step]}</h2>
                    <p>{data.sections[step]}</p>
                  </section>
                  <div className="scale-guide">
                    میزان تأثیر مستقیم هر عامل را انتخاب کنید؛ از بدون تأثیر تا
                    بسیار زیاد.
                  </div>
                  {data.questions
                    .filter((q) => q.section === step)
                    .map((q) => (
                      <fieldset
                        id={"question-" + q.id}
                        key={q.id}
                        className={
                          "question card " +
                          (answers[q.id - 1] !== null ? "answered" : "")
                        }
                      >
                        <legend>
                          <span className="qnumber">{fa(q.id)}</span>
                          <span>{q.text}</span>
                        </legend>
                        <div className="options">
                          {data.options.map((label, v) => (
                            <label
                              className={
                                answers[q.id - 1] === v ? "selected" : ""
                              }
                              key={label}
                            >
                              <input
                                type="radio"
                                name={"q" + q.id}
                                value={v}
                                checked={answers[q.id - 1] === v}
                                onChange={() =>
                                  setAnswers((a) =>
                                    a.map((x, i) => (i === q.id - 1 ? v : x)),
                                  )
                                }
                              />
                              <span className="radio-dot" />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  <div className="sticky-actions">
                    <button
                      className="secondary"
                      onClick={() => move(step - 1)}
                    >
                      → {step === 0 ? "مشخصات" : "بخش قبل"}
                    </button>
                    <span className="muted">
                      {fa(
                        answers
                          .slice(step * 7, step * 7 + 7)
                          .filter((x) => x !== null).length,
                      )}{" "}
                      از ۷ پاسخ
                    </span>
                    <button className="primary" onClick={next}>
                      {step === 7 ? "مرور پاسخ‌ها" : "بخش بعد"} ←
                    </button>
                  </div>
                </>
              ) : (
                <div className="card review">
                  <span className="eyebrow">یک قدم تا پایان</span>
                  <h2>مرور و ثبت پاسخ‌ها</h2>
                  <p>
                    {profile.firstName} {profile.lastName}، لطفاً مشخصات و تکمیل
                    بخش‌ها را بررسی کنید.
                  </p>
                  <button className="text-button" onClick={() => move(-1)}>
                    ویرایش مشخصات
                  </button>
                  {data.shortSections.map((s, i) => (
                    <button
                      className="review-row"
                      key={s}
                      onClick={() => move(i)}
                    >
                      <span>
                        {fa(i + 1)}. {s}
                      </span>
                      <span>
                        {fa(
                          answers
                            .slice(i * 7, i * 7 + 7)
                            .filter((x) => x !== null).length,
                        )}{" "}
                        / ۷ <b>ویرایش ←</b>
                      </span>
                    </button>
                  ))}
                  <label className="field notes">
                    توضیحات تکمیلی <small>اختیاری</small>
                    <p className="muted">
                      چنانچه درباره تعریف عوامل یا نحوه اثرگذاری مستقیم آن‌ها بر
                      یکدیگر نکته‌ای دارید، بیان فرمایید.
                    </p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={3000}
                      rows={4}
                    />
                  </label>
                  <div className="notice">
                    پس از ثبت نهایی، امکان ویرایش پاسخ‌ها توسط شرکت‌کننده وجود
                    ندارد.
                  </div>
                  <div className="form-bottom">
                    <button className="secondary" onClick={() => move(7)}>
                      بازگشت
                    </button>
                    <button
                      className="primary"
                      disabled={busy || count !== 56}
                      onClick={submit}
                    >
                      {busy ? "در حال ثبت…" : "تأیید و ثبت نهایی ✓"}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <footer className="form-footer">
                پرسشنامه اجرای خط‌مشی‌های سرمایه‌گذاری شهری <span>•</span> توسعه
                پایدار
              </footer>
            </>
          )}
        </section>
      </main>
    </>
  );
}
