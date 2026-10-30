"use client";

import React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Plus, Clock } from "lucide-react";

interface SchedulesTabProps {
  schedules: any[];
  onOpenAdd: () => void;
  onDelete: (id: string) => void;
}

export function SchedulesTab({ schedules, onOpenAdd, onDelete }: SchedulesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">
          Jadwal Siaga Karyawan ({schedules.length})
        </h2>
        <button
          onClick={onOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal Siaga
        </button>
      </div>

      <div className="grid gap-3">
        {schedules.map((s) => (
          <div
            key={s.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm text-slate-900">{s.user.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ssm-blue-light text-ssm-blue">
                  {s.user.division}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Wilayah: {s.region.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Cakupan: {s.region.coverage}</p>
              <p className="text-xs text-slate-700 mt-1 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-ssm-blue shrink-0" />
                {format(new Date(s.startTime), "dd MMM yyyy, HH:mm", { locale: localeId })} s/d{" "}
                {format(new Date(s.endTime), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
              {s.notes && <p className="text-[11px] text-slate-400 mt-0.5">Catatan: {s.notes}</p>}
            </div>

            <button
              onClick={() => onDelete(s.id)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition text-center"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
