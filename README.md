# 🎫 Sabaraya Ticketing

Sistem informasi manajemen pengaduan dan servis purna jual untuk fasilitas kesehatan (laboratorium medis, rumah sakit, klinik). Sistem ini mengelola keluhan perangkat medis (**Divisi TEKNISI**) dan sistem informasi laboratorium (**Divisi IT**) dengan sistem penugasan cerdas berbasis jadwal siaga dan wilayah cakupan.

Dibangun dengan arsitektur modern serverless-first menggunakan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Prisma ORM v6**, **PostgreSQL**, dan **Cloudflare R2 Object Storage**.

---

## 🚀 Fitur Utama

1. **Pengaduan Publik Cepat & Fleksibel**:
   - Pelapor tidak diwajibkan mendaftar akun.
   - Pelacakan tiket otomatis via cookie browser `sbr_tickets` (menyimpan hingga 20 tiket terakhir) atau pencarian manual nomor tiket di `/lacak`.
   - Unggah bukti foto kendala langsung ke **Cloudflare R2** menggunakan **S3 Presigned URL** (hingga 3 foto, maksimal 5MB per foto, diunggah secara paralel).
   - Dropdown wilayah dinamis dengan rincian cakupan kota/kabupaten.

2. **Alur Penugasan Bertanggung Jawab (Manual + Fail-Safe Auto-Assign)**:
   - **Manual First**: Tiket baru berstatus `PENDING` untuk ditinjau dan ditugaskan secara manual oleh Admin/Superadmin.
   - **Fail-Safe Auto-Assign**: Tiket yang berstatus `PENDING` lebih dari 30 menit dapat dialokasikan otomatis oleh sistem (via endpoint cron `/api/cron/auto-assign` atau tombol 1-klik di dasbor admin).
   - **Least-Active Workload**: Algoritma round-robin memprioritaskan petugas dengan beban tiket aktif terendah yang memiliki jadwal siaga aktif di wilayah pengadu.
   - **Konfirmasi Petugas**: Petugas yang ditugaskan wajib mengonfirmasi tugas:
     - **Terima Tugas (Setuju)**: Tiket berpindah ke `IN_PROGRESS` dan mencatat waktu respons (`respondedAt`).
     - **Tolak Tugas**: Petugas wajib menyertakan alasan penolakan (minimal 5 karakter). Tiket kembali ke status `PENDING` untuk ditugaskan ulang oleh Admin.

3. **Autentikasi & Sesi Tanpa Redis (100% Vercel Serverless Ready)**:
   - Sesi dan rotasi token disimpan langsung pada tabel `sessions` di PostgreSQL.
   - Menggunakan JWT jangka pendek (15 menit) untuk `access_token` dan rotasi `refresh_token` (7 hari) pada HTTP-only cookie.
   - Mendukung 3 peran pengguna: `SUPERADMIN`, `ADMIN`, dan `EMPLOYEE`.

