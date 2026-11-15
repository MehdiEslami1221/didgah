import { rows } from "./db";
export function selectReport(url: URL) {
  const mode = url.searchParams.get("mode") || "summary";
  if (!["summary", "all", "individual"].includes(mode))
    throw new Error("نوع گزارش نامعتبر است.");
  let list = rows();
  if (mode === "individual") {
    const id = Number(url.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1)
      throw new Error("کد پاسخ نامعتبر است.");
    list = list.filter((r) => r.id === id);
    if (!list.length) throw new Error("پاسخ پیدا نشد.");
  }
  return { list, mode: mode as "summary" | "all" | "individual" };
}
