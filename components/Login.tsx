"use client";
import { useState } from "react";
import Brand from "./Brand";
export default function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="login-page">
      <Brand />
      <form
        className="card login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(f)),
            });
            const b = await r.json();
            if (!r.ok) throw new Error(b.error);
            window.location.reload();
          } catch (err) {
            setError(err instanceof Error ? err.message : "اتصال برقرار نشد.");
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">مدیریت پژوهش</span>
        <h1>ورود به پنل مدیریت</h1>
        <p className="muted">مشاهده پاسخ‌ها، تحلیل نتایج و دریافت گزارش</p>
        <label className="field">
          نام کاربری
          <input name="username" required autoComplete="username" dir="ltr" />
        </label>
        <label className="field">
          رمز عبور
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            dir="ltr"
          />
        </label>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "در حال ورود…" : "ورود به پنل ←"}
        </button>
        <a className="quiet" href="/">
          بازگشت به پرسشنامه
        </a>
      </form>
    </main>
  );
}
