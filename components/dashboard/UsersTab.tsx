"use client";

import React from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";

interface UsersTabProps {
  usersList: any[];
  currentUserId: string;
  onOpenAdd: () => void;
  onOpenEdit: (user: any) => void;
  onToggleActive: (user: any) => void;
  onDelete: (id: string, name: string) => void;
}

export function UsersTab({
  usersList,
  currentUserId,
  onOpenAdd,
  onOpenEdit,
  onToggleActive,
  onDelete,
}: UsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">
          Daftar Pengguna ({usersList.length})
        </h2>
        <button
          onClick={onOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun Baru
        </button>
      </div>

      <div className="grid gap-3">
        {usersList.map((u) => (
          <div
            key={u.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm text-slate-900">{u.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                  {u.role}
                </span>
                {u.division && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ssm-blue-light text-ssm-blue">
                    {u.division}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {u.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{u.email} • Telp: {u.phone || "-"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
              <button
                onClick={() => onOpenEdit(u)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                title="Ubah Pengguna"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleActive(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  u.isActive
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {u.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
              {u.id !== currentUserId && (
                <button
                  onClick={() => onDelete(u.id, u.name)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                  title="Hapus Pengguna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
