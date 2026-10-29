# 🎫 Sabaraya Ticketing — PT Sabaraya Sagara Mandiri

Sistem informasi manajemen pengaduan dan servis purna jual untuk fasilitas kesehatan (laboratorium medis, rumah sakit, klinik) oleh **PT Sabaraya Sagara Mandiri**. Sistem ini mengelola keluhan perangkat medis (**Divisi TEKNISI**) dan sistem informasi laboratorium (**Divisi IT**) dengan sistem penugasan cerdas berbasis jadwal siaga wilayah, asisten cerdas **AI Chatbot CS & RAG**, antarmuka konfirmasi modal reusable terpadu, serta eskalasi percakapan *live takeover* ke staf manusia berbasis tiket (*ticket-centric*).

Dibangun dengan arsitektur modern serverless-first menggunakan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Prisma ORM v6**, **PostgreSQL (Neon)**, **Cloudflare R2 Object Storage**, **Vercel AI SDK**, **pgvector**, dan **Pusher Channels**.

---

## 🚀 Fitur Utama & Alur End-to-End

```mermaid
flowchart TD
    A[Pengadu Faskes di /pengaduan] -->|Submit Tiket + Foto R2| B(Status: PENDING)
    B -->|Penugasan Manual oleh Admin| C(Status: ASSIGNED)
    B -->|Fail-Safe Auto-Assign > 30 Mnt| C
    C -->|Staf Setuju: /api/tickets/id/progress| D(Status: IN_PROGRESS)
    C -->|Staf Tolak + Alasan: /api/tickets/id/reject| B
    D -->|Staf Selesaikan + Catatan: /resolve| E(Status: RESOLVED)
    E -->|Admin Tutup Resmi: /close| F(Status: CLOSED)

    subgraph Chatbot["Ticket-Centric Live Chat & AI Support"]
        G[Pengadu di /lacak] -->|Klik Chat CS Tiket Ini| H[Floating Widget + Badge Tiket]
        H -->|Tanya Status / SOP| I[AI CS RAG gpt-6-luna + pgvector]
        I -->|Eskalasi Staf| J[Antrean WAITING_FOR_AGENT]
        J -->|Staf Klaim di Dasbor| K[Chat Realtime Staf <--> Pengadu via Pusher]
    end
```

### 1. Pengaduan Publik Cepat & Fleksibel
- **Tanpa Registrasi Akun**: Pengadu fasilitas kesehatan dapat langsung membuat laporan kendala di `/pengaduan`.
- **Riwayat Otomatis**: Kode tiket tersimpan di cookie browser `sbr_tickets` (hingga 20 tiket terakhir) untuk pelacakan instan di `/lacak`.
- **Bukti Foto Direct-to-R2**: Upload bukti kendala langsung dari browser ke Cloudflare R2 via AWS S3 Presigned URL (hingga 3 foto, maks 5MB/foto) secara paralel.
- **Cakupan Wilayah**: Pilihan daerah siaga otomatis memetakan kota/kabupaten sekitar.

### 2. AI Chatbot Customer Service & RAG Knowledge Base
- **Sabaraya AI Assistant**: Widget melayang (*floating widget*) di pojok kanan bawah seluruh halaman publik.
- **Model Utama & RAG**: Ditenagai LLM `openai/gpt-6-luna` dan embedding `openai/text-embedding-3-small` via OpenRouter.
- **Pencarian Semantik pgvector**: Pertanyaan pengadu dicocokkan dengan dokumen FAQ internal menggunakan cosine similarity langsung di PostgreSQL Neon.
- **Ephemeral AI Chat & Pre-Escalation Gate**: Chat tamu bersifat bebas polusi database (ephemeral di memori/browser). Sesi baru ditulis ke PostgreSQL jika terikat tiket atau melewati formulir identitas (*pre-escalation gate*) saat pengadu meminta staf teknisi/CS.
- **Session Reset & Anti-Lockout**: Tombol "Mulai Chat Baru" instan ketika sesi ditutup (`CLOSED`) oleh staf, mencegah pengadu terkunci pada riwayat sesi lama.
- **Eskalasi Staf (Halo BCA Style)**: Ketika kendala kritis atau pengadu meminta staf manusia, AI memicu tool calling `escalateToHumanAgent` untuk memindahkan sesi ke antrean `WAITING_FOR_AGENT`.
- **Live Chat Realtime Takeover**: Staf dapat mengambil alih percakapan (*takeover*) dari dasbor internal dan bertukar pesan langsung dengan pengadu secara real-time via Pusher Channels (dengan fallback otomatis polling 3-12 detik).

