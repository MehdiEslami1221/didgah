import { chromium } from "playwright";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { reportHtml } from "../lib/report";
import type { ResponseRow } from "../lib/db";
async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  });
  try {
    const page = await browser.newPage();
    const fixture: ResponseRow = {
      id: 1,
      token: "test",
      created_at: new Date().toISOString(),
      profile: {
        firstName: "کاربر",
        lastName: "آزمایشی",
        phone: "",
        position: "",
        organization: "",
        education: "",
        field: "",
        experience: "",
        expertise: [],
        otherExpertise: "",
      },
      answers: Array(56).fill(2),
      notes: "نمونه آزمایشی",
    };
    for (const mode of ["summary", "individual", "all"] as const) {
      await page.setContent(reportHtml([fixture], mode));
      await page.evaluate(() => document.fonts.ready);
      const pdf = await page.pdf({ format: "A4", printBackground: true });
      assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
      assert(pdf.length > 10000);
      console.log(mode + ": PDF created, " + pdf.length + " bytes");
    }
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
