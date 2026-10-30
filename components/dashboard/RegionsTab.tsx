"use client";

import React from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";

interface RegionsTabProps {
  regions: any[];
  onOpenAdd: () => void;
  onOpenEdit: (region: any) => void;
  onToggleActive: (region: any) => void;
  onDelete: (id: string, name: string) => void;
}

export function RegionsTab({
  regions,
  onOpenAdd,
  onOpenEdit,
  onToggleActive,
  onDelete,
}: RegionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">
          Master Daerah & Cakupan ({regions.length})
        </h2>
        <button
          onClick={onOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Daerah Baru
        </button>
      </div>

      <div className="grid gap-3">
        {regions.map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm text-slate-900">{r.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {r.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <span className="font-semibold text-slate-800">Cakupan Wilayah: </span>
                {r.coverage}
              </p>
              <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                <span>Tiket: {r._count?.tickets ?? 0}</span>
                <span>Jadwal Aktif: {r._count?.schedules ?? 0}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
              <button
                onClick={() => onOpenEdit(r)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                title="Ubah Rincian"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleActive(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  r.isActive
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {r.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button
                onClick={() => onDelete(r.id, r.name)}
                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                title="Hapus Daerah"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
