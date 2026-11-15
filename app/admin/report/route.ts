import { isAdmin } from "@/lib/auth";
import { selectReport } from "@/lib/report-selection";
import { reportHtml } from "@/lib/report";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.redirect(new URL("/admin", req.url));
  try {
    const { list, mode } = selectReport(new URL(req.url));
    let html = reportHtml(list, mode);
    html = html.replace(
      "<body>",
      '<body><div class="toolbar"><button onclick="window.print()">چاپ / ذخیره PDF</button><a href="/admin">بازگشت به پنل</a></div>',
    );
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("گزارش پیدا نشد.", { status: 404 });
  }
}
