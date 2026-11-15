import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { submission } from "../lib/validation";
import { statistics } from "../lib/stats";
import { db, rows, rateLimit, deleteResponse } from "../lib/db";
import data from "../lib/survey.json";
const dir = mkdtempSync(join(tmpdir(), "survey-test-"));
process.env.DATABASE_PATH = join(dir, "test.sqlite");
const profile = {
  firstName: "مهدی",
  lastName: "اسلامی",
  phone: "",
  position: "",
  organization: "",
  education: "",
  field: "",
  experience: "",
  expertise: [],
  otherExpertise: "",
};
const payload = () => ({
  token: randomUUID(),
  profile,
  answers: Array(56).fill(0),
  notes: "",
});
test("56 consecutive questions in eight seven-question sections", () => {
  assert.deepEqual(
    data.questions.map((q) => q.id),
    Array.from({ length: 56 }, (_, i) => i + 1),
  );
  for (let i = 0; i < 8; i++)
    assert.equal(data.questions.filter((q) => q.section === i).length, 7);
});
test("accepts complete questionnaire and optional empty phone", () =>
  assert.equal(submission.safeParse(payload()).success, true));
test("rejects incomplete, out of range, null, and fractional answers", () => {
  for (const answers of [
    Array(55).fill(0),
    Array(56).fill(5),
    Array(56).fill(null),
    Array(56).fill(1.5),
  ])
    assert.equal(
      submission.safeParse({ ...payload(), answers }).success,
      false,
    );
});
test("requires real names and validates optional phone", () => {
  for (const p of [
    { ...profile, firstName: " " },
    { ...profile, phone: "abc" },
    { ...profile, lastName: "" },
  ])
    assert.equal(
      submission.safeParse({ ...payload(), profile: p }).success,
      false,
    );
  assert.equal(
    submission.safeParse({
      ...payload(),
      profile: { ...profile, phone: "۰۹۱۲۱۲۳۴۵۶۷" },
    }).success,
    true,
  );
});
test("SQLite persists complete answers and rejects duplicate tokens", () => {
  const p = payload();
  db()
    .prepare(
      "INSERT INTO responses(token,profile,answers,notes) VALUES(?,?,?,?)",
    )
    .run(p.token, JSON.stringify(p.profile), JSON.stringify(p.answers), "");
  assert.throws(() =>
    db()
      .prepare(
        "INSERT INTO responses(token,profile,answers,notes) VALUES(?,?,?,?)",
      )
      .run(p.token, "{}", "[]", ""),
  );
  assert.equal(rows().length, 1);
  assert.equal(rows()[0].answers.length, 56);
});
test("known distribution, means, and matrix ordering", () => {
  const a = rows()[0];
  const b = { ...a, answers: Array(56).fill(4) };
  const s = statistics([a, b]);
  assert.deepEqual(s.distribution, [56, 0, 0, 0, 56]);
  assert.equal(s.mean, 2);
  assert.equal(s.sections[0].mean, 2);
  assert.equal(s.matrix[0][0], null);
  assert.equal(s.matrix[7][6], 2);
  const unique = statistics([
    { ...a, answers: Array.from({ length: 56 }, (_, i) => i % 5) },
  ]);
  assert.equal(unique.matrix[1][0], 2);
  assert.equal(unique.matrix[1][2], 3);
  assert.equal(unique.matrix[7][6], 0);
});
test("empty statistics have finite zero totals", () => {
  const s = statistics([]);
  assert.equal(s.mean, 0);
  assert.deepEqual(s.distribution, [0, 0, 0, 0, 0]);
});
test("rate limiter enforces limit", () => {
  assert.equal(rateLimit("test", 1, 10000), true);
  assert.equal(rateLimit("test", 1, 10000), false);
});
test("deletion removes only the selected response and updates statistics", () => {
  const id = rows()[0].id;
  assert.equal(deleteResponse(id + 1000), false);
  assert.equal(deleteResponse(id), true);
  assert.equal(rows().length, 0);
  assert.equal(statistics(rows()).count, 0);
  assert.equal(deleteResponse(id), false);
});
process.on("exit", () => {
  db().close();
  rmSync(dir, { recursive: true, force: true });
});