### 3. Alur Penugasan Tiket (Manual + Fail-Safe Auto-Assign)
- **Manual First**: Tiket baru berstatus `PENDING` untuk ditinjau dan ditugaskan secara manual oleh Admin/Superadmin.
- **Fail-Safe Auto-Assign**: Tiket yang berstatus `PENDING` lebih dari 30 menit otomatis dialokasikan ke teknisi siaga via `/api/cron/auto-assign` atau tombol 1-klik di dasbor.
- **Workload Balancing**: Algoritma round-robin memprioritaskan staf dengan jadwal aktif di wilayah pelapor dan beban tiket terendah (`ASSIGNED` + `IN_PROGRESS`).
- **Konfirmasi Petugas**:
  - **Terima Tugas**: Status tiket berpindah ke `IN_PROGRESS` dan mencatat waktu respons (`respondedAt`).
  - **Tolak Tugas**: Wajib menyertakan alasan penolakan ($\ge$ 5 karakter). Tiket kembali ke `PENDING` dengan audit log.
- **Penyelesaian & Penutupan**: Teknisi menginput catatan pengerjaan (`RESOLVED`), kemudian Admin/Superadmin menutup resmi tiket (`CLOSED`).

### 4. Autentikasi Cerdas & Kontrol Akses (Serverless Session)
- **Sesi Bebas Redis**: Sesi dan rotasi token disimpan langsung pada tabel `sessions` di PostgreSQL Neon.
- **JWT Cookie**: Menggunakan JWT jangka pendek (15 menit) untuk `access_token` dan rotasi `refresh_token` (7 hari) pada cookie HTTP-only `sameSite: "lax"`.
- **Navigasi Adaptif**: Header navigasi mendeteksi sesi secara dinamis:
  - Jika belum login: Tombol menampilkan **Portal Staf** (`/masuk`).
  - Jika sudah login: Tombol otomatis berubah menjadi **Dashboard** (`/dashboard`).
- **Proteksi Halaman Login**: Mengakses halaman `/masuk` saat sudah memiliki sesi aktif akan langsung dialihkan (*redirect server-side*) ke `/dashboard` tanpa rendering formulir.
- **3 Tingkatan Peran**: `SUPERADMIN`, `ADMIN`, dan `EMPLOYEE`.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.4.3 App Router (Turbopack, Partial Prerendering)
- **UI Library**: React 19.3, Tailwind CSS v4
- **AI & RAG Engine**: Vercel AI SDK (`ai`), `@ai-sdk/openai`, OpenRouter (`openai/gpt-6-luna`), `pgvector` (`openai/text-embedding-3-small`)
- **Realtime Sync**: Pusher Channels (`pusher`, `pusher-js`) dengan fallback database short-polling
- **Database & ORM**: PostgreSQL Neon Serverless, Prisma ORM v6.19
- **Object Storage**: Cloudflare R2 via AWS S3 SDK v3 Presigned URLs
- **Autentikasi**: `jose` (JWT/JWS), `bcryptjs`
- **Validasi Data**: Zod v4

---

## 📁 Struktur Direktori

