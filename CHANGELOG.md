# Changelog

Semua perubahan penting dalam project ini dicatat di file ini.

Format:

```text
Added
Changed
Fixed
Removed
```

## [Unreleased]

### Added

- Menambahkan Tahap 7: Scan Readiness Import.
- Menambahkan endpoint `POST /api/import/scan-readiness`.
- Menambahkan endpoint `GET /api/import/jobs`.
- Menambahkan endpoint `GET /api/import/jobs/{id}/rows`.
- Menambahkan service `ScanReadinessImportService`.
- Menambahkan controller import scan readiness.
- Menambahkan import minimal data siswa dari CSV dengan kolom:
  - `NISN`
  - `NAMA`
  - `KELAS`
- Menambahkan parsing kelas dari format seperti `10 AKL`, `11 TKJ`, atau `12 TP 2`.
- Menambahkan pembentukan atau update data:
  - `siswa`
  - `jurusan`
  - `rombel`
  - `penempatan_siswa_rombel`
  - `siswa_qr`
- Menambahkan pencatatan import ke `import_jobs`.
- Menambahkan pencatatan baris error ke `import_row_logs`.
- Menambahkan script `scripts/import-scan-readiness.sh`.
- Menambahkan script `scripts/db-reset-import-demo.sh`.
- Menambahkan test import scan readiness.

### Fixed

- Menyesuaikan `import_jobs` dengan schema nyata:
  - `import_code`
  - `import_type`
  - `tahun_ajaran_id`
  - `semester`
  - `created_by`
  - `valid_rows`
  - `error_rows`
  - `inserted_rows`
  - `updated_rows`
- Menyesuaikan `import_row_logs` dengan schema nyata:
  - `import_id`
  - `row_number`
  - `row_status`
  - `source_payload_json`
  - `message`
- Menjaga NISN tetap sebagai string agar nol depan tidak hilang.
- Memastikan `siswa_qr` dipakai sebagai referensi pencocokan payload QR hasil scan, bukan untuk membuat gambar QR.

### Fixed

- Memperbaiki insert sesi presensi dengan mengisi `session_uuid`.
- Memperbaiki `presensi_sesi_jam.urutan` agar mengikuti urutan jam yang dipilih.
- Memperbaiki test isolation agar sesi aktif dari test tidak mengganggu test berikutnya.

### Removed

- Menghapus dokumentasi contract pack lama.
- Menghapus folder root `bootstrap/` lama.
- Menghapus folder `examples/api`.
- Menghapus script `check_docs_contracts.py`.
- Menghapus acuan terhadap ESP32, ruangan, plotting rombel, policy engine, group engine, arsip, dan notifikasi kompleks dari scope MVP.

## [0.9.1] - Session Timeout and Dev Audit Polish

### Added

- Menambahkan timeout sesi presensi 5 menit jika tidak ada aktivitas.
- Menambahkan endpoint `POST /api/presensi/sesi/{id}/heartbeat`.
- Menambahkan endpoint `POST /api/presensi/sesi/check-warning`.
- Menambahkan warning saat user membuat sesi pada jam yang sudah pernah dipakai di hari yang sama.
- Menambahkan tombol `Akhiri Sesi` pada halaman demo scanner `/dev/scan`.
- Menambahkan endpoint `GET /api/presensi/audit/latest`.
- Menambahkan halaman demo `/dev/attendance-audit` untuk melihat hasil presensi terkini.
- Menambahkan test `PresensiSessionTimeoutTest`.

### Changed

- Mengubah alur create sesi di demo scanner agar mengecek warning jam sebelum membuat sesi.
- Mengubah audit presensi demo agar tampil dalam tabel, bukan JSON mentah.
- Mengubah scanner HP agar lebih mudah membaca QR kecil melalui peningkatan area scan, crop, dan kamera constraints.
- Mengubah script `check-successful-attendance.sh` agar ikut mengecek scan `warning`.

### Fixed

- Memperbaiki sesi aktif yang sebelumnya tidak memiliki timeout otomatis.
- Memperbaiki risiko user membuat sesi baru pada jam yang sudah pernah dipakai tanpa peringatan.
- Memperbaiki keterbacaan QR pada kamera HP untuk demo scanner.

## [0.9.0] - Manual Attendance Edit Manual

### Added

- Menambahkan Tahap 9: Manual Edit Presensi.
- Menambahkan endpoint `GET /api/presensi/jam-siswa`.
- Menambahkan endpoint `PATCH /api/presensi/jam-siswa/{id}`.
- Menambahkan endpoint `GET /api/presensi/edit-reasons`.
- Menambahkan service `PresensiManualEditService`.
- Menambahkan audit edit ke `presensi_edit_log`.
- Menambahkan permission `attendance.manual.read`, `attendance.manual.update`, `attendance.manual.audit.read`, dan `attendance.edit_reasons.read`.

### Changed

- Mengubah flow warning beda rombel: warning tidak di-resolve dan tetap menjadi log di `presensi_scan_log`.

### Removed

- Menghapus dummy siswa seed `X-TKJ-1` dan `X-TKJ-2`.
- Menghapus user seed `siswa.demo` dan `siswa.warning.demo`.
- Menghapus permission `attendance.warning.resolve`.

## [0.8.3] - Dynamic Rombel and Dev Scanner Polish

### Added

