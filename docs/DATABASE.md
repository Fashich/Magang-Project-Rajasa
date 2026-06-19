# Database

Branch acuan: `alfy/backend-presensi-scan`

Dokumen ini merangkum database MVP Presensi Siswa Rajasa secara singkat dan langsung ke kebutuhan implementasi.

## File Database

```text
backend/database/schema/prototype-db-3.9.sql
backend/database/seeds/seed_permissions_mvp_presensi_qr.sql
backend/database/seeds/seed_akun_demo_mvp_presensi_qr.sql
```

Reset demo:

```bash
./scripts/db-reset-demo.sh
```

Import siswa real:

```bash
./scripts/import-scan-readiness.sh backend/database/data/data-siswa.csv
```

## Prinsip

- Schema dan seed dipisah.
- Data histori dan audit dijaga dengan foreign key `RESTRICT`.
- `siswa_qr` hanya untuk lookup payload QR, bukan generator gambar QR.
- Ruang tidak punya tabel final. Ruang disimpan sebagai snapshot sesi.
- Status presensi final ada di `presensi_jam_siswa`.
- Semua percobaan scan masuk `presensi_scan_log`.
- Edit manual masuk `presensi_edit_log`.

## Kelompok Tabel

| Kelompok | Tabel utama | Fungsi |
|---|---|---|
| IAM | `users`, `roles`, `permissions`, `user_roles`, `role_permissions` | Login dan akses |
| Akademik | `tahun_ajaran`, `jurusan`, `rombel`, `jam_pembelajaran` | Data dasar |
| Siswa | `siswa`, `penempatan_siswa_rombel`, `siswa_qr` | Siswa, rombel aktif, QR |
| Import | `import_jobs`, `import_row_logs` | Audit import |
| Presensi | `presensi_sesi`, `presensi_sesi_jam`, `presensi_jam_siswa`, `presensi_scan_log`, `presensi_edit_log` | Sesi, scan, status, audit |

## Seed Demo

Akun utama:

```text
admin.demo / Rajasa@123
```

Catatan terbaru:

- Dummy siswa `X-TKJ-1`, `X-TKJ-2`, `siswa.demo`, dan `siswa.warning.demo` sudah dihapus dari seed.
- Permission `attendance.warning.resolve` dihapus.
- Permission manual edit ditambahkan:
  - `attendance.manual.read`
  - `attendance.manual.update`
  - `attendance.manual.audit.read`
  - `attendance.edit_reasons.read`

## Import Siswa

Kolom minimal:

| CSV | Masuk ke |
|---|---|
| `NISN` | `siswa.nisn`, `siswa_qr.payload_nisn` |
| `NAMA` | `siswa.nama_lengkap`, `siswa_qr.payload_nama` |
| `KELAS` | `siswa.kelas_aktif`, `jurusan`, `rombel`, `penempatan_siswa_rombel` |

Aturan penting:

- NISN wajib string agar nol depan tidak hilang.
- Kelas bernomor tidak boleh collapse.
- Contoh `10 TKRO 1` sampai `10 TKRO 5` wajib punya `rombel_id` berbeda.
- `label_rombel` dan `label_rombel_raw` menyimpan label kelas dari sumber import.

## Tabel Inti

### `rombel`

Dipakai untuk dropdown rombel, sesi rombel, dan validasi beda rombel.

Kolom penting:

```text
rombel_id, tahun_ajaran_id, tingkatan, tingkat_angka, jurusan_id,
nomor_rombel, label_rombel, label_rombel_raw, display_mode, status
```

### `siswa`

Data induk siswa.

Kolom penting:

```text
siswa_id, nisn, nama_lengkap, jurusan_id_aktif, rombel_id_aktif, kelas_aktif, status
```

### `siswa_qr`

Referensi lookup QR.

Kolom penting:

```text
siswa_id, payload_raw, payload_normalized, payload_nama, payload_nisn
```

### `import_jobs` dan `import_row_logs`

Mencatat ringkasan dan detail baris import.

Kolom penting:

```text
import_id, import_type, status, total_rows, valid_rows, error_rows,
inserted_rows, updated_rows, row_number, row_status, message
```

### `presensi_sesi`

Menyimpan sesi presensi.

Kolom penting:

```text
presensi_sesi_id, session_uuid, mode_presensi, rombel_id,
tanggal, status, ruang_pilihan, ruang_label_snapshot,
opened_by_user_id, closed_by_user_id
```

Kolom timeout yang sudah tersedia dan dipakai implementasi saat ini:

```text
last_seen_at, expires_at, ended_at, ended_reason, updated_at
```

