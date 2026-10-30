"use client";

import React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Building, Shield, MessageSquare, Clock } from "lucide-react";
import { TicketStatusBadge } from "./TicketStatusBadge";

interface TicketTrackDetailProps {
  ticket: any;
}

export function TicketTrackDetail({ ticket }: TicketTrackDetailProps) {
  const handleOpenTicketChat = () => {
    window.dispatchEvent(
      new CustomEvent("open-ticket-chat", {
        detail: { ticketCode: ticket.code },
      })
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-black text-ssm-blue tracking-wider">
              {ticket.code}
            </span>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1">{ticket.title}</p>
        </div>
        <div className="text-left sm:text-right text-xs text-slate-500">
          <p>Diajukan pada:</p>
          <p className="font-medium text-slate-700">
            {format(new Date(ticket.createdAt), "dd MMMM yyyy, HH:mm", { locale: localeId })} WIB
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Building className="w-4 h-4 text-ssm-blue" />
            Informasi Instansi & Pelapor
          </p>
          <p>
            <span className="text-slate-500">Instansi:</span>{" "}
            <b className="text-slate-800">{ticket.institutionName}</b>
          </p>
          <p>
            <span className="text-slate-500">Pelapor:</span> {ticket.reporterName} ({ticket.reporterPhone})
          </p>
          <p>
            <span className="text-slate-500">Wilayah:</span> {ticket.region?.name || "-"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            Petugas Penanggung Jawab
          </p>
          {ticket.assignee ? (
            <>
              <p>
                <span className="text-slate-500">Nama Petugas:</span>{" "}
                <b className="text-slate-800">{ticket.assignee.name}</b>
              </p>
              <p>
                <span className="text-slate-500">Kontak:</span> {ticket.assignee.phone || "-"}
              </p>
              <p>
                <span className="text-slate-500">Divisi:</span> {ticket.division}
              </p>
            </>
          ) : (
            <p className="text-slate-500 italic">Belum ditugaskan / antrean round-robin siaga wilayah.</p>
          )}
        </div>
      </div>

      {ticket.resolutionNote && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <p className="font-bold text-sm text-emerald-900">Catatan Penyelesaian Masalah:</p>
          <p className="leading-relaxed">{ticket.resolutionNote}</p>
        </div>
      )}

      {/* Lampiran Foto Kendala */}
      {(ticket.photoUrls?.length > 0 || ticket.photoUrl) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Lampiran Foto Bukti Kendala:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

      {/* Pusat Bantuan & Live Chat Terkait Tiket */}
      <div className="p-4 rounded-2xl bg-ssm-blue-light/60 border border-ssm-blue/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-ssm-blue flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-ssm-blue" />
            Pusat Bantuan & Live CS Tiket
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Konsultasikan kendala atau tanyakan tindak lanjut tiket ini langsung kepada CS & AI Assistant.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenTicketChat}
          className="px-4 py-2.5 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat CS Tiket Ini</span>
        </button>
      </div>

      {/* Activities Timeline */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-ssm-blue" />
          Riwayat Perjalanan Tiket
        </h3>
        <div className="space-y-3">
          {ticket.activities?.map((act: any) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="w-2 h-2 mt-1.5 rounded-full bg-ssm-blue" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{act.note || act.action}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  Oleh: {act.actorName} •{" "}
                  {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
