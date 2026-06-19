# Presensi Siswa Rajasa

Aplikasi presensi siswa berbasis QR untuk SMKS Rajasa.

Sistem ini dirancang untuk mendukung presensi rombel, presensi piket untuk siswa terlambat, presensi per jam pembelajaran, warning kartu QR tidak sesuai rombel, laporan presensi, serta pengelolaan data berbasis tahun ajaran.

## Status Project

Status saat ini:

- Environment development Docker sudah berjalan.
- Backend Composer based sudah berjalan.
- Frontend Vite sudah berjalan.
- Database MVP schema dan seed sudah masuk repo.
- Auth dan permission baseline sudah berjalan.
- Endpoint presensi sesi sudah implemented.
- Endpoint scan readiness import sudah implemented.
- Endpoint presensi scan QR sudah implemented.
- Endpoint dynamic rombel options sudah implemented.
- Halaman demo scanner `/dev/scan` sudah tersedia untuk demo HP.
- Cloudflare Quick Tunnel dapat dipakai untuk demo kamera HP via HTTPS.
- Tailwind sudah memakai plugin Vite, bukan CDN.
- Tahap 8.3c sudah fokus pada dynamic rombel dropdown dan polish demo scanner.
- Scan QR, dynamic rombel dropdown, dan dev scanner `/dev/scan` sudah berjalan.
- Tahap 9 add manual edit presensi.
- Warning beda rombel tidak di-resolve, tetap menjadi log di `presensi_scan_log`.
- Dummy seed `X-TKJ-1`, `X-TKJ-2`, `siswa.demo`, dan `siswa.warning.demo` sudah dihapus.
- Permission manual edit sudah tersedia.
- Endpoint manual edit presensi sudah ditambahkan.
- Setiap edit presensi wajib tercatat di `presensi_edit_log`.
- Tahap 9.1 add timeout sesi presensi 5 menit.
- Sesi aktif harus mengirim heartbeat agar tidak `expired`.
- User bisa mengakhiri sesi dari tombol `Akhiri Sesi`.
- Sistem memberi warning jika jam pelajaran sudah pernah dipakai hari ini.
- User bisa memilih `Batal Buat` atau `Lanjut Buat`.
- Halaman `/dev/attendance-audit` menampilkan hasil presensi terkini.
- Scanner HP diperbaiki untuk membaca QR kecil lebih stabil.
- Script audit presensi ikut mengecek scan `warning`.

## Endpoints

Endpoint presensi yang sudah tersedia:

```text
POST /api/presensi/sesi
GET  /api/presensi/sesi/aktif
POST /api/presensi/sesi/{id}/pause
POST /api/presensi/sesi/{id}/resume
POST /api/presensi/sesi/{id}/finish
POST /api/presensi/sesi/check-warning
POST /api/presensi/sesi/{id}/heartbeat
GET  /api/presensi/audit/latest
POST /api/presensi/scan

GET  /api/health
POST /api/auth/login
POST /api/auth/logout
GET  /api/me
GET  /api/presensi/jam-siswa
PATCH/api/presensi/jam-siswa/{id}
GET  /api/presensi/edit-reasons
POST /api/presensi/sesi/check-warning
POST /api/presensi/sesi/{id}/heartbeat
GET  /api/presensi/audit/latest
```

## Halaman Demo Tambahan

```text
/dev/scan
/dev/attendance-audit
```

Flow utama:

- User login dan membuat sesi presensi.
- User scan QR siswa.
- Backend parse payload QR.
- Backend cocokkan payload ke siswa_qr.
- Backend validasi sesi aktif.
- Backend mencatat hasil scan ke presensi_scan_log.
- Jika valid, backend update presensi_jam_siswa.

Status Scan:

| Status     | Arti                                             |
| ---------- | ------------------------------------------------ |
| `berhasil` | QR valid dan presensi masuk                      |
| `warning`  | QR valid, tetapi siswa beda rombel               |
| `invalid`  | QR tidak dikenal                                 |
| `ditolak`  | Scan duplikat atau tidak boleh mengubah presensi |

Mode sesi:

| Mode     | Fungsi                         |
| -------- | ------------------------------ |
| `rombel` | Presensi untuk rombel tertentu |
| `piket`  | Presensi untuk siswa terlambat |

Aturan Mode:

| Mode     | Hasil presensi                      |
| -------- | ----------------------------------- |
| `rombel` | siswa sesuai rombel menjadi `hadir` |
| `piket`  | siswa valid menjadi `terlambat`     |

Pilihan ruang:

