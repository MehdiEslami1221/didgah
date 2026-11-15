import { NextResponse } from "next/server";
import { cookieName, sameOrigin } from "@/lib/auth";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 403 });
  const r = NextResponse.json({ ok: true });
  r.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  return r;
}
