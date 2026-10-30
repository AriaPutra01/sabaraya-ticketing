"use client";

import React from "react";

interface ScheduleModalProps {
  isOpen: boolean;
  schedule: {
    userId: string;
    regionId: string;
    startTime: string;
    endTime: string;
    notes: string;
  };
  employees: Array<{ id: string; name: string; division: string }>;
  regions: Array<{ id: string; name: string }>;
  onChange: (fields: Partial<ScheduleModalProps["schedule"]>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ScheduleModal({
  isOpen,
  schedule,
  employees,
  regions,
  onChange,
  onClose,
  onSubmit,
}: ScheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <h3 className="font-bold text-base text-slate-900">Tambah Jadwal Siaga Karyawan</h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
          <select
            required
            value={schedule.userId}
            onChange={(e) => onChange({ userId: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.division})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Daerah Jaga</label>
          <select
            required
            value={schedule.regionId}
            onChange={(e) => onChange({ regionId: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mulai</label>
            <input
              type="datetime-local"
              required
              value={schedule.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
            <input
              type="datetime-local"
              required
              value={schedule.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
          <input
            type="text"
            value={schedule.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 text-center"
          >
            Batal
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold text-center"
          >
            Simpan Jadwal
          </button>
        </div>
      </form>
    </div>
  );
}