4. **Dasbor Manajemen Lengkap**:
   - Modal rincian tiket interaktif dengan linimasa aktivitas dan galeri foto resolusi penuh.
   - Penyaringan instan berdasarkan status tiket, divisi, wilayah, dan pencarian kata kunci.
   - Manajemen pengguna, peran, kapasitas maksimal tiket aktif, dan jadwal siaga.
   - Pengaturan wilayah cakupan dengan opsi aktivasi/deaktivasi aman tanpa merusak riwayat tiket.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.4](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Notifikasi**: [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) (didukung [Neon Serverless Postgres](https://neon.tech/)), [Prisma ORM v6.19](https://www.prisma.io/)
- **Object Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via `@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`
- **Autentikasi & Kriptografi**: [jose](https://github.com/panva/jose) (JWT/JWS), [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Validasi Data**: [Zod v4](https://zod.dev/)

---

## 📁 Struktur Direktori

```text
sabaraya-ticketing/
├── app/
│   ├── api/
│   │   ├── admin/                # Endpoint khusus Admin & Superadmin (users, regions, schedules, auto-assign)
│   │   ├── auth/                 # Endpoint autentikasi (login, logout, me)
│   │   ├── cron/                 # Endpoint otomatisasi cron (auto-assign tiket PENDING > 30 menit)
│   │   ├── tickets/              # Endpoint pengelolaan tiket (create, track, assign, progress, reject, resolve, close)
│   │   └── upload/               # Endpoint presigned URL Cloudflare R2 & fallback upload
│   ├── dashboard/                # Dasbor internal untuk Superadmin, Admin, dan Staf/Teknisi
│   ├── lacak/                    # Halaman publik pelacakan status tiket
│   ├── masuk/                    # Halaman login staf steril
│   ├── pengaduan/                # Formulir publik pembuatan pengaduan kendala
│   ├── layout.tsx                # Layout global Next.js
│   └── page.tsx                  # Landing page utama
├── lib/
│   ├── auth.ts                   # Logika JWT, hash password, rotasi session PostgreSQL
│   ├── prisma.ts                 # PrismaClient singleton instance
│   ├── round-robin.ts            # Algoritma dispatch & penyeimbang beban kerja teknisi
│   └── s3.ts                     # Inisialisasi AWS S3 SDK untuk Cloudflare R2 Presigned URLs
├── prisma/
│   ├── schema.prisma             # Skema database relasional
│   └── seed.ts                   # Seeder akun Superadmin & wilayah awal
└── public/                       # Aset statis web
```

---

## ⚙️ Panduan Menjalankan di Lokal (Local Setup)

### 1. Prasyarat
- Node.js versi 20 atau lebih baru.
- PostgreSQL lokal (atau database cloud seperti Neon/Supabase).

### 2. Kloning & Instal Dependensi
```bash
cd sabaraya-ticketing
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan nilai variabel berikut:
```env
# Koneksi Database PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/sabaraya_ticketing?schema=public"

# Kunci JWT (Minimal 32 karakter acak)
JWT_ACCESS_SECRET="ganti-string-rahasia-minimal-32-karakter-access"
JWT_REFRESH_SECRET="ganti-string-rahasia-minimal-32-karakter-refresh"

# Kredensial Cloudflare R2 (Opsional saat lokal, fallback Base64 aktif otomatis jika kosong)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="sabaraya-ticketing"
R2_PUBLIC_DOMAIN=""

# Kunci Pengaman Endpoint Cron
CRON_SECRET="kunci-rahasia-cron-opsional"
```

### 4. Sinkronisasi Skema Database & Jalankan Seeder
```bash
# Push skema ke database
npx prisma db push

# Jalankan seeder akun superadmin & daerah awal
npm run db:seed
```

*Kredensial Default Seeder:*
- **Email:** `superadmin@sabaraya.id`
- **Password:** `admin123`

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🚢 Panduan Deployment Produksi (Neon & Vercel)

### 1. Database Neon
1. Buat database baru di [Neon Console](https://console.neon.tech).
2. Salin connection string PostgreSQL mode **Pooled Connection**:
   ```text
   postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/neondb?sslmode=require
   ```
3. Push skema & seeder ke Neon dari terminal lokal:
   ```bash
   DATABASE_URL="<connection_string_neon>" npx prisma db push
   DATABASE_URL="<connection_string_neon>" npm run db:seed
   ```

### 2. Cloudflare R2 Storage (Bukti Foto)
1. Buat bucket baru bernama `sabaraya-ticketing` di Cloudflare R2.
2. Buat **R2 API Token** dengan hak akses *Object Read & Write*.
3. Pada tab **Settings > CORS Policy**, tambahkan konfigurasi berikut:
   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://*.vercel.app",
         "https://domain-anda.com"
       ],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Aktifkan **Public Access** (via `r2.dev` subdomain atau Custom Domain) untuk menampilkan kembali gambar di web.

### 3. Deploy ke Vercel
1. Import repository Git ke [Vercel Dashboard](https://vercel.com).
2. Masukkan seluruh **Environment Variables** di atas pada tab konfigurasi proyek Vercel.
3. Klik **Deploy**.

---

## 🔒 Hak Akses Peran Pengguna (Roles)

| Fitur / Halaman | Publik | Karyawan / Teknisi | Admin | Superadmin |
|---|:---:|:---:|:---:|:---:|
| Buat Pengaduan (`/pengaduan`) | ✅ | ✅ | ✅ | ✅ |
| Lacak Status Tiket (`/lacak`) | ✅ | ✅ | ✅ | ✅ |
| Akses Dasbor (`/dashboard`) | ❌ | ✅ | ✅ | ✅ |
| Melihat Tiket | Hanya tiket sendiri | Tiket yang ditugaskan | Semua tiket | Semua tiket |
| Terima / Tolak Tugas | ❌ | ✅ | ❌ | ❌ |
| Selesaikan Tiket | ❌ | ✅ | ✅ | ✅ |
| Penugasan Manual Tiket | ❌ | ❌ | ✅ | ✅ |
| Eksekusi Auto-Assign | ❌ | ❌ | ✅ | ✅ |
| Tutup Resmi Tiket | ❌ | ❌ | ✅ | ✅ |
| Kelola Daerah & Jadwal | ❌ | ❌ | ✅ | ✅ |
| Kelola & Hapus Pengguna | ❌ | ❌ | ❌ | ✅ |

---

## 📄 Lisensi
Sabaraya Ticketing dikembangkan untuk operasional internal dan purna jual mitra fasilitas kesehatan. Hak cipta dilindungi undang-undang.
