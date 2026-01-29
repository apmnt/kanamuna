import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanamuna",
  description: "Kana training quiz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
