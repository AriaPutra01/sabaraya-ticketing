"use client";

import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface RejectModalProps {
  isOpen: boolean;
  reason: string;
  onChangeReason: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RejectTicketModal({
  isOpen,
  reason,
  onChangeReason,
  onClose,
  onSubmit,
}: RejectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-base text-slate-900">Tolak Tiket Pengaduan</h3>
        </div>
        <p className="text-xs text-slate-600">
          Penolakan tiket wajib menyertakan alasan jelas. Tiket akan otomatis dialihkan oleh sistem round-robin ke staf siaga berikutnya.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Alasan Penolakan * (Minimal 5 karakter)
          </label>
          <textarea
            rows={3}
            required
            placeholder="Contoh: Sedang menangani unit emergensi di lokasi lain / sparepart tidak ready..."
            value={reason}
            onChange={(e) => onChangeReason(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
            type="button"
            onClick={onSubmit}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 text-center"
          >
            Kirim Penolakan
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResolveModalProps {
  isOpen: boolean;
  note: string;
  onChangeNote: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ResolveTicketModal({
  isOpen,
  note,
  onChangeNote,
  onClose,
  onSubmit,
}: ResolveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-emerald-600">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Selesaikan Tiket Pengaduan</span>
        </h3>
        <p className="text-xs text-slate-600">
          Berikan rangkuman tindakan dan hasil penanganan yang telah dilakukan untuk catatan pengadu & sistem.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Catatan Hasil Penanganan *
          </label>
          <textarea
            rows={3}
            required
            placeholder="Contoh: Pembersihan probe sampel berhasil, running kalibrasi normal dan hasil kontrol masuk rentang..."
            value={note}
            onChange={(e) => onChangeNote(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            type="button"
            onClick={onSubmit}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 text-center"
          >
            Selesaikan Tiket
          </button>
        </div>
      </div>
    </div>
  );
}

interface AssignModalProps {
  isOpen: boolean;
  assigneeId: string;
  employees: Array<{ id: string; name: string; division: string; phone?: string | null }>;
  onChangeAssignee: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function AssignTicketModal({
  isOpen,
  assigneeId,
  employees,
  onChangeAssignee,
  onClose,
  onSubmit,
}: AssignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="font-bold text-base text-slate-900">Tugaskan Tiket Secara Manual</h3>
        <p className="text-xs text-slate-600">
          Pilih staf teknisi atau IT yang akan menangani tiket ini.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Staf</label>
          <select
            value={assigneeId}
            onChange={(e) => onChangeAssignee(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ssm-blue"
          >
            <option value="">-- Pilih Staf --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.division}) - {emp.phone || "No HP kosong"}
              </option>
            ))}
          </select>
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
            type="button"
            onClick={onSubmit}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold text-center"
          >
            Tugaskan
          </button>
        </div>
      </div>
    </div>
  );
}