```text
sabaraya-ticketing/
├── app/
│   ├── api/
│   │   ├── admin/                # Endpoint Admin (chat-queue, knowledge, users, regions, schedules, auto-assign)
│   │   ├── auth/                 # Endpoint autentikasi (login, logout, me)
│   │   ├── chat/                 # Endpoint AI chatbot streaming, session, dan live messages
│   │   ├── cron/                 # Endpoint otomatisasi cron auto-assign
│   │   ├── tickets/              # Endpoint tiket (create, track, assign, progress, reject, resolve, close)
│   │   └── upload/               # Endpoint presigned URL Cloudflare R2 & fallback upload
│   ├── dashboard/                # Dasbor internal staf (tiket, jadwal, live CS antrean, basis pengetahuan)
│   ├── lacak/                    # Halaman publik pelacakan status tiket
│   ├── masuk/                    # Halaman login staf (Server Component dengan auto-redirect jika punya sesi)
│   ├── pengaduan/                # Formulir publik pembuatan tiket pengaduan
│   ├── layout.tsx                # Layout global dengan AuthNavButton dinamis & FloatingChatWidget
│   └── page.tsx                  # Landing page publik
├── components/
│   ├── chat/
│   │   └── FloatingChatWidget.tsx # Widget CS melayang di sudut kanan bawah publik
│   ├── dashboard/
│   │   ├── LiveChatQueueModal.tsx # Antarmuka live chat takeover untuk staf
│   │   └── KnowledgeBaseModal.tsx # Manajemen dokumen FAQ & chunking vektor
│   └── layout/
│       └── AuthNavButton.tsx      # Komponen navigasi adaptif (Portal Staf vs Dashboard)
├── lib/
│   ├── ai.ts                     # Konfigurasi OpenRouter, chunking, generateEmbedding, dan searchKnowledgeBase
│   ├── auth.ts                   # Logika JWT, hash password, rotasi session PostgreSQL
│   ├── prisma.ts                 # PrismaClient singleton instance
│   ├── pusher.ts                 # Realtime broadcaster Pusher & fallback listener
│   ├── round-robin.ts            # Algoritma dispatch & penyeimbang beban kerja teknisi
│   └── s3.ts                     # Inisialisasi AWS S3 SDK untuk Cloudflare R2 Presigned URLs
├── prisma/
│   ├── schema.prisma             # Skema database relasional & pgvector
│   └── seed.ts                   # Seeder akun Superadmin & wilayah awal
└── public/                       # Aset statis web
```

---

## ⚙️ Panduan Menjalankan di Lokal (Local Setup)

### 1. Kloning & Instal Dependensi
```bash
cd sabaraya-ticketing
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file template `.env.example` atau buat file `.env`:
```env
# Database PostgreSQL (Wajib pgvector aktif)
DATABASE_URL="postgresql://user:password@localhost:5432/sabaraya_ticketing?schema=public"

# Kunci JWT (Minimal 32 karakter acak)
JWT_ACCESS_SECRET="ganti-string-rahasia-minimal-32-karakter-access"
JWT_REFRESH_SECRET="ganti-string-rahasia-minimal-32-karakter-refresh"

# AI Chatbot & RAG Knowledge Base (OpenRouter)
OPENROUTER_API_KEY="sk-or-v1-xxxx..."
OPENROUTER_MODEL="openai/gpt-6-luna"
OPENROUTER_EMBEDDING_MODEL="openai/text-embedding-3-small"

# Realtime Pusher Channels (Opsional, fallback polling 3 detik jika kosong)
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Cloudflare R2 Storage (Opsional, fallback base64 jika kosong)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="sabaraya-ticketing"
R2_PUBLIC_DOMAIN=""

CRON_SECRET="kunci-rahasia-cron-opsional"
```

### 3. Migrasi Database & Seeder
```bash
# Push skema ke database
npx prisma db push

# Jalankan seeder akun superadmin & daerah awal
npm run db:seed
```

*Kredensial Default Seeder:*
- **Email:** `superadmin@sabaraya.id`
- **Password:** `admin123`

### 4. Jalankan Development Server
```bash
npm run dev
```
Akses web di `http://localhost:3000`.

---

## 🔒 Hak Akses Peran Pengguna (Roles)

| Fitur / Halaman | Publik | Karyawan / Teknisi | Admin | Superadmin |
|---|:---:|:---:|:---:|:---:|
| Buat Pengaduan (`/pengaduan`) | ✅ | ✅ | ✅ | ✅ |
| Lacak Status Tiket (`/lacak`) | ✅ | ✅ | ✅ | ✅ |
| Chat CS AI (`FloatingChatWidget`) | ✅ | ✅ | ✅ | ✅ |
| Akses Dasbor (`/dashboard`) | ❌ | ✅ | ✅ | ✅ |
| Ambil Alih Live Chat Pengadu | ❌ | ✅ | ✅ | ✅ |
| Kelola Basis Pengetahuan (RAG) | ❌ | ❌ | ✅ | ✅ |
| Terima / Tolak Tugas Tiket | ❌ | ✅ | ❌ | ❌ |
| Selesaikan Tiket | ❌ | ✅ | ✅ | ✅ |
| Penugasan Manual Tiket | ❌ | ❌ | ✅ | ✅ |
| Eksekusi Auto-Assign | ❌ | ❌ | ✅ | ✅ |
| Tutup Resmi Tiket | ❌ | ❌ | ✅ | ✅ |
| Kelola Daerah & Jadwal Siaga | ❌ | ❌ | ✅ | ✅ |
| Kelola & Hapus Pengguna | ❌ | ❌ | ❌ | ✅ |
