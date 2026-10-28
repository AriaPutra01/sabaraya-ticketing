import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Link from "next/link";
import { ShieldAlert, Search, LogIn } from "lucide-react";

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
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-blue-900">
              <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-extrabold shadow-sm">
                S
              </div>
              <span className="tracking-tight">Sabaraya<span className="text-blue-600 font-medium">Ticketing</span></span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
              <Link
                href="/pengaduan"
                className="px-3 py-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Buat</span> Pengaduan
              </Link>
              <Link
                href="/lacak"
                className="px-3 py-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <Search className="w-4 h-4 text-emerald-600" />
                Lacak Tiket
              </Link>
              <Link
                href="/masuk"
                className="ml-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Staf</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>© 2026 Sabaraya Ticketing. Layanan Cepat & Tanggap Fasilitas Kesehatan.</p>
        </footer>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
