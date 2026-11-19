# Didgah maintenance notes

Didgah is Mehdi Eslami’s Persian, right-to-left research questionnaire. Participants complete one fixed survey. Researchers use a private dashboard to review responses, inspect descriptive statistics and export reports. For a fresh checkout, follow [the README](README.md). Check the current branch, package scripts and implementation before applying these notes to a newer release.

## Where a change belongs

| Task | Start here | Check alongside it |
| --- | --- | --- |
| Participant form or draft recovery | `components/Survey.tsx`, `lib/survey.json` | `lib/validation.ts`, `app/api/responses/route.ts` |
| Stored responses or submission retries | `lib/db.ts` | `tests/core.test.ts`, `tests/routes.test.ts` |
| Dashboard or scoring | `components/Dashboard.tsx`, `lib/stats.ts` | [Data and reporting](docs/data-and-reporting.md) |
| Print or downloadable PDF | `lib/report.ts`, `lib/report-selection.ts` | `app/admin/report/route.ts`, `app/api/admin/report/route.ts`, [PDF troubleshooting](docs/pdf-troubleshooting.md) |
| Admin access or hosting | `lib/auth.ts`, `.env.example` | [Deployment and upgrades](docs/deployment.md), `deploy/` |

## Updating a study already collecting answers

- SQLite stores each response’s answers as an ordered array. Changing question order, meaning or scale can silently relabel earlier answers in the dashboard and PDFs. For a new study, keep the previous database with its matching code revision, configure a fresh `DATABASE_PATH`, and give the new study its own browser draft key. The current key is `urban-draft-v1`.
- The current survey has eight factors and 56 directed questions. Zero means “no influence” and is a valid answer. The matrix diagonal is blank. When changing statistics, compare the dashboard and exported reports against the same synthetic responses.
- Preserve the client submission token across retries. Check that an interrupted submission can be retried once without adding a second row and that a participant can resume a draft after refreshing.
- Before a storage migration, run `npm run backup` against the intended database and rehearse the migration on a copy. Keep participant records, reports, backups and real environment settings outside Git.
- Keep the participant interface and reports in Persian. Check right-to-left layout, Persian glyphs in PDFs, required names and optional contact fields when changing the form or typography.

## Verifying an update

On a fresh local checkout use Node.js 22 or 24, then run `npm ci` and `npm run setup`. Use a disposable local database for manual submissions. The repository’s validation sequence is:

    npm test
    npm run build
    npm run typecheck
    npm run pdf:install
    npm run test:pdf

For a change to the survey flow, submit a synthetic response and find it in the admin dashboard. For a reporting change, open a generated PDF and check Persian text, page breaks and the requested report scope. If Chromium installation fails on the target host, follow the PDF troubleshooting guide for a compatible executable and the service account’s browser path. Browser printing and downloadable PDFs are separate paths; verify the one you changed.

## متن آماده برای شروع جلسهٔ بعد

> می‌خواهم پروژهٔ Didgah را ادامه بدهم. درخواست این بار من «[تغییر موردنظر]» است. اول README.md و AGENTS.md را در نسخهٔ فعلی مخزن بخوان و مسیر مربوط به همین درخواست را در کد بررسی کن. پاسخ‌های قبلی و پیش‌نویس‌های کاربران باید همچنان درست خوانده شوند. اگر تغییر من معنی داده‌های پژوهش را عوض می‌کند، پیش از هر تغییر روی دادهٔ واقعی، اثر آن و راه حفظ نسخهٔ قبلی را توضیح بده. تغییر را با دادهٔ آزمایشی بررسی کن و در پایان بگو چه چیزی تغییر کرد، چه تستی اجرا شد و برای به‌روزرسانی سرور چه کاری لازم است.
