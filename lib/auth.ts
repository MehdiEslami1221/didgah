import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "./db";
export const cookieName = "urban_session";
function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ||
      (
        db()
          .prepare("SELECT value FROM settings WHERE key='session_secret'")
          .get() as { value: string }
      ).value,
  );
}
export async function createSession() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}
export async function isAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  return verifySession(token);
}
export async function verifySession(token?: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
export function matches(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  if (process.env.APP_ORIGIN) return origin === process.env.APP_ORIGIN;
  try {
    const parsed = new URL(origin);
    return (
      parsed.host === req.headers.get("host") &&
      ["http:", "https:"].includes(parsed.protocol)
    );
  } catch {
    return false;
  }
}
