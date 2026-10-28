import Link from "next/link";
import { Wrench, Monitor, ShieldCheck, Clock, MapPin, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 px-4 sm:px-6 rounded-3xl bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-700/50 text-blue-200 text-xs font-semibold mb-6 border border-blue-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Penugasan Teknisi & IT Siaga Lokasi Terdekat
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
          Layanan Cepat Penanganan Kendala Laboratorium & Rumah Sakit
        </h1>
        <p className="mt-4 text-base sm:text-lg text-blue-100/90 max-w-2xl mx-auto">
          Laporkan kendala alat lab (Mindray, Sysmex, dll.) atau sistem IT LIS langsung tanpa perlu mendaftar akun. Tiket Anda akan otomatis ditugaskan ke staf siaga di wilayah Anda.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pengaduan"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-base shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition"
          >
            Ajukan Pengaduan Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/lacak"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 flex items-center justify-center gap-2 transition"
          >
            Lacak Status Tiket
          </Link>
        </div>
      </section>

      {/* 2 Divisions Grid */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Divisi Teknisi Alat Medis</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Menangani kendala fisik perangkat laboratorium, alat tidak menyala, hasil pemeriksaan tidak akurat, kalibrasi rutin, serta perawatan preventif unit di lokasi.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
            <li className="flex items-center gap-2">✓ Penjadwalan siaga teknisi per zona wilayah</li>
            <li className="flex items-center gap-2">✓ Dukungan unit hematology, clinical chemistry, dll.</li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
            <Monitor className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Divisi IT & Sistem LIS</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Menangani kendala aplikasi Laboratory Information System (LIS), bridging data antar sistem RS, sinkronisasi hasil lab, akun pengguna, dan format laporan cetak.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
            <li className="flex items-center gap-2">✓ Penanganan remote cepat & on-site jika diperlukan</li>
            <li className="flex items-center gap-2">✓ Verifikasi bridging & integritas database lab</li>
          </ul>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="p-8 rounded-2xl bg-slate-900 text-white">
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Cakupan Wilayah Cerdas</h3>
            <p className="mt-1 text-xs text-slate-400">
              Setiap tiket otomatis diteruskan ke petugas yang memiliki jadwal siaga di daerah pengadu.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Tanpa Login / Akun Tamu</h3>
            <p className="mt-1 text-xs text-slate-400">
              Riwayat tiket tersimpan otomatis di browser pengadu via cookie aman untuk kemudahan pelacakan.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Respons Bertanggung Jawab</h3>
            <p className="mt-1 text-xs text-slate-400">
              Penolakan tiket oleh karyawan wajib menyertakan alasan jelas dan langsung dilempar ke petugas siaga lain.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
