import Link from "next/link";
import { Wrench, Monitor, ShieldCheck, Clock, MapPin, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section - Clean Enterprise Medical Theme */}
      <section className="text-center py-12 sm:py-14 px-4 sm:px-6 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-ssm-blue-light text-ssm-blue text-[11px] sm:text-xs font-bold mb-6 border border-ssm-blue/20 max-w-full leading-normal">
          <ShieldCheck className="w-4 h-4 text-ssm-blue shrink-0" />
          <span>Layanan Siaga Alat Laboratorium & IT Rumah Sakit</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          Penanganan Cepat Kendala Fasilitas Kesehatan & Laboratorium
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Laporkan kendala perangkat medis (Mindray, Sysmex, dll.) atau sistem IT LIS langsung tanpa registrasi akun. Tiket pengaduan diteruskan ke teknisi siaga di zona wilayah Anda.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pengaduan"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition"
          >
            <span>Ajukan Pengaduan Baru</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/lacak"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300/80 flex items-center justify-center gap-2 transition"
          >
            Lacak Status Tiket
          </Link>
        </div>
      </section>

      {/* 2 Divisions Grid */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-5 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-ssm-blue/40 transition">
          <div className="w-12 h-12 rounded-xl bg-ssm-blue-light text-ssm-blue flex items-center justify-center mb-5 border border-ssm-blue/20">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Divisi Teknisi Alat Medis</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Menangani kendala fisik perangkat laboratorium, unit tidak menyala, deviasi hasil pemeriksaan, kalibrasi berkala, serta pemeliharaan preventif di lokasi faskes.
          </p>
          <ul className="mt-5 space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ssm-blue shrink-0" />
              Penjadwalan siaga teknisi per zona wilayah
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ssm-blue shrink-0" />
              Dukungan unit hematology, clinical chemistry, dan elektroda
            </li>
          </ul>
        </div>

        <div className="p-5 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-ssm-blue/40 transition">
          <div className="w-12 h-12 rounded-xl bg-ssm-blue-light text-ssm-blue flex items-center justify-center mb-5 border border-ssm-blue/20">
            <Monitor className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Divisi IT & Sistem LIS</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Menangani kendala aplikasi Laboratory Information System (LIS), bridging data SIMRS, sinkronisasi hasil otomatis, otorisasi akun pengguna, dan format pelaporan cetak.
          </p>
          <ul className="mt-5 space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ssm-blue shrink-0" />
              Penanganan remote cepat & on-site terkoordinasi
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ssm-blue shrink-0" />
              Verifikasi bridging protokol HL7 & integritas database lab
            </li>
          </ul>
        </div>
      </section>

      {/* Feature Highlights - Clean Slate Contrast */}
      <section className="p-6 sm:p-10 rounded-2xl bg-slate-900 text-white">
        <div className="grid sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div>
            <div className="w-10 h-10 rounded-xl bg-ssm-blue/30 text-sky-200 flex items-center justify-center mb-3.5">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Cakupan Wilayah Siaga</h3>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              Setiap tiket otomatis diarahkan kepada petugas yang memiliki jadwal siaga aktif di area fasilitas kesehatan pengadu.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-ssm-blue/30 text-sky-200 flex items-center justify-center mb-3.5">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Pelaporan Publik Instan</h3>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              Pelapor cukup mengisi formulir tanpa login. Riwayat tiket dapat diakses kapan saja melalui nomor referensi resmi.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-3.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Eskalasi & Akuntabilitas</h3>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              Penolakan tugas wajib menyertakan alasan terverifikasi dan otomatis dilempar ke teknisi siaga lain untuk mencegah kendala terbengkalai.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}