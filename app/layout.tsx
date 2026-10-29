import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Link from "next/link";
import { ShieldAlert, Search } from "lucide-react";
import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";
import { AuthNavButton } from "@/components/layout/AuthNavButton";

export const metadata: Metadata = {
  title: "Sabaraya Ticketing — Sistem Pengaduan & Layanan Purna Jual",
  description: "Manajemen pengaduan teknisi lab medis & sistem IT LIS dengan penugasan cerdas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:border-ssm-blue transition">
                <img
                  src="/logo-ssm.png"
                  alt="Logo SSM"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-tight tracking-tight text-slate-900">
                  SABARAYA<span className="text-ssm-blue font-medium ml-1">Ticketing</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  PT Sabaraya Sagara Mandiri
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
              <Link
                href="/pengaduan"
                className="px-3 py-2 rounded-lg text-slate-700 hover:text-ssm-blue hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-4 h-4 text-ssm-blue" />
                <span className="hidden sm:inline">Buat</span> Pengaduan
              </Link>
              <Link
                href="/lacak"
                className="px-3 py-2 rounded-lg text-slate-700 hover:text-ssm-blue hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <Search className="w-4 h-4 text-slate-500" />
                Lacak Tiket
              </Link>
              <AuthNavButton />
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>© 2026 Sabaraya Ticketing. Layanan Cepat & Tanggap Fasilitas Kesehatan.</p>
        </footer>

        <FloatingChatWidget />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
