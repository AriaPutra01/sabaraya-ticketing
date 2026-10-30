"use client";

import { usePengaduan } from "@/hooks/usePengaduan";
import { PengaduanSuccess } from "@/components/pengaduan/PengaduanSuccess";
import { Wrench, Monitor, MapPin, Building2, AlertCircle, X } from "lucide-react";

export default function PengaduanPage() {
  const {
    regions,
    loading,
    uploading,
    photoUrls,
    successData,
    formData,
    setFormData,
    handleFileUpload,
    handleRemovePhoto,
    handleSubmit,
    handleReset,
  } = usePengaduan();

  if (successData) {
    return <PengaduanSuccess code={successData.code} onReset={handleReset} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Formulir Pengaduan Layanan
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Silakan isi detail kendala Anda. Sistem kami akan meneruskan tiket secara otomatis ke staf yang sedang bertugas di wilayah Anda.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8"
      >
        {/* 1. Pilih Divisi */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">
            1. Pilih Divisi Tujuan
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, division: "TEKNISI" }))}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                formData.division === "TEKNISI"
                  ? "border-ssm-blue bg-ssm-blue-light/60 ring-2 ring-ssm-blue/20 text-ssm-blue"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl ${
                  formData.division === "TEKNISI" ? "bg-ssm-blue text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Divisi Teknisi</p>
                <p className="text-xs text-slate-500 mt-0.5">Alat lab fisik, kalibrasi, kerusakan mekanik/listrik.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, division: "IT" }))}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                formData.division === "IT"
                  ? "border-ssm-blue bg-ssm-blue-light/60 ring-2 ring-ssm-blue/20 text-ssm-blue"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl ${
                  formData.division === "IT" ? "bg-ssm-blue text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Divisi IT</p>
                <p className="text-xs text-slate-500 mt-0.5">Aplikasi LIS, sinkronisasi data, bridging sistem RS.</p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Pilih Daerah */}
        <div>
          <label className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-ssm-blue" />
            2. Wilayah / Daerah Instansi Anda
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Pilih zona wilayah yang mencakup lokasi instansi Anda untuk penugasan petugas terdekat.
          </p>

          <select
            value={formData.regionId}
            onChange={(e) => setFormData((prev) => ({ ...prev, regionId: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue focus:border-transparent"
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
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-ssm-blue" />
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
                onChange={(e) => setFormData((prev) => ({ ...prev, institutionName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
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
                onChange={(e) => setFormData((prev) => ({ ...prev, reporterName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
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
                onChange={(e) => setFormData((prev) => ({ ...prev, reporterPhone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
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
                onChange={(e) => setFormData((prev) => ({ ...prev, reporterAddress: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
              />
            </div>
          </div>
        </div>

        {/* 4. Rincian Perangkat & Keluhan */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-ssm-blue" />
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
                onChange={(e) => setFormData((prev) => ({ ...prev, deviceBrand: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
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
                onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
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
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
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
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Urgensi
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-ssm-blue"
              >
                <option value="LOW">Rendah (Pertanyaan umum / konsultasi)</option>
                <option value="MEDIUM">Sedang (Kendala minor / pekerjaan masih bisa jalan)</option>
                <option value="HIGH">Tinggi (Alat tidak berfungsi / pelayanan terhambat)</option>
                <option value="CRITICAL">Kritis (Seluruh sistem / alat lab utama mati)</option>
              </select>
            </div>

            {/* Unggah Foto / Bukti Multiple (Maks 3) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Foto Bukti Kendala (Opsional, Maksimal 3 Foto)
                </label>
                <span className="text-[11px] font-semibold text-ssm-blue">
                  {photoUrls.length}/3 foto terunggah
                </span>
              </div>

              {photoUrls.length < 3 && (
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-ssm-blue-light file:text-ssm-blue hover:file:bg-ssm-blue-light/80 cursor-pointer border border-dashed border-slate-300 rounded-xl p-2 bg-slate-50/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: JPG, PNG, WEBP (Maks. 5MB per berkas). Foto diunggah langsung ke Cloudflare R2 Storage.
                  </p>
                </div>
              )}

              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-xs text-ssm-blue font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-ssm-blue border-t-transparent rounded-full animate-spin" />
                  Mengunggah foto langsung ke Cloudflare R2 via Presigned URL...
                </div>
              )}

              {/* Grid Preview Foto */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {photoUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                    >
                      <img
                        src={url}
                        alt={`Lampiran ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                        title="Hapus foto ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-3.5 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white font-bold text-sm shadow-xs transition disabled:opacity-50"
        >
          {loading ? "Memproses & Menugaskan Petugas..." : "Kirim Pengaduan Sekarang"}
        </button>
      </form>
    </div>
  );
}
