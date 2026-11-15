import { NextResponse } from "next/server";
import { cookieName, createSession, matches, sameOrigin } from "@/lib/auth";
import { rateLimit } from "@/lib/db";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "درخواست نامعتبر است." },
      { status: 403 },
    );
  if (!rateLimit("login", 30, 15 * 60000))
    return NextResponse.json(
      { error: "تلاش‌های ورود زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید." },
      { status: 429 },
    );
  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json(
      { error: "درخواست نامعتبر است." },
      { status: 400 },
    );
  }
  if (
    typeof b.username !== "string" ||
    typeof b.password !== "string" ||
    !matches(b.username, process.env.ADMIN_USERNAME || "admin") ||
    !matches(b.password, process.env.ADMIN_PASSWORD || "admin")
  )
    return NextResponse.json(
      { error: "نام کاربری یا رمز عبور اشتباه است." },
      { status: 401 },
    );
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, await createSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 28800,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