- Menambahkan endpoint `GET /api/rombel/options` untuk mengambil daftar rombel aktif dari database.
- Menambahkan dynamic rombel dropdown pada halaman demo scanner `/dev/scan`.
- Menambahkan pilihan jam presensi berbentuk dropdown multi-select dengan tanda centang.
- Menambahkan dukungan Cloudflare Quick Tunnel dinamis melalui `server.allowedHosts: true` pada Vite.
- Menambahkan validasi manual bahwa scan Sobri berhasil masuk ke `presensi_scan_log` dan `presensi_jam_siswa`.

### Changed

- Mengubah pilihan rombel di `/dev/scan` dari hardcode menjadi data dari backend.
- Mengubah input `Jam IDs` manual menjadi UI pilihan jam yang lebih aman untuk demo.
- Menghapus Tailwind Play CDN dari `frontend/index.html`.
- Menggunakan Tailwind lokal melalui plugin Vite dan `@import 'tailwindcss'`.

### Fixed

- Memperbaiki blank page `/dev/scan` akibat state dropdown jam yang belum didefinisikan.
- Memastikan cache browser/Vite tidak disalahartikan sebagai error backend.
- Memastikan warning Tailwind CDN hilang setelah CDN dihapus dari `index.html`.

## [0.8.2] - Dynamic Importer Rombel Mapping Fix

### Added

- Menambahkan mapping rombel bernomor dari kolom CSV `KELAS`.
- Menambahkan pengisian `tingkat_angka`, `nomor_rombel`, `label_rombel`, `label_rombel_raw`, `display_mode`, dan `is_inferred_from_import`.
- Menambahkan audit hasil import melalui `scripts/check-import-table-fill.sh`.

### Changed

- Mengubah importer agar `10 TKRO 1`, `10 TKRO 2`, `10 TKRO 3`, dan seterusnya tidak lagi masuk ke satu rombel yang sama.
- Mengubah mapping `siswa.rombel_id_aktif` agar mengikuti kelas aktual dari CSV.
- Mengubah relasi `penempatan_siswa_rombel` agar menunjuk rombel yang benar.

### Fixed

- Memperbaiki masalah rombel collapse pada hasil import real.
- Memastikan `10 TKRO 1` sampai `10 TKRO 5` memiliki `rombel_id` berbeda.
- Memastikan data seed demo `X-TKJ-1` dan `X-TKJ-2` tetap tidak di-exclude dari validasi.

## [0.8.1] - Dev Scanner and Mobile QR Demo

### Added

- Menambahkan halaman demo scanner `/dev/scan`.
- Menambahkan fitur login demo dari halaman scanner.
- Menambahkan fitur buat sesi presensi dari halaman scanner.
- Menambahkan fitur scan QR memakai kamera browser.
- Menambahkan fallback paste payload manual untuk pengujian tanpa kamera.
- Menambahkan dukungan demo HP melalui Cloudflare Quick Tunnel.
- Menambahkan parser QR Google Form dengan `entry.*` dinamis.

### Changed

- Mengubah parser QR agar tidak bergantung pada entry ID tetap.
- Mengubah parser agar bisa membaca field nama dan NISN dari parameter Google Form secara dinamis.
- Mengubah flow demo agar scan bisa diuji dari HP melalui HTTPS tunnel.

### Fixed

- Memperbaiki parser QR Google Form yang sebelumnya hanya cocok untuk payload tertentu.
- Memastikan QR Sobri bisa diparse menjadi:
  - `payload_nama = MUHAMMAD SOBRI`
  - `payload_nisn = 0088556888`
- Memastikan duplicate scan guard tetap berjalan pada demo scanner.
- Memastikan scan beda rombel tetap menghasilkan `warning`.

## [0.7.0] - Scan Readiness Import

### Added

- Import CSV siswa minimal untuk persiapan scan QR.
- Auto create/update siswa.
- Auto create/update jurusan dan rombel dari kolom `KELAS`.
- Auto create/update `siswa_qr`.
- Import jobs dan row logs.
- Script import CSV dari folder `backend/database/data`.
- Reset helper jika hasil import salah.

## [0.6.0] - Presensi Sesi

### Added

- Sesi presensi mode `rombel`.
- Sesi presensi mode `piket`.
- Pilihan ruang `kelas`, `lab-tkj-1` sampai `lab-tkj-4`, dan `piket`.
- Pause, resume, dan finish sesi.
- Guard bentrok ruang lab.
- Guard duplicate sesi rombel pada jam yang sama.
- Test presensi sesi.

## [0.5.0] - Auth and Permission Baseline

### Added

- Login dengan username dan password.
- Token stateless berbasis HMAC.
- Endpoint `/api/me`.
- Permission reader berbasis role dan user custom permission.
- Test auth dan token.

## [0.4.0] - Database Assets

### Added

- Schema database MVP.
- Seed permission MVP.
- Seed akun demo.
- Script reset database demo.

### Fixed

- Constraint database yang bentrok dengan MySQL foreign key behavior.

## [0.3.0] - PHPUnit Baseline

### Added

- PHPUnit 11.
- Test suite Unit dan Feature.
- Test `/api/health`, 404, dan 405.

## [0.2.0] - Backend Boilerplate

### Added

- Backend boilerplate Composer based.
- FastRoute routing.
- PHP-DI container.
- Response JSON standar.
- Request object.
- Exception handler.
- CORS middleware.
- Endpoint `/api/health`.

## [0.1.0] - Development Baseline

### Added

- Docker development environment.
- Nginx reverse proxy.
- Backend PHP-FPM.
- Frontend Vite.
- MySQL service.
