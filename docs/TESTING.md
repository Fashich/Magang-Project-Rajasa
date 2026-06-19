# Testing

Branch acuan: `alfy/backend-presensi-scan`

Dokumen ini merangkum test otomatis, test manual, dan audit database MVP Presensi QR Rajasa secara singkat.

## Stack Test

```text
Backend  : PHP 8.2, PHPUnit 11
Frontend : Vite, Preact, Tailwind via Vite
Database : MySQL 8
```

Folder test:

```text
backend/tests/Unit/
backend/tests/Feature/
backend/tests/Support/
```

## Script Utama

```bash
./scripts/test-backend.sh
./scripts/test-backend-unit.sh
./scripts/test-backend-feature.sh
docker compose exec frontend npm run build
```

Reset dan import:

```bash
./scripts/db-reset-demo.sh
./scripts/import-scan-readiness.sh backend/database/data/data-siswa.csv
```

Audit data:

```bash
./scripts/check-import-table-fill.sh
./scripts/check-successful-attendance.sh
```

## Baseline Wajib

```text
Backend full test: OK
Frontend build: passed
Browser console: tidak ada runtime error
Manual scan /dev/scan: passed
Cloudflare Quick Tunnel HP: passed
```

Jumlah test dan assertion boleh berubah. Status akhir wajib `OK`.

## Coverage Otomatis

| Area | Test |
|---|---|
| Health, 404, 405 | Feature |
| Auth login dan `/api/me` | Feature |
| Token stateless | Unit |
| Permission read | Feature |
| Presensi sesi rombel/piket | Feature |
| Pause, resume, finish sesi | Feature |
| Duplicate sesi dan bentrok lab | Feature |
| Session timeout dan heartbeat | Feature |
| Import scan readiness | Feature |
| Import invalid row | Feature |
| QR parser Google Form/plain | Unit |
| Presensi scan valid | Feature |
| Warning beda rombel | Feature |
| Invalid QR | Feature |
| Duplicate scan | Feature |
| Rombel options | Feature |
| Manual edit presensi | Feature |
| Edit reasons | Feature |
| Audit edit log | Feature |
| Frontend `/dev/scan` | Build/manual |
| Frontend `/dev/attendance-audit` | Build/manual |

## Test Khusus Terbaru

### Session Timeout

```bash
docker compose exec backend ./vendor/bin/phpunit --filter PresensiSessionTimeoutTest
```

Validasi:

```text
Sesi idle > 5 menit menjadi expired
ended_reason = timeout
Heartbeat memperbarui last_seen_at dan expires_at
```

### Warning Jam Sudah Dipakai

Validasi manual:

```text
Buat sesi Jam 1
Akhiri sesi
Buat sesi Jam 1 lagi
Popup warning muncul
Cancel: sesi tidak dibuat
OK: sesi dibuat
```

### Audit Presensi Terkini

Halaman:

```text
/dev/attendance-audit
```

Validasi:

```text
Menampilkan summary scan
Menampilkan tabel scan log
Menampilkan tabel presensi dari scan
Tidak menampilkan JSON mentah
```

### Scanner HP Clarity

Validasi:

```text
Buka /dev/scan via HTTPS tunnel
Kamera terbuka
QR terbaca pada jarak aman
Payload otomatis terisi
```

## Test Import Real

Urutan:

```bash
./scripts/db-reset-demo.sh
./scripts/import-scan-readiness.sh backend/database/data/data-siswa.csv
./scripts/check-import-table-fill.sh
```

Expected:

```text
total_rows = 1391
success_rows = 1391
failed_rows = 0
```

Valid jika rombel bernomor tidak collapse:

```text
10 TKRO 1
10 TKRO 2
10 TKRO 3
10 TKRO 4
10 TKRO 5
```

harus punya `rombel_id` berbeda.

## Test Fresh Import

Jalankan setelah reset dan import, sebelum scan/test manual:

```bash
./scripts/check-successful-attendance.sh
```

Expected:

