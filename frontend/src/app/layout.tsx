import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CompareBar } from "@/components/compare/CompareBar";
import { ToastStack } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "College Discovery MVP",
  description:
    "Find colleges by study goal, program and entrance exam — 1,203 colleges across India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 pb-24">{children}</main>
            <Footer />
          </div>
          <CompareBar />
          <ToastStack />
        </Providers>
      </body>
    </html>
  );
}
