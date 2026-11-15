import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { POST as submit } from "../app/api/responses/route";
import { POST as login } from "../app/api/login/route";
import { POST as logout } from "../app/api/logout/route";
import { verifySession, sameOrigin } from "../lib/auth";
import { db, rows } from "../lib/db";
import { reportHtml } from "../lib/report";
const dir = mkdtempSync(join(tmpdir(), "survey-routes-"));
process.env.DATABASE_PATH = join(dir, "test.sqlite");
const origin = "http://localhost:3000";
function request(path: string, body: unknown, source = origin) {
  return new Request(origin + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: source,
      Host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}
const p = {
  token: randomUUID(),
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
  answers: Array(56).fill(3),
  notes: "<script>alert(1)</script>",
};
test("submission retries return one saved row", async () => {
  const a = await submit(request("/api/responses", p));
  assert.equal(a.status, 201);
  const b = await submit(request("/api/responses", p));
  assert.equal(b.status, 200);
  assert.deepEqual(await a.json(), await b.json());
  assert.equal(rows().length, 1);
});
test("API rejects incomplete questionnaire and cross-origin writes", async () => {
  assert.equal(
    (await submit(request("/api/responses", { ...p, answers: [] }))).status,
    400,
  );
  assert.equal(
    (await submit(request("/api/responses", p, "https://other.example")))
      .status,
    403,
  );
});
test("login issues an authenticated, HttpOnly session; wrong password fails", async () => {
  const wrong = await login(
    request("/api/login", { username: "admin", password: "wrong" }),
  );
  assert.equal(wrong.status, 401);
  const good = await login(
    request("/api/login", { username: "admin", password: "admin" }),
  );
  assert.equal(good.status, 200);
  const cookie = good.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
  const token = cookie.split(";")[0].split("=")[1];
  assert.equal(await verifySession(token), true);
  assert.equal(await verifySession(token + "x"), false);
  assert.equal(await verifySession(), false);
});
test("logout expires session cookie and rejects foreign origin", async () => {
  const r = await logout(request("/api/logout", {}));
  assert.match(r.headers.get("set-cookie")!, /Max-Age=0/i);
  assert.equal(
    (await logout(request("/api/logout", {}, "https://other.example"))).status,
    403,
  );
});
test("explicit deployment origin takes priority", () => {
  process.env.APP_ORIGIN = "https://survey.example.com";
  assert.equal(
    sameOrigin(request("/api/login", {}, "https://survey.example.com")),
    true,
  );
  assert.equal(sameOrigin(request("/api/login", {})), false);
  delete process.env.APP_ORIGIN;
});
test("reports escape user content and include every question", () => {
  const html = reportHtml(rows(), "all");
  assert(!html.includes("<script>"));
  assert(html.includes("&lt;script&gt;"));
  assert(html.includes("۵۶."));
  assert(html.includes("پاسخ فردی"));
  assert(html.includes("data:font/woff2;base64,"));
});
process.on("exit", () => {
  db().close();
  rmSync(dir, { recursive: true, force: true });
});
