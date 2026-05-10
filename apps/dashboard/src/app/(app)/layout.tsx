import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeProvider } from "@/lib/theme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-gray-950 dark:bg-gray-950 data-[theme=light]:bg-white data-[theme=midnight]:bg-[#07071a]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </ThemeProvider>
  );
}
