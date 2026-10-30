"use client";

import React from "react";

interface TicketStatusBadgeProps {
  status: string;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          Menunggu Penugasan
        </span>
      );
    case "ASSIGNED":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-ssm-blue-light text-ssm-blue">
          Petugas Ditugaskan
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
          Sedang Dikerjakan
        </span>
      );
    case "RESOLVED":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          Selesai Ditangani
        </span>
      );
    case "CLOSED":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
          Tiket Ditutup
        </span>
      );
    case "REJECTED":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
          Ditolak / Dialihkan
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
}
