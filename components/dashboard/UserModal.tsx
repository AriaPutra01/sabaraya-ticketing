"use client";

import React from "react";

interface UserModalProps {
  isOpen: boolean;
  user: {
    isEdit: boolean;
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
    division?: string;
    phone: string;
    maxActiveTickets?: number;
  };
  onChange: (fields: Partial<UserModalProps["user"]>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function UserModal({
  isOpen,
  user,
  onChange,
  onClose,
  onSubmit,
}: UserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <h3 className="font-bold text-base text-slate-900">
          {user.isEdit ? "Ubah Akun Pengguna" : "Tambah Akun Pengguna Baru"}
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
          <input
            type="text"
            required
            placeholder="Nama Staf / Admin"
            value={user.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            required
            placeholder="email@sabaraya.id"
            value={user.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Kata Sandi {user.isEdit ? "(Kosongkan jika tidak diubah)" : "*"}
          </label>
          <input
            type="password"
            required={!user.isEdit}
            placeholder={user.isEdit ? "Minimal 6 karakter..." : "Minimal 6 karakter"}
            value={user.password || ""}
            onChange={(e) => onChange({ password: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role) *</label>
            <select
              value={user.role}
              onChange={(e) => onChange({ role: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            >
              <option value="EMPLOYEE">Karyawan</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {user.role === "EMPLOYEE" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Divisi *</label>
              <select
                value={user.division}
                onChange={(e) => onChange({ division: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                <option value="TEKNISI">TEKNISI</option>
                <option value="IT">IT</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
            <input
              type="text"
              placeholder="08123456789"
              value={user.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Batas Maks Tiket</label>
            <input
              type="number"
              min={1}
              max={20}
              value={user.maxActiveTickets || 5}
              onChange={(e) => onChange({ maxActiveTickets: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>
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
            {user.isEdit ? "Perbarui Pengguna" : "Buat Akun"}
          </button>
        </div>
      </form>
    </div>
  );
}
