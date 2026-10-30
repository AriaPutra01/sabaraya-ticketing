"use client";

import React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Search,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";

interface TicketsTabProps {
  tickets: any[];
  user: {
    id: string;
    role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
  };
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  divisionFilter: string;
  onDivisionFilterChange: (val: string) => void;
  onResetFilter: () => void;
  runningAutoAssign: boolean;
  onTriggerAutoAssign: () => void;
  onOpenDetail: (ticket: any) => void;
  onStartProgress: (ticketId: string) => void;
  onOpenReject: (ticketId: string) => void;
  onOpenResolve: (ticketId: string) => void;
  onOpenAssign: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
}

export function TicketsTab({
  tickets,
  user,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  divisionFilter,
  onDivisionFilterChange,
  onResetFilter,
  runningAutoAssign,
  onTriggerAutoAssign,
  onOpenDetail,
  onStartProgress,
  onOpenReject,
  onOpenResolve,
  onOpenAssign,
  onCloseTicket,
}: TicketsTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters & Search Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari kode tiket, instansi, pelapor, atau judul..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ssm-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={divisionFilter}
            onChange={(e) => onDivisionFilterChange(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">Semua Divisi</option>
            <option value="TEKNISI">TEKNISI</option>
            <option value="IT">IT</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800">
          Daftar Tiket ({tickets.length} Tiket Ditemukan)
        </h2>

        {["ADMIN", "SUPERADMIN"].includes(user.role) && (
          <button
            onClick={onTriggerAutoAssign}
            disabled={runningAutoAssign}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-sm"
            title="Tugaskan otomatis tiket pending yang belum di-assign lebih dari 30 menit"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{runningAutoAssign ? "Memproses..." : "⚡ Jalankan Auto-Assign (>30 Mnt)"}</span>
          </button>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <p className="text-slate-500 text-sm">Tidak ada tiket yang cocok dengan filter atau pencarian.</p>
          {(searchQuery || statusFilter !== "ALL" || divisionFilter !== "ALL") && (
            <button
              type="button"
              onClick={onResetFilter}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5 sm:space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-mono text-sm font-bold text-ssm-blue">{t.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    {t.division}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      t.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : t.status === "ASSIGNED"
                        ? "bg-ssm-blue-light text-ssm-blue"
                        : t.status === "IN_PROGRESS"
                        ? "bg-purple-100 text-purple-800"
                        : t.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      t.priority === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}
                  >
                    Urgensi: {t.priority}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {format(new Date(t.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                <p>
                  <span className="text-slate-400">Instansi:</span> <b>{t.institutionName}</b>
                </p>
                <p>
                  <span className="text-slate-400">Pelapor:</span> {t.reporterName} ({t.reporterPhone})
                </p>
                <p>
                  <span className="text-slate-400">Wilayah:</span> {t.region?.name || "-"}
                </p>
                <p>
                  <span className="text-slate-400">Petugas:</span>{" "}
                  <b>{t.assignee?.name || "Belum ditugaskan"}</b>
                </p>
                {t.rejectionReason && (
                  <p className="sm:col-span-2 text-rose-700">
                    <span className="text-slate-400">Alasan Tolak Terakhir:</span> {t.rejectionReason}
                  </p>
                )}
                {t.resolutionNote && (
                  <p className="sm:col-span-2 text-emerald-700">
                    <span className="text-slate-400">Penyelesaian:</span> {t.resolutionNote}
                  </p>
                )}
              </div>

              {/* Actions according to role & status */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onOpenDetail(t)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lihat Rincian
                </button>

                {/* Employee Actions */}
                {user.role === "EMPLOYEE" && t.assigneeId === user.id && (
                  <>
                    {t.status === "ASSIGNED" && (
                      <>
                        <button
                          onClick={() => onStartProgress(t.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Terima Tugas (Setuju)
                        </button>

                        <button
                          onClick={() => onOpenReject(t.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak Tugas
                        </button>
                      </>
                    )}

                    {t.status === "IN_PROGRESS" && (
                      <>
                        <button
                          onClick={() => onOpenResolve(t.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Selesaikan Tiket
                        </button>

                        <button
                          onClick={() => onOpenReject(t.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Alihkan / Tolak Tiket
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Admin / Superadmin Actions */}
                {["ADMIN", "SUPERADMIN"].includes(user.role) && (
                  <>
                    <button
                      onClick={() => onOpenAssign(t.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                        t.status === "PENDING"
                          ? "bg-ssm-blue hover:bg-ssm-blue-hover text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      {t.status === "PENDING" ? "Tugaskan Petugas" : "Ubah Petugas"}
                    </button>

                    {t.status === "RESOLVED" && (
                      <button
                        onClick={() => onCloseTicket(t.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Tutup Tiket Resmi
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
