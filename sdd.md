# Software Design Document (SDD) — Rotom

**Versi:** 1.0  
**Tanggal:** 12 Februari 2025  
**Status:** Draft

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen

Dokumen ini mendeskripsikan desain perangkat lunak untuk proyek **Rotom**: sistem manajemen organisasi/komunitas yang terdiri atas backend API, aplikasi mobile, dan bot WhatsApp untuk autentikasi dan notifikasi.

### 1.2 Ruang Lingkup

- **Backend (NestJS):** API berbasis oRPC, autentikasi (Better Auth + OTP via WhatsApp), manajemen dana, tugas, jadwal, galeri, dan organisasi.
- **WhatsApp Bot (NestJS):** Aplikasi konteks (bukan HTTP server) berbasis Baileys; mengonsumsi job dari Redis (BullMQ) untuk mengirim OTP dan pesan.
- **Mobile (Expo/React Native):** Aplikasi lintas platform (iOS, Android, Web) untuk pengguna akhir: login OTP, dana, galeri, profil.
- **Infrastruktur:** Redis, MinIO (S3-compatible), SQLite (development); mendukung containerisasi (Docker).

### 1.3 Definisi dan Akronim

| Istilah | Definisi |
|--------|----------|
| oRPC | RPC framework type-safe untuk TypeScript; kontrak didefinisikan dengan route + Zod schema |
| BullMQ | Queue system berbasis Redis untuk job processing (NestJS/Bull) |
| Baileys | Library Node.js untuk WhatsApp Web API (multi-device) |
| Better Auth | Library autentikasi untuk Node.js dengan dukungan plugin (phoneNumber, admin, dll.) |
| MinIO | Object storage S3-compatible; digunakan untuk file (gambar galeri, dll.) |

---

## 2. Arsitektur Sistem

### 2.1 Gambar Arsitektur Tingkat Tinggi

```
                    +------------------+
                    |   Mobile App     |
                    | (Expo / RN)      |
                    +--------+---------+
                             |
                     HTTP/HTTPS (oRPC, Better Auth)
                             |
    +------------------------+------------------------+
    |                        |                        |
    v                        v                        v
+-----------+    +----------------------+    +------------------+
|  Backend  |    | Redis (BullMQ)       |    |  WhatsApp Bot     |
| (NestJS)  |----| Queue: "whatsapp"    |----| (NestJS Context)  |
| HTTP :3k  |    | - send-otp           |    | Baileys → WA      |
+-----+-----+    | - send-message       |    +------------------+
      |          +----------------------+
      |
      | Prisma
      v
+-----------+     +----------+
| SQLite    |     | MinIO    |
| (DB)      |     | (S3)     |
+-----------+     +----------+
```

- **Mobile** memanggil **Backend** untuk API (oRPC) dan auth (Better Auth).
- **Backend** mengantre job ke **Redis** (BullMQ) untuk pesan WhatsApp; **WhatsApp Bot** mengonsumsi queue dan mengirim via **Baileys** ke WhatsApp.

### 2.2 Monorepo dan Struktur Repositori

- **Tooling:** pnpm workspace, Turborepo.
- **Paket:** `apps/backend`, `apps/whatsapp-bot`, `apps/mobile`, `packages/eslint-config`, `packages/typescript-config`.
- **Perintah umum:** `pnpm build`, `pnpm dev`, `pnpm lint`, `pnpm check-types`.

---

## 3. Desain Komponen

### 3.1 Backend (apps/backend)

**Teknologi:** NestJS 11, oRPC (contract, server, nest, zod, openapi, json-schema), Prisma (SQLite), Better Auth, BullMQ, AWS SDK (S3/MinIO), Sharp (gambar).

**Modul utama:**

| Modul | Fungsi |
|-------|--------|
| `AuthModule` | Better Auth (phoneNumber OTP); proxy ke Better Auth handler; mengantre OTP ke queue `whatsapp`. |
| `PrismaModule` | Injeksi PrismaService; akses ke database. |
| `ProfilesModule` | Profil user (getMe) via oRPC; dilindungi `protectedRoute`. |
| `FundsModule` | Dana organisasi, kontribusi (CRUD); contract + schema Zod. |
| `SubjectsModule` | Mata pelajaran / subjek. |
| `AssignmentsModule` | Tugas dan status pengerjaan per user. |
| `DutiesModule` | Tugas jaga / duty. |
| `GalleryModule` | Post galeri (gambar/video), reaksi; media disimpan di MinIO. |
| `OrganizationModule` | Data organisasi (nama, deskripsi, gambar). |
| `DashboardModule` | Layanan dashboard. |
| `FeaturesModule` | Fitur-fitur tambahan. |
| `NotificationsModule` | Placeholder layanan notifikasi (kosong). |
| `StorageModule` | Upload/unduh/delete object ke MinIO (S3 client + presigned URL). |
| `ReferenceModule` | Hanya development: penyajian Scalar API Reference + `spec.json` (OpenAPI dari oRPC contract). |

