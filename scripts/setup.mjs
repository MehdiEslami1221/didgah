import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (!existsSync(".env.local")) {
  writeFileSync(
    ".env.local",
    `ADMIN_USERNAME=admin\nADMIN_PASSWORD=admin\nSESSION_SECRET=${randomBytes(48).toString("hex")}\nDATABASE_PATH=./data/survey.sqlite\nCOOKIE_SECURE=false\n# APP_ORIGIN=https://survey.example.com\n# CHROMIUM_PATH=/usr/bin/chromium\n`,
    { mode: 0o600 },
  );
  console.log("Created .env.local. Local login: admin / admin.");
} else console.log(".env.local already exists; kept unchanged.");
mkdirSync("data", { recursive: true });
