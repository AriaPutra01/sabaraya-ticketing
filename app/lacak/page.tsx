"use client";

import { Suspense } from "react";
import { Search, Clock, ArrowRight } from "lucide-react";
import { useTicketTrack } from "@/hooks/useTicketTrack";
import { TicketStatusBadge } from "@/components/lacak/TicketStatusBadge";
import { TicketTrackDetail } from "@/components/lacak/TicketTrackDetail";

function TrackContent() {
  const {
    inputCode,
    setInputCode,
    loading,
    activeTicket,
    historyTickets,
    searchTicket,
  } = useTicketTrack();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Lacak Status Pengaduan
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cari tiket menggunakan kode referensi Anda atau lihat riwayat otomatis yang tersimpan di perangkat ini.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchTicket(inputCode);
        }}
        className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2"
      >
        <Search className="w-5 h-5 text-slate-400 ml-3" />
        <input
          type="text"
          placeholder="Masukkan Kode Tiket (Contoh: SBY-2610-1234)"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          className="flex-1 px-3 py-2 text-sm text-slate-900 uppercase font-mono tracking-wider focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white font-semibold text-sm transition disabled:opacity-50"
        >
          {loading ? "Mencari..." : "Lacak Tiket"}
        </button>
      </form>

      {/* Active Ticket Result */}
      {activeTicket && <TicketTrackDetail ticket={activeTicket} />}

      {/* History from Cookie */}
      {historyTickets.length > 0 && !activeTicket && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ssm-blue" />
            Pengaduan Terakhir di Perangkat Ini
          </h2>

          <div className="grid gap-3">
            {historyTickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setInputCode(t.code);
                  searchTicket(t.code);
                }}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-ssm-blue hover:shadow-sm text-left flex items-center justify-between transition group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-ssm-blue">{t.code}</span>
                    <TicketStatusBadge status={t.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{t.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.institutionName} • Wilayah: {t.region?.name || "-"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-ssm-blue transition" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LacakPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-slate-500">Memuat modul pelacakan...</div>}>
      <TrackContent />
    </Suspense>
  );
}
