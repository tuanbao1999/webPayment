import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Quản lý chi tiêu",
  description: "Ghi chi tiêu nhóm, chia bill, tick đã chuyển khoản",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <div className="mx-auto max-w-2xl px-4 pb-12 pt-4">
          <header className="mb-2">
            <h1 className="text-xl font-bold">Quản lý chi tiêu</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Chi trước — thu lại — tick đã CK
            </p>
          </header>
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
