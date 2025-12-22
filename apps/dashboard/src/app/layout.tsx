import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "org-code-ai | AI-Powered Code Security",
  description: "AI-powered vulnerability scanning across your entire GitHub organization. Detect. Fix. Deploy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-50`}
      >
        <div className="flex min-h-screen">
          {/* Sidebar - Fixed width, no animations */}
          <Sidebar />
          
          {/* Main content - Fluid, scrollable */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