| Pilihan     | Arti         |
| ----------- | ------------ |
| `kelas`     | Kelas rombel |
| `lab-tkj-1` | LAB-TKJ-1    |
| `lab-tkj-2` | LAB-TKJ-2    |
| `lab-tkj-3` | LAB-TKJ-3    |
| `lab-tkj-4` | LAB-TKJ-4    |
| `piket`     | Area piket   |

Aturan utama:

- mode `rombel` wajib memilih rombel,
- mode `piket` tidak boleh memilih rombel,
- jam maksimal 3,
- jam harus berurutan,
- rombel tidak boleh punya dua sesi aktif/suspended pada tanggal dan jam yang sama,
- lab tidak boleh dipakai dua sesi aktif/suspended pada tanggal dan jam yang sama,
- sesi yang sudah `selesai` tidak memblokir sesi baru.

## Stack

| Bagian                  | Teknologi           |
| ----------------------- | ------------------- |
| Frontend                | Vite                |
| Backend                 | PHP 8.2 FPM         |
| Database                | MySQL 8.0           |
| Web Server              | Nginx               |
| Package Manager Backend | Composer            |
| Routing Backend         | FastRoute           |
| Dependency Injection    | PHP-DI              |
| Database Layer          | Illuminate Database |
| Environment Loader      | vlucas/phpdotenv    |
| Testing Backend         | PHPUnit 11          |

## Cara Menjalankan Development

Salin environment:

```bash
cp .env.example .env
```

Jalankan container:

```bash
docker compose up -d --build
```

Cek container:

```bash
docker compose ps
```

Cek backend:

```bash
curl http://localhost:8080/api/health
```

## Database Lokal

Reset database demo:

```bash
./scripts/db-reset-demo.sh
```

Script ini menjalankan:

1. Drop database lama.
2. Buat database baru.
3. Import schema MVP.
4. Seed permission MVP.
5. Seed akun demo.

## Akun Demo

Password demo:

```text
Rajasa@123
```

Akun utama:

| Username             | Tipe        |
| -------------------- | ----------- |
| `superadmin.demo`    | super_admin |
| `admin.demo`         | admin       |
| `guru.demo`          | guru        |
| `staff.demo`         | staff       |
| `intern.demo`        | intern      |

## Testing

Jalankan semua test backend:

```bash
./scripts/test-backend.sh
```

Jalankan unit test saja:

```bash
./scripts/test-backend-unit.sh
```

Jalankan feature test saja:

```bash
./scripts/test-backend-feature.sh
```


## Struktur Project

```text
backend/
  boilerplate/
  database/
  public/
  routes/
  src/
  tests/

frontend/
docs/
scripts/
docker-compose.yml
nginx.conf
```

## Branch

Prefix branch project:

```text
nama/feature
```

Contoh:

```text
alfy/cleanup-dev-sampah
alfy/backend-boilerplate
alfy/backend-phpunit
alfy/backend-database-assets
alfy/backend-auth-permission
alfy/backend-presensi-session
```

## Scope MVP

Masuk MVP:

- login user,
- role dan permission sederhana,
- akun guru, staff, admin, intern, dan siswa,
- presensi mode rombel,
- presensi mode piket untuk siswa terlambat,
- scan QR berbasis payload nama dan NISN,
- presensi per jam pembelajaran,
- warning jika kartu QR beda rombel,
- laporan presensi,
- import data,
- audit edit presensi,
- error log sistem.

Tidak masuk MVP:

- ESP32,
- ruangan,
- plotting rombel,
- policy engine,
- group engine,
- arsip media,
- notifikasi kompleks,
- multi sekolah,
- integrasi orang tua,
- queue worker,
- Redis,
- Laravel penuh.

## Scan Readiness Import

Tahap 7 menyiapkan data minimal agar scan QR pada Tahap 8 bisa mencocokkan payload QR dengan database.

Input CSV minimal:

```text
NISN
NAMA
KELAS
```

Contoh:

```csv
N,NISN,NAMA,KELAS
1,0096672112,NAMA,10 AKL
2,0106325606,NAMA,10 AKL
```

Jalankan import:

```bash
./scripts/import-scan-readiness.sh backend/database/data/NAMA-FILE-DATA.csv
```

Reset jika import salah:

```bash
./scripts/db-reset-import-demo.sh
```

## Catatan:

`db-reset-demo.sh` akan menghapus data hasil import dan mengembalikan database ke seed demo.

### Catatan Sesi Presensi

- Sesi idle lebih dari 5 menit berubah menjadi `expired`.
- `ended_reason` akan bernilai `timeout`.
- Heartbeat memperbarui `last_seen_at` dan `expires_at`.
- Tombol `Akhiri Sesi` tetap memakai flow finish sesi.
- Warning jam harian tidak memblokir create sesi, hanya meminta konfirmasi.