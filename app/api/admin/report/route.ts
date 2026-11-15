import { isAdmin } from "@/lib/auth";
import { selectReport } from "@/lib/report-selection";
import { reportHtml } from "@/lib/report";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let inProgress = false;
export async function GET(req: Request) {
  if (!(await isAdmin()))
    return Response.json(
      { error: "ابتدا وارد پنل مدیریت شوید." },
      { status: 401 },
    );
  let selection;
  try {
    selection = selectReport(new URL(req.url));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
  if (inProgress)
    return Response.json(
      { error: "گزارش دیگری در حال آماده‌سازی است. کمی بعد دوباره تلاش کنید." },
      { status: 429 },
    );
  inProgress = true;
  let browser;
  try {
    const executablePath =
      process.env.CHROMIUM_PATH ||
      (process.platform === "linux" && existsSync("/usr/bin/chromium")
        ? "/usr/bin/chromium"
        : undefined);
    browser = await chromium.launch({ headless: true, executablePath });
    const page = await browser.newPage();
    await page.setContent(reportHtml(selection.list, selection.mode), {
      waitUntil: "load",
      timeout: 60000,
    });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="font-size:9px;width:100%;text-align:center;color:#888"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="survey-${selection.mode}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      "PDF generation failed",
      error instanceof Error ? error.message : "unknown",
    );
    return Response.json(
      {
        error:
          "ساخت PDF انجام نشد. نصب Chromium را بررسی کنید؛ چاپ مرورگر همچنان در دسترس است.",
      },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close().catch(() => {});
    inProgress = false;
  }
}
