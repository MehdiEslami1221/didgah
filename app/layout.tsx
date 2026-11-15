import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "دیدگاه | پرسشنامه سرمایه‌گذاری شهری",
  description:
    "سامانه پژوهش اجرای خط‌مشی‌های سرمایه‌گذاری شهری با تأکید بر توسعه پایدار",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
