"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Email atau password salah.");
        setLoading(false);
        return;
      }

      toast.success("Berhasil masuk.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 p-2 shadow-xs mb-4 flex items-center justify-center">
          <img
            src="/logo-ssm.png"
            alt="Logo Sabaraya Sagara Mandiri"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Portal Masuk Staf</h1>
        <p className="mt-1 text-xs text-slate-500">
          PT Sabaraya Sagara Mandiri — Sistem Manajemen Tiket Layanan Lab
        </p>
      </div>

      <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Staf</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="nama@sabaraya.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white font-bold text-sm shadow-md shadow-ssm-blue/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
