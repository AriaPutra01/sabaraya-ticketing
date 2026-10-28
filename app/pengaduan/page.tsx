"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wrench, Monitor, MapPin, Building2, User, Phone, AlertCircle, CheckCircle2, Copy, Upload, Image as ImageIcon } from "lucide-react";

interface RegionItem {
  id: string;
  name: string;
  coverage: string;
}

export default function PengaduanPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successData, setSuccessData] = useState<{ code: string; assigned: boolean; assigneeName: string | null } | null>(null);

  const [formData, setFormData] = useState({
    division: "TEKNISI",
    regionId: "",
    institutionName: "",
    reporterName: "",
    reporterPhone: "",
    reporterAddress: "",
    deviceBrand: "",
    serialNumber: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    photoUrl: "",
  });

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setRegions(res.data);
          setFormData((prev) => ({ ...prev, regionId: res.data[0].id }));
        }
      })
      .catch(() => toast.error("Gagal memuat daftar wilayah."));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB.");
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, photoUrl: data.url }));
        toast.success("Foto berhasil diunggah.");
      } else {
        toast.error(data.message || "Gagal mengunggah foto.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat unggah foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal mengirimkan pengaduan.");
        setLoading(false);
        return;
      }

      setSuccessData(data.data);
      toast.success("Pengaduan berhasil diajukan!");
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode tiket berhasil disalin!");
  };

  if (successData) {
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
            <span className="font-mono text-xl font-bold tracking-wider text-blue-900">
              {successData.code}
            </span>
            <button
              onClick={() => copyCode(successData.code)}
              className="p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-200 rounded-lg transition"
              title="Salin Kode"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-left text-xs text-blue-900 space-y-1">
            <p className="font-semibold">Status Penugasan Petugas:</p>
            {successData.assigned ? (
              <p className="text-emerald-700 font-medium">
                ✓ Otomatis ditugaskan ke staf siaga: <b>{successData.assigneeName}</b>
              </p>
            ) : (
              <p className="text-amber-700 font-medium">
                ⏳ Menunggu verifikasi jadwal & penugasan staf siaga wilayah.
              </p>
            )}
            <p className="text-slate-500 pt-1">
              Tiket ini juga telah disimpan otomatis di browser Anda pada menu Lacak Tiket.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/lacak?code=${successData.code}`)}
              className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm transition"
            >
              Lacak Tiket Sekarang
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({
                  division: "TEKNISI",
                  regionId: regions[0]?.id || "",
                  institutionName: "",
                  reporterName: "",
                  reporterPhone: "",
                  reporterAddress: "",
                  deviceBrand: "",
                  serialNumber: "",
                  title: "",
                  description: "",
                  priority: "MEDIUM",
                  photoUrl: "",
                });
              }}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
            >
              Buat Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Formulir Pengaduan Layanan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Silakan isi detail kendala Anda. Sistem kami akan meneruskan tiket secara otomatis ke staf yang sedang bertugas di wilayah Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
        {/* 1. Pilih Divisi */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">
            1. Pilih Divisi Tujuan
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, division: "TEKNISI" })}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                formData.division === "TEKNISI"
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${formData.division === "TEKNISI" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Divisi Teknisi</p>
                <p className="text-xs text-slate-500 mt-0.5">Alat lab fisik, kalibrasi, kerusakan mekanik/listrik.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, division: "IT" })}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                formData.division === "IT"
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${formData.division === "IT" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Divisi IT</p>
                <p className="text-xs text-slate-500 mt-0.5">Aplikasi LIS, sinkronisasi data, bridging sistem RS.</p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Pilih Daerah & Cakupan */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            2. Wilayah / Daerah Instansi Anda
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Pilih zona wilayah yang mencakup lokasi instansi Anda untuk penugasan petugas terdekat.
          </p>

          <select
            value={formData.regionId}
            onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {formData.regionId && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Cakupan Wilayah: </span>
              {regions.find((r) => r.id === formData.regionId)?.coverage}
            </div>
          )}
        </div>

        {/* 3. Identitas Pengadu */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            3. Identitas Instansi & Kontak
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Instansi (Lab / RS / Klinik) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: RSUD Cibabat / Lab Pramita"
                value={formData.institutionName}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelapor / Penanggung Jawab *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Anda"
                value={formData.reporterName}
                onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. WhatsApp / Telepon Aktif *
              </label>
              <input
                type="tel"
                required
                placeholder="08123456789"
                value={formData.reporterPhone}
                onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat / Kota Instansi Lengkap
              </label>
              <input
                type="text"
                placeholder="Jl. Raya Barat No. 123, Cimahi"
                value={formData.reporterAddress}
                onChange={(e) => setFormData({ ...formData, reporterAddress: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 4. Rincian Perangkat & Keluhan */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            4. Detail Perangkat & Permasalahan
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merek / Tipe Perangkat (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Mindray BC-3000 / Server LIS"
                value={formData.deviceBrand}
                onChange={(e) => setFormData({ ...formData, deviceBrand: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Seri (Serial Number) (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: SN-BC3000-8812"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Keluhan / Inti Masalah *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Alat tiba-tiba mati total saat running sampel"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Lengkap Gejala & Kendala *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan secara rinci kronologi kejadian, pesan error yang muncul, atau tindakan awal yang sudah dilakukan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Urgensi
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="LOW">Rendah (Pertanyaan umum / konsultasi)</option>
                <option value="MEDIUM">Sedang (Kendala minor / pekerjaan masih bisa jalan)</option>
                <option value="HIGH">Tinggi (Alat tidak berfungsi / pelayanan terhambat)</option>
                <option value="CRITICAL">Kritis (Seluruh sistem / alat lab utama mati)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Foto / Bukti Kendala (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {uploading && <p className="text-[11px] text-blue-600 mt-1">Mengunggah foto...</p>}
              {formData.photoUrl && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Foto berhasil dilampirkan
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-700/20 transition disabled:opacity-50"
        >
          {loading ? "Memproses & Menugaskan Petugas..." : "Kirim Pengaduan Sekarang"}
        </button>
      </form>
    </div>
  );
}