**Konfigurasi aplikasi:**

- **CORS:** `origin: process.env.FRONTEND_URL`
- **oRPC:** Context berisi `request` dan opsional `session` (dari Better Auth); plugin SmartCoercion (Zod → JSON Schema); error handler global.
- **BullMQ:** Koneksi Redis via `REDIS_HOST`, `REDIS_PORT`; queue `whatsapp` didaftarkan di `AuthModule`.

**Alur OTP:**

1. Client meminta OTP (Better Auth endpoint).
2. Better Auth memanggil `sendOTP` yang di-inject ke AuthService.
3. AuthService menambahkan job `send-otp` ke queue `whatsapp` dengan payload `{ phoneNumber, code }`.
4. WhatsApp Bot (BaileysProcessor) memproses job dan mengirim pesan teks via Baileys.

### 3.2 WhatsApp Bot (apps/whatsapp-bot)

**Teknologi:** NestJS 11 (ApplicationContext, tanpa HTTP server), Baileys, BullMQ, Pino, Zod, qrcode.

**Komponen utama:**

- **BaileysService:** Inisialisasi socket Baileys (`makeWASocket`), auth state multi-file (`baileys_auth_info`), penanganan event (connection.update, messages.upsert). Event didispatch ke handler yang terdaftar via decorator.
- **BaileysDispatcher:** Mencari provider NestJS yang memiliki method dengan metadata `@On(event)` atau `@MessageStartsWith(prefix)`; memanggil handler yang cocok untuk setiap event/pesan.
- **BaileysProcessor:** Worker BullMQ untuk queue `whatsapp`; job `send-otp` divalidasi dengan `sendOtpSchema` (Zod), lalu pesan dikirim ke `phoneNumber@s.whatsapp.net`. Job `send-message` placeholder.

**Pola event-driven:**

- Decorator `@On('connection.update')`, `@On('messages.upsert')` dan `@MessageStartsWith('ping')` mendorong perluasan handler tanpa mengubah inti BaileysService.
- Pesan masuk (`messages.upsert` type `notify`) dapat diarahkan ke handler berdasarkan filter (mis. awalan teks).

**Keamanan data job:**

- Payload OTP divalidasi dengan Zod; job invalid di-remove.
- Jika socket belum siap, job melempar error agar BullMQ melakukan retry.

### 3.3 Mobile (apps/mobile)

**Teknologi:** Expo ~54, React 19, React Native, expo-router (file-based), Uniwind (Tailwind-style), @rn-primitives, lucide-react-native.

**Struktur navigasi:**

- **Root:** `Stack` (expo-router); layout root memakai ThemeProvider dan PortalHost.
- **Tab:** Home, Funds, Gallery, Profile (Tabs dengan ikon).
- **Auth:** Layar `auth/login` (input nomor telepon) dan `auth/otp` (input 6 digit OTP, timer resend). Setelah verifikasi, redirect ke `/home` (saat ini OTP masih mock).
- **Funds:** Tab funds dan route `funds/index`.

**UI/theming:**

- Komponen UI di `components/ui` (Button, Text, Icon); tema dari `lib/theme` (NAV_THEME); Uniwind untuk styling.

**Integrasi backend:**

- Login/OTP dirancang untuk alur Better Auth (nomor telepon → kirim OTP → verifikasi); integrasi API backend (oRPC) dan penyimpanan session dapat ditambahkan di lapisan layanan/API client.

---

## 4. Desain Data

### 4.1 Model Data (Prisma)

- **Organization:** Satu baris (id = 1); nama, deskripsi, gambar.
- **User:** id (CUID), nama, email, phoneNumber (opsional), role, birthday, banned; relasi Session, Account, Assignment, FundContributionLog (reporter/contributor), GalleryPost, GalleryPostReaction.
- **Session / Account / Verification:** Model standar Better Auth (session, akun provider, verifikasi OTP).
- **Subject / Assignment / AssignmentStatus:** Mata pelajaran, tugas, status selesai per user.
- **Fund / FundContributionLog:** Satu fund (id=1), mata uang; log kontribusi dengan reporter dan contributor.
- **GalleryPost / GalleryPostReaction:** Post media (mediaKey unik, type image/video), reaksi per user.
- **Duty / DutySchedule:** Entitas jaga (detail jadwal dapat diperluas).
- **Settings:** Satu baris (id=1); flag untuk fitur WhatsApp: fund report, duty report, subject schedule reminder, birthday reminder.

**Database:** SQLite (development); provider Prisma dapat diganti (mis. PostgreSQL) untuk production.

### 4.2 Penyimpanan Berkas (MinIO)

- **StorageService (backend):** S3 client (endpoint, bucket, credentials dari env); upload stream, presigned URL unduh, hapus object.
- **Bucket:** Mis. `rotom-development`; path object (mis. `posts/<id>/<uuid>.webp`) ditentukan oleh modul pemanggil (mis. Gallery).

---

## 5. Desain Antarmuka

### 5.1 API Backend (oRPC)

