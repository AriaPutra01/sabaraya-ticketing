"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, Clock, CheckCircle, AlertTriangle, User, MapPin, Building, Wrench, Shield, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function TrackContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(queryCode);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);

  useEffect(() => {
    // 1. Muat riwayat tiket otomatis dari cookie browser
    fetch("/api/tickets/track")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.mode === "history") {
          setHistoryTickets(res.data);
        }
      })
      .catch(() => {});

    // 2. Jika ada query parameter code, langsung cari tiketnya
    if (queryCode) {
      searchTicket(queryCode);
    }
  }, [queryCode]);

  const searchTicket = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) {
      toast.error("Masukkan kode tiket.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/track?code=${encodeURIComponent(codeToSearch.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Tiket tidak ditemukan.");
        setActiveTicket(null);
      } else {
        setActiveTicket(data.data);
      }
    } catch {
      toast.error("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Menunggu Penugasan</span>;
      case "ASSIGNED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Petugas Ditugaskan</span>;
      case "IN_PROGRESS":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Sedang Dikerjakan</span>;
      case "RESOLVED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Selesai Ditangani</span>;
      case "CLOSED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">Tiket Ditutup</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Ditolak / Dialihkan</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Lacak Status Pengaduan</h1>
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
          className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm transition disabled:opacity-50"
        >
          {loading ? "Mencari..." : "Lacak Tiket"}
        </button>
      </form>

      {/* Active Ticket Result */}
      {activeTicket && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-black text-blue-900 tracking-wider">
                  {activeTicket.code}
                </span>
                {getStatusBadge(activeTicket.status)}
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1">{activeTicket.title}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Diajukan pada:</p>
              <p className="font-medium text-slate-700">
                {format(new Date(activeTicket.createdAt), "dd MMMM yyyy, HH:mm", { locale: localeId })} WIB
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                Informasi Instansi & Pelapor
              </p>
              <p><span className="text-slate-500">Instansi:</span> <b className="text-slate-800">{activeTicket.institutionName}</b></p>
              <p><span className="text-slate-500">Pelapor:</span> {activeTicket.reporterName} ({activeTicket.reporterPhone})</p>
              <p><span className="text-slate-500">Wilayah:</span> {activeTicket.region?.name || "-"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                Petugas Penanggung Jawab
              </p>
              {activeTicket.assignee ? (
                <>
                  <p><span className="text-slate-500">Nama Petugas:</span> <b className="text-slate-800">{activeTicket.assignee.name}</b></p>
                  <p><span className="text-slate-500">Kontak:</span> {activeTicket.assignee.phone || "-"}</p>
                  <p><span className="text-slate-500">Divisi:</span> {activeTicket.division}</p>
                </>
              ) : (
                <p className="text-slate-500 italic">Belum ditugaskan / antrean round-robin siaga wilayah.</p>
              )}
            </div>
          </div>

          {activeTicket.resolutionNote && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-bold text-sm text-emerald-900">Catatan Penyelesaian Masalah:</p>
              <p className="leading-relaxed">{activeTicket.resolutionNote}</p>
            </div>
          )}

          {/* Activities Timeline */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Riwayat Perjalanan Tiket
            </h3>
            <div className="space-y-3">
              {activeTicket.activities?.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{act.note || act.action}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Oleh: {act.actorName} • {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History from Cookie */}
      {historyTickets.length > 0 && !activeTicket && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Pengaduan Terakhir di Perangkat Ini
          </h2>

          <div className="grid gap-3">
            {historyTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setInputCode(t.code);
                  searchTicket(t.code);
                }}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm text-left flex items-center justify-between transition group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-900">{t.code}</span>
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{t.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.institutionName} • Wilayah: {t.region?.name || "-"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
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
