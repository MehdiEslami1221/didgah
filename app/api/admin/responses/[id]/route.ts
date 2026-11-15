import { isAdmin, sameOrigin } from "@/lib/auth";
import { deleteResponse } from "@/lib/db";
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin()))
    return Response.json({ error: "ابتدا وارد پنل شوید." }, { status: 401 });
  if (!sameOrigin(req))
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 403 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return Response.json({ error: "کد پاسخ نامعتبر است." }, { status: 400 });
  if (!deleteResponse(Number(id)))
    return Response.json(
      { error: "پاسخ پیدا نشد یا قبلاً حذف شده است." },
      { status: 404 },
    );
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
