import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const source = resolve(process.env.DATABASE_PATH || "./data/survey.sqlite");
if (!existsSync(source))
  throw new Error(
    "Database not created yet. Submit a response or sign in first.",
  );
mkdirSync("backups", { recursive: true });
const target = resolve(
  "backups",
  `survey-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
);
const db = new Database(source);
await db.backup(target);
db.close();
console.log(`Backup saved: ${target}`);