```text
presensi_scan_log berhasil: 0
presensi_scan_log warning : 0
presensi_jam_siswa with scan_log_id: 0
RESULT: PASSED
```

Jika gagal, database sudah tidak fresh karena ada scan atau test setelah import.

## Test Scan QR Manual

Endpoint:

```text
POST /api/presensi/scan
```

Expected:

| Kasus | Expected |
|---|---|
| Rombel sesuai | `status_scan = berhasil`, `attendance_status = hadir` |
| Mode piket | `status_scan = berhasil`, `attendance_status = terlambat` |
| Beda rombel | `status_scan = warning`, `affected_rows = 0` |
| QR tidak dikenal | `status_scan = invalid`, `affected_rows = 0` |
| Scan ulang | `status_scan = ditolak`, `affected_rows = 0` |

## Cek Database Scan

```bash
DB_NAME="$(grep '^DB_DATABASE=' .env | cut -d '=' -f2-)"
DB_PASS="$(grep '^DB_PASSWORD=' .env | cut -d '=' -f2-)"

docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" <<'SQL'
SELECT scan_log_id, presensi_sesi_id, payload_nama, payload_nisn,
       status_scan, warning_reason, siswa_id,
       selected_rombel_id, actual_rombel_id, created_at
FROM presensi_scan_log
ORDER BY scan_log_id DESC
LIMIT 10;
SQL
```

```bash
docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" <<'SQL'
SELECT p.presensi_id, p.presensi_sesi_id, p.scan_log_id,
       s.nisn, s.nama_lengkap, s.kelas_aktif,
       p.tanggal, p.jam_id, p.status, p.mode_presensi, p.scanned_at
FROM presensi_jam_siswa p
LEFT JOIN siswa s ON s.siswa_id = p.siswa_id
WHERE p.scan_log_id IS NOT NULL
ORDER BY p.presensi_id DESC
LIMIT 10;
SQL
```

## Test Dev Scanner

```text
Buka /dev/scan
Login demo
Muat rombel dari database
Pilih mode dan jam
Buat sesi
Scan QR atau paste payload
Cek status UI
Cek /dev/attendance-audit
```

Test HTTPS HP:

```bash
docker run --rm -it --network host cloudflare/cloudflared:latest tunnel --url http://localhost:3000
```

Expected:

```text
Kamera meminta izin
Dropdown rombel tampil
Scan QR berhasil
Audit presensi tampil
```

## Test Manual Edit Presensi

```bash
docker compose exec backend ./vendor/bin/phpunit --filter PresensiManualEditTest
```

Validasi:

```text
GET /api/presensi/edit-reasons
GET /api/presensi/jam-siswa
PATCH /api/presensi/jam-siswa/{id}
presensi_jam_siswa.status berubah
presensi_jam_siswa.mode_presensi = manual
presensi_edit_log terisi
reason lainnya wajib reason_text
status sama ditolak
```

## Urutan Validasi Sebelum Commit

```bash
docker compose exec backend composer dump-autoload
./scripts/test-backend.sh
docker compose exec frontend npm run build
```

Untuk perubahan import atau data:

```bash
./scripts/db-reset-demo.sh
./scripts/import-scan-readiness.sh backend/database/data/data-siswa.csv
./scripts/check-import-table-fill.sh
./scripts/check-successful-attendance.sh
```

Untuk perubahan kamera/demo:

```text
Test browser desktop
Test HP via HTTPS tunnel
Pastikan console bersih
Pastikan payload terisi
```

## Aturan Test Fitur Baru

Backend:

```text
Feature test endpoint
Unit test logic utama jika ada service
Test auth/permission
Test error case
Query DB jika menyentuh data
```

Frontend:

```text
npm run build passed
Manual browser test
Console bersih
HTTPS tunnel untuk fitur kamera HP
```

## Catatan Operasional

- `db-reset-demo.sh` menghapus import real, sesi, scan, dan edit manual.
- Jangan anggap database fresh setelah PHPUnit scan atau demo manual.
- Folder kosong harus punya `.gitkeep`.
- Tailwind harus diproses lokal via Vite, bukan CDN.
