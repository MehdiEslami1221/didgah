import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes } from "node:crypto";
let instance: Database.Database | undefined;
export function db() {
  if (instance) return instance;
  const file = resolve(process.env.DATABASE_PATH || "./data/survey.sqlite");
  mkdirSync(dirname(file), { recursive: true });
  instance = new Database(file);
  instance.pragma("journal_mode = WAL");
  instance.pragma("busy_timeout = 5000");
  instance.exec(`CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    profile TEXT NOT NULL, answers TEXT NOT NULL, notes TEXT NOT NULL
  ); CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,until_ms INTEGER NOT NULL);`);
  instance
    .prepare("INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)")
    .run("session_secret", randomBytes(48).toString("hex"));
  return instance;
}
export type ResponseRow = {
  id: number;
  token: string;
  created_at: string;
  profile: Profile;
  answers: number[];
  notes: string;
};
export type Profile = {
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  organization: string;
  education: string;
  field: string;
  experience: string;
  expertise: string[];
  otherExpertise: string;
};
export function rows(): ResponseRow[] {
  return (
    db().prepare("SELECT * FROM responses ORDER BY id DESC").all() as {
      id: number;
      token: string;
      created_at: string;
      profile: string;
      answers: string;
      notes: string;
    }[]
  ).map((r) => ({
    ...r,
    profile: JSON.parse(r.profile),
    answers: JSON.parse(r.answers),
  }));
}
export function rateLimit(key: string, max: number, windowMs: number) {
  return db().transaction(() => {
    const now = Date.now();
    db().prepare("DELETE FROM limits WHERE until_ms < ?").run(now);
    const r = db().prepare("SELECT count FROM limits WHERE key=?").get(key) as
      { count: number } | undefined;
    if (r && r.count >= max) return false;
    db()
      .prepare(
        "INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
      )
      .run(key, now + windowMs);
    return true;
  })();
}
export function deleteResponse(id: number) {
  return db().prepare("DELETE FROM responses WHERE id=?").run(id).changes === 1;
}
