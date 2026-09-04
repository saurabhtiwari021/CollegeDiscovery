import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "College Discovery MVP — API",
  description: "Backend API for the College Discovery MVP (Next.js + Prisma + PostgreSQL).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
