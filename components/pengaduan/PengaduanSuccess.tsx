"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Copy } from "lucide-react";

interface PengaduanSuccessProps {
  code: string;
  onReset: () => void;
}

export function PengaduanSuccess({ code, onReset }: PengaduanSuccessProps) {
  const router = useRouter();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Kode tiket berhasil disalin!");
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pengaduan Berhasil Diterima</h2>
          <p className="mt-1 text-sm text-slate-600">
            Simpan kode tiket berikut untuk memantau status pengerjaan secara berkala.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <span className="font-mono text-xl font-bold tracking-wider text-ssm-blue">
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-2 text-slate-600 hover:text-ssm-blue hover:bg-slate-200 rounded-lg transition"
            title="Salin Kode"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-ssm-blue-light/60 border border-ssm-blue/20 text-left text-xs text-slate-800 space-y-1">
          <p className="font-semibold text-ssm-blue">Status Penugasan:</p>
          <p className="text-amber-800 font-medium">
            ⏳ Berhasil terdaftar (Menunggu Penugasan). Tim operasional sedang meninjau dan menugaskan staf siaga terdekat.
          </p>
          <p className="text-slate-500 pt-1">
            Tiket ini juga telah disimpan otomatis di browser Anda pada menu Lacak Tiket.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/lacak?code=${code}`)}
            className="flex-1 py-3 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white font-semibold text-sm transition"
          >
            Lacak Tiket Sekarang
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Buat Baru
          </button>
        </div>
      </div>
    </div>
  );
}