Catatan implementasi terbaru:

- Tidak ada perubahan schema.
- Sesi idle lebih dari 5 menit berubah menjadi `expired`.
- `ended_reason = timeout`.
- Heartbeat memperbarui `last_seen_at` dan `expires_at`.

### `presensi_sesi_jam`

Menyimpan jam dalam sesi.

Kolom penting:

```text
presensi_sesi_id, jam_id, urutan
```

Aturan:

- Satu sesi maksimal 3 jam.
- Jam harus berurutan.
- Mode piket dapat memakai lebih dari satu jam.

### `presensi_jam_siswa`

Status presensi final per siswa, tanggal, dan jam.

Kolom penting:

```text
presensi_id, tanggal, siswa_id, rombel_id_snapshot, jam_id,
status, mode_presensi, presensi_sesi_id, scan_log_id,
input_by_user_id, scanned_at, edited_by_user_id, edited_at, keterangan
```

Aturan:

- Saat sesi rombel dibuat, siswa dalam rombel dibuat `alpha`.
- Scan rombel valid menjadi `hadir`.
- Scan piket valid menjadi `terlambat`.
- Edit manual mengubah `mode_presensi = manual`.
- `scan_log_id` terisi jika perubahan berasal dari scan.

### `presensi_scan_log`

Mencatat semua percobaan scan.

Kolom penting:

```text
scan_log_id, presensi_sesi_id, tanggal, payload_raw,
payload_normalized, payload_nama, payload_nisn, status_scan,
warning_reason, siswa_id, selected_rombel_id, actual_rombel_id, created_at
```

Status scan:

| Status | Efek |
|---|---|
| `berhasil` | Mengubah atau membuat presensi |
| `warning` | Log saja, tidak membuat hadir |
| `invalid` | Log saja |
| `ditolak` | Log saja, tidak mengubah presensi |

Catatan:

- Warning beda rombel tidak di-resolve.
- Warning tetap menjadi bukti kejadian.
- Script audit fresh import sekarang mengecek `berhasil` dan `warning`.

### `presensi_edit_log`

Audit edit manual presensi.

Kolom penting:

```text
presensi_id, field_name, old_value, new_value,
edited_by_user_id, edited_at, alasan_edit
```

## Implementasi Terbaru dari Sisi Data

Tidak ada perubahan schema untuk penambahan terbaru.

Yang terjadi:

| Fitur | Tabel | Aksi data |
|---|---|---|
| Timeout sesi 5 menit | `presensi_sesi` | Update `status`, `last_seen_at`, `expires_at`, `ended_at`, `ended_reason` |
| Heartbeat sesi | `presensi_sesi` | Update `last_seen_at`, `expires_at` |
| Check warning jam harian | `presensi_sesi`, `presensi_sesi_jam`, `rombel` | Read only |
| Audit presensi terkini | `presensi_scan_log`, `presensi_jam_siswa`, `siswa` | Read only |
| Tombol akhiri sesi | `presensi_sesi` | Update status via finish endpoint |
| Scanner clarity | Tidak menyentuh DB | Frontend only |

## Validasi DB

Cek mapping import:

```bash
./scripts/check-import-table-fill.sh
```

Cek fresh import bebas scan berhasil atau warning:

```bash
./scripts/check-successful-attendance.sh
```

Cek sesi timeout:

```sql
SELECT presensi_sesi_id, status, last_seen_at, expires_at, ended_reason
FROM presensi_sesi
ORDER BY presensi_sesi_id DESC
LIMIT 10;
```

Cek scan terbaru:

```sql
SELECT scan_log_id, presensi_sesi_id, payload_nama, payload_nisn,
       status_scan, warning_reason, siswa_id,
       selected_rombel_id, actual_rombel_id, created_at
FROM presensi_scan_log
ORDER BY scan_log_id DESC
LIMIT 10;
```

Cek presensi dari scan:

```sql
SELECT p.presensi_id, p.presensi_sesi_id, p.scan_log_id,
       s.nisn, s.nama_lengkap, s.kelas_aktif,
       p.tanggal, p.jam_id, p.status, p.mode_presensi, p.scanned_at
FROM presensi_jam_siswa p
LEFT JOIN siswa s ON s.siswa_id = p.siswa_id
WHERE p.scan_log_id IS NOT NULL
ORDER BY p.presensi_id DESC
LIMIT 10;
```

## Non Scope Database Saat Ini

- Tabel ruang final.
- Plotting ruang.
- ESP32 sebagai perangkat presensi final.
- Queue worker.
- Multi sekolah.
- Integrasi orang tua.
- Laporan produksi final.
