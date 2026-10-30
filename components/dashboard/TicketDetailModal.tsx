"use client";

import React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle, XCircle, User } from "lucide-react";

interface TicketDetailModalProps {
  isOpen: boolean;
  ticket: any | null;
  currentUser: {
    id: string;
    role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
  };
  onClose: () => void;
  onStartProgress: (ticketId: string) => void;
  onOpenReject: (ticketId: string) => void;
  onOpenResolve: (ticketId: string) => void;
  onOpenAssign: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
}

export function TicketDetailModal({
  isOpen,
  ticket,
  currentUser,
  onClose,
  onStartProgress,
  onOpenReject,
  onOpenResolve,
  onOpenAssign,
  onCloseTicket,
}: TicketDetailModalProps) {
  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-2xl w-full space-y-5 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-lg sm:text-xl font-bold text-ssm-blue">{ticket.code}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ssm-blue-light text-ssm-blue">
                {ticket.division}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                {ticket.status}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">{ticket.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg shrink-0"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Deskripsi & Foto */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Rincian Keluhan:</p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>

          {(ticket.photoUrls?.length > 0 || ticket.photoUrl) && (
            <div className="pt-2 space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                Lampiran Bukti Foto ({ticket.photoUrls?.length || 1} Foto):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(ticket.photoUrls?.length > 0 ? ticket.photoUrls : [ticket.photoUrl]).map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-200 aspect-video hover:opacity-90 hover:ring-2 hover:ring-ssm-blue transition bg-slate-100"
                  >
                    <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informasi Instansi & Perangkat */}
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="font-bold text-slate-900 mb-1">Informasi Instansi</p>
            <p><span className="text-slate-500">Instansi:</span> <b>{ticket.institutionName}</b></p>
            <p><span className="text-slate-500">Pelapor:</span> {ticket.reporterName} ({ticket.reporterPhone})</p>
            <p><span className="text-slate-500">Alamat:</span> {ticket.reporterAddress || "-"}</p>
            <p><span className="text-slate-500">Wilayah:</span> {ticket.region?.name || "-"}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="font-bold text-slate-900 mb-1">Informasi Perangkat</p>
            <p><span className="text-slate-500">Merek/Tipe:</span> {ticket.deviceBrand || "-"}</p>
            <p><span className="text-slate-500">Nomor Seri:</span> {ticket.serialNumber || "-"}</p>
            <p><span className="text-slate-500">Urgensi:</span> <b>{ticket.priority}</b></p>
            <p><span className="text-slate-500">Petugas:</span> <b>{ticket.assignee?.name || "Belum ditugaskan"}</b></p>
          </div>
        </div>

        {/* Riwayat Aktivitas */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Riwayat Perjalanan Tiket:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {ticket.activities?.map((act: any) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <p className="font-semibold text-slate-800">{act.note || act.action}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Oleh: {act.actorName} • {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center"
          >
            Tutup Jendela
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Employee Actions */}
            {currentUser.role === "EMPLOYEE" && ticket.assigneeId === currentUser.id && (
              <>
                {ticket.status === "ASSIGNED" && (
                  <>
                    <button
                      onClick={() => onStartProgress(ticket.id)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Terima Tugas (Setuju)
                    </button>
                    <button
                      onClick={() => onOpenReject(ticket.id)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Tolak Tugas
                    </button>
                  </>
                )}

                {ticket.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => onOpenResolve(ticket.id)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Selesaikan Tiket
                  </button>
                )}
              </>
            )}

            {/* Admin Actions */}
            {(currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN") && (
              <>
                {ticket.status === "PENDING" && (
                  <button
                    onClick={() => onOpenAssign(ticket.id)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Tugaskan Petugas
                  </button>
                )}

                {ticket.status === "RESOLVED" && (
                  <button
                    onClick={() => onCloseTicket(ticket.id)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Tutup Tiket Resmi
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