- **Kontrak terpusat:** `contract.ts` mengagregasi: `profiles`, `funds`, `subjectMaterials`, `gallery`, `assignments`, `duty`.
- **Setiap domain:** File `*.contract.ts` mendefinisikan route (path, method, tag) dan schema input/output (Zod); file `*.controller.ts` mengimplementasikan dengan `implement(contract...).use(protectedRoute).handler(...)`.
- **Keamanan:** Middleware `protectedRoute` mengambil session dari Better Auth; jika tidak ada, melempar `ORPCError('UNAUTHORIZED')`.
- **Referensi API:** Di development, OpenAPI dihasilkan dari contract (ZodToJsonSchemaConverter) dan disajikan lewat Scalar (`/spec.json`, halaman HTML reference).

### 5.2 Autentikasi (Better Auth)

- **Base path:** `/auth`.
- **Metode login:** Plugin phoneNumber (OTP via WhatsApp); email/password disabled.
- **Plugin:** phoneNumber (sendOTP → queue BullMQ), admin; di development ditambah openAPI.
- **Session:** Disimpan dan divalidasi oleh Better Auth; tersedia di context oRPC setelah `protectedRoute`.

### 5.3 Antarmuka Backend ↔ WhatsApp Bot (BullMQ)

- **Queue:** `whatsapp`.
- **Job yang digunakan:** `send-otp` payload `{ phoneNumber, code }` (divalidasi dengan `sendOtpSchema` di bot); `send-message` (placeholder).
- **Protokol:** Redis (BullMQ); Backend sebagai producer, WhatsApp Bot sebagai consumer (WorkerHost). Dokumen analisis (`COMMUNICATION_PROTOCOL_ANALYSIS.md`) merekomendasikan BullMQ untuk notifikasi/reminder dan OTP (dengan prioritas dan timeout).

---

## 6. Infrastruktur dan Deployment

### 6.1 Docker Compose (root)

- **redis:** Redis 7.2, port 6379, maxmemory 1gb, noeviction.
- **minio:** MinIO server, port 9000 (API) dan 9001 (console); volume `./data/minio`.
- **createbuckets:** Init container yang membuat bucket `rotom-development` (mc alias + mb).

Backend dan WhatsApp Bot mengharapkan Redis (REDIS_HOST, REDIS_PORT); backend juga membutuhkan S3 (MinIO) dan database.

### 6.2 Backend (Dockerfile)

- Multi-stage: builder (Node 25, pnpm, install + build backend) dan production (hanya runtime + `dist`).
- CMD: `node dist/src/main.js`; expose 3000.

---

## 7. Cross-Cutting Concerns

### 7.1 Keamanan

- Autentikasi: Better Auth (session, OTP); route sensitif dilindungi `protectedRoute`.
- CORS dibatasi ke `FRONTEND_URL`.
- Credential dan URL (database, Redis, S3, Better Auth) via environment variables.

### 7.2 Logging

- Backend: console.error di oRPC onError; NestJS Logger di beberapa layanan.
- WhatsApp Bot: Pino (termasuk pino-pretty) di BaileysService; BaileysProcessor memakai NestJS Logger.

### 7.3 Validasi

- Input API: Zod schema di contract dan controller (oRPC + implement).
- Job queue: Zod (`sendOtpSchema`) di BaileysProcessor sebelum mengirim OTP.

---

## 8. Batasan dan Asumsi

- Satu organisasi (single-tenant) untuk model saat ini.
- WhatsApp Bot satu instance (satu koneksi Baileys); skala horizontal consumer BullMQ dimungkinkan.
- Mobile belum terhubung penuh ke backend (OTP verifikasi masih mock); integrasi session/API client asumsi pengembangan berikutnya.
- NotificationsService kosong; notifikasi terjadwal (fund report, duty report, reminder jadwal, ulang tahun) direncanakan via BullMQ sesuai analisis protokol.

---

## 9. Pengembangan dan Pemeliharaan

- **Testing:** Jest (unit: `*.spec.ts`; e2e: `test/`) di backend dan whatsapp-bot.
- **Linting/Format:** ESLint (konfigurasi shared dari packages), Prettier.
- **Type checking:** `pnpm check-types` (Turbo) di seluruh workspace.
- **Database:** Migrasi Prisma di `apps/backend/prisma/migrations`; schema di `schema.prisma`.

---

## 10. Referensi

- **Analisis protokol komunikasi:** `COMMUNICATION_PROTOCOL_ANALYSIS.md` — rekomendasi BullMQ untuk Backend ↔ WhatsApp Bot, use case OTP dan notifikasi, serta opsi alternatif (gRPC, HTTP, NestJS Microservices).
- **Backend:** `apps/backend/README.md`, `apps/backend/prisma/schema.prisma`, `apps/backend/src/contract.ts`.
- **WhatsApp Bot:** `apps/whatsapp-bot/README.md`, `apps/whatsapp-bot/src/baileys/`.
- **Mobile:** `apps/mobile/README.md`, `apps/mobile/app/`.
