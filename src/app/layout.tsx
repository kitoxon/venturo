import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venturo",
  description: "AI-powered forecasts and KPI insights for SMBs",
  icons: {
    icon: "/favicon.ico",
  },
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
