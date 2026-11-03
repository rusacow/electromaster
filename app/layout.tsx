import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElectroMaster — кабинет электромонтажника",
  description:
    "Рабочая платформа для электромонтажников: проекты, сметы, чертежи и инженерные расчёты."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
