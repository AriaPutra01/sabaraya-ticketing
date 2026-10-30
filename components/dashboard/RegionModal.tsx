"use client";

import React from "react";

interface RegionModalProps {
  isOpen: boolean;
  region: {
    isEdit: boolean;
    id?: string;
    name: string;
    coverage: string;
  };
  onChange: (fields: Partial<RegionModalProps["region"]>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegionModal({
  isOpen,
  region,
  onChange,
  onClose,
  onSubmit,
}: RegionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <h3 className="font-bold text-base text-slate-900">
          {region.isEdit ? "Ubah Data Daerah" : "Tambah Master Daerah Baru"}
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nama Daerah *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Priangan Timur"
            value={region.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Rincian Cakupan Wilayah *</label>
          <textarea
            rows={3}
            required
            placeholder="Contoh: Kota Tasikmalaya, Kab. Tasikmalaya, Ciamis, Banjar, Pangandaran, Garut"
            value={region.coverage}
            onChange={(e) => onChange({ coverage: e.target.value })}
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
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
