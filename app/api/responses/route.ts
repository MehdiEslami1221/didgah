import { db, rateLimit } from "@/lib/db";
import { submission } from "@/lib/validation";
import { sameOrigin } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 24000)
    return Response.json(
      { error: "حجم اطلاعات بیش از حد مجاز است." },
      { status: 413 },
    );
  let parsed;
  try {
    parsed = submission.safeParse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "اطلاعات نامعتبر است." }, { status: 400 });
  }
  if (!parsed.success)
    return Response.json(
      {
        error:
          "نام، نام خانوادگی، شماره تماس و پاسخ همه ۵۶ سؤال را بررسی کنید.",
      },
      { status: 400 },
    );
  const { token, profile, answers, notes } = parsed.data;
  // A stable client token makes retries safe without blocking different people on one network.
  const existing = db()
    .prepare("SELECT id FROM responses WHERE token=?")
    .get(token) as { id: number } | undefined;
  if (existing) return Response.json({ id: existing.id });
  if (!rateLimit("submissions", 300, 3600000))
    return Response.json(
      { error: "تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید." },
      { status: 429 },
    );
  const result = db()
    .prepare(
      "INSERT OR IGNORE INTO responses(token,profile,answers,notes) VALUES (?,?,?,?)",
    )
    .run(token, JSON.stringify(profile), JSON.stringify(answers), notes);
  const id = result.changes
    ? Number(result.lastInsertRowid)
    : (
        db().prepare("SELECT id FROM responses WHERE token=?").get(token) as {
          id: number;
        }
      ).id;
  return Response.json({ id }, { status: 201 });
}
