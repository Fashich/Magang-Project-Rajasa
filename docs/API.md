# API

Branch acuan: `alfy/backend-presensi-scan`

Base URL development:

```text
http://localhost:8080/api
```

Frontend Vite dapat memakai proxy:

```text
/api
```

## Format Response

Sukses:

```json
{
  "success": true,
  "message": "Berhasil",
  "data": {}
}
```

Gagal:

```json
{
  "success": false,
  "message": "Terjadi kesalahan",
  "errors": {}
}
```

Auth header:

```text
Authorization: Bearer TOKEN
```

## Endpoint Ringkas

| Method | Endpoint | Fungsi | Permission |
|---|---|---|---|
| `GET` | `/health` | Cek backend aktif | Public |
| `POST` | `/auth/login` | Login dan ambil token | Public |
| `POST` | `/auth/logout` | Logout client-side | Login |
| `GET` | `/me` | Data user aktif | Login |
| `GET` | `/rombel/options` | Daftar rombel aktif | `attendance.session.read` |
| `POST` | `/presensi/sesi/check-warning` | Cek jam sudah pernah dipakai hari ini | `attendance.session.create` |
| `POST` | `/presensi/sesi` | Membuat sesi presensi | `attendance.session.create` |
| `GET` | `/presensi/sesi/aktif` | Melihat sesi aktif/suspended | `attendance.session.read` |
| `POST` | `/presensi/sesi/{id}/pause` | Menjeda sesi | `attendance.session.update` |
| `POST` | `/presensi/sesi/{id}/resume` | Melanjutkan sesi | `attendance.session.update` |
| `POST` | `/presensi/sesi/{id}/finish` | Menutup sesi | `attendance.session.update` |
| `POST` | `/presensi/sesi/{id}/heartbeat` | Menjaga sesi tetap aktif | `attendance.session.update` |
| `POST` | `/import/scan-readiness` | Import siswa CSV untuk QR | `import.submit` |
| `GET` | `/import/jobs` | Riwayat import | `import.read` |
| `GET` | `/import/jobs/{id}/rows` | Log baris import | `import.read` |
| `POST` | `/presensi/scan` | Menerima hasil scan QR | `attendance.scan` |
| `GET` | `/presensi/audit/latest` | Audit scan dan presensi terkini | `attendance.log.read` |
| `GET` | `/presensi/jam-siswa` | Daftar presensi siswa | `attendance.manual.read` |
| `PATCH` | `/presensi/jam-siswa/{id}` | Edit presensi manual | `attendance.manual.update` |
| `GET` | `/presensi/edit-reasons` | Daftar alasan edit | `attendance.edit_reasons.read` |

## Auth

### POST `/auth/login`

Request:

```json
{
  "username": "admin.demo",
  "password": "Rajasa@123"
}
```

Response mengembalikan token, user, role, dan permission.

### GET `/me`

Mengembalikan user aktif berdasarkan bearer token.

## Rombel Options

### GET `/rombel/options`

Fungsi: mengisi dropdown rombel dari database.

Response utama:

```json
{
  "rombel": [
    {
      "rombel_id": 38,
      "label": "12 TKRO 1",
      "tingkat_angka": 12,
      "nomor_rombel": 1,
      "status": "aktif"
    }
  ]
}
```

## Presensi Sesi

### POST `/presensi/sesi`

Request mode rombel:

```json
{
  "mode_presensi": "rombel",
  "rombel_id": 38,
  "jam_ids": [1, 2],
  "ruang_pilihan": "kelas"
}
```

Request mode piket:

```json
{
  "mode_presensi": "piket",
  "jam_ids": [1, 2],
  "ruang_pilihan": "piket"
}
```

Aturan utama:

| Aturan | Response |
|---|---|
| Token tidak ada | `401` |
| Tidak punya permission | `403` |
| Mode tidak valid | `422` |
| Rombel wajib untuk mode `rombel` | `422` |
| Mode `piket` tidak boleh memilih rombel | `422` |
| Jam kosong/lebih dari 3/tidak berurutan | `422` |
| Rombel aktif/suspended bentrok | `409` |
| Lab aktif/suspended bentrok | `409` |

### POST `/presensi/sesi/check-warning`

Fungsi: memberi warning jika `jam_ids` sudah pernah dipakai pada tanggal yang sama.

Response aman:

```json
{
  "has_warning": false,
  "message": "Tidak ada warning.",
  "conflicts": []
}
```

Response warning:

```json
{
  "has_warning": true,
  "message": "Jam pelajaran ini sudah pernah dipakai hari ini.",
  "conflicts": [
    {
      "presensi_sesi_id": 12,
      "jam_id": 1,
      "status": "selesai",
      "ruang_label_snapshot": "Kelas 12 TKRO 1"
    }
  ]
}
```

Catatan: warning ini tidak memblokir create sesi. Frontend menampilkan pilihan lanjut atau batal.

### POST `/presensi/sesi/{id}/heartbeat`

Fungsi: memperbarui aktivitas sesi.

Aturan:

```text
timeout = 5 menit tanpa aktivitas
heartbeat memperbarui last_seen_at dan expires_at
sesi idle berubah menjadi expired
ended_reason = timeout
```

### POST `/presensi/sesi/{id}/finish`

Fungsi: mengakhiri sesi secara manual.

## Import Scan Readiness

### POST `/import/scan-readiness`

Fungsi: import CSV siswa untuk kebutuhan scan QR.

Kolom wajib:

| Kolom | Fungsi |
|---|---|
| `NISN` | Identitas QR dan siswa |
| `NAMA` | Nama siswa |
| `KELAS` | Jurusan, rombel, dan kelas aktif |

Request file path:

```json
{
  "file_path": "/var/www/database/data/data-siswa.csv"
}
```

Request multipart:

```bash
curl -i -X POST http://localhost:8080/api/import/scan-readiness \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@backend/database/data/data-siswa.csv"
```

Response sukses:

```json
{
  "import_job_id": 1,
  "summary": {
    "total_rows": 1391,
    "success_rows": 1391,
    "failed_rows": 0
  }
}
```

Implementasi saat ini:

```text
CSV siswa aktif
mapping rombel bernomor aktif
10 TKRO 1 sampai 10 TKRO 5 masuk rombel berbeda
```

## Presensi Scan

### POST `/presensi/scan`

Request:

```json
{
  "presensi_sesi_id": 9,
  "payload_raw": "https://docs.google.com/forms/d/e/demo/formResponse?entry.1743651050=MUHAMMAD+SOBRI&entry.178375719=0088556888"
}
```

Format payload yang didukung:

| Format | Status |
|---|---|
| URL Google Form `entry.*` | Didukung |
| Payload plain nama dan NISN | Didukung |
| NISN nol depan | Tetap string |

Hasil scan:

| Kondisi | `status_scan` | Efek DB |
|---|---|---|
| QR valid sesuai rombel | `berhasil` | `presensi_jam_siswa = hadir` |
| QR valid mode piket | `berhasil` | `presensi_jam_siswa = terlambat` |
| QR valid beda rombel | `warning` | Hanya masuk `presensi_scan_log` |
| QR tidak dikenal | `invalid` | Hanya masuk `presensi_scan_log` |
| Scan duplikat | `ditolak` | Log masuk, presensi tidak berubah |

Response berhasil:

```json
{
  "status_scan": "berhasil",
  "attendance_status": "hadir",
  "affected_rows": 1,
  "warning_reason": "none"
}
```

Response warning:

```json
{
  "status_scan": "warning",
  "warning_reason": "siswa_tidak_sesuai_rombel",
  "attendance_status": null,
  "affected_rows": 0
}
```

## Audit Presensi Terkini

### GET `/presensi/audit/latest`

Fungsi: menampilkan ringkasan scan dan presensi terbaru untuk halaman demo audit.

Response utama:

```json
{
  "summary": {
    "scan_berhasil": 1,
    "scan_warning": 0,
    "scan_invalid": 0,
    "scan_ditolak": 0,
    "attendance_from_scan": 1
  },
  "scan_logs": [],
  "attendance_rows": []
}
```

## Manual Edit Presensi

### GET `/presensi/jam-siswa`

Fungsi: melihat daftar presensi siswa untuk koreksi manual.

Filter umum:

```text
tanggal
rombel_id
jam_id
status
q
```

### PATCH `/presensi/jam-siswa/{id}`

Request:

```json
{
  "status": "izin",
  "reason_code": "siswa_izin",
  "reason_text": ""
}
```

Aturan:

```text
status: alpha, hadir, terlambat, izin, sakit
reason_code = lainnya wajib reason_text
status baru tidak boleh sama dengan status lama
setiap edit masuk presensi_edit_log
```

### GET `/presensi/edit-reasons`

Response:

```json
{
  "reasons": [
    {
      "code": "siswa_izin",
      "label": "Siswa izin",
      "requires_text": false
    },
    {
      "code": "lainnya",
      "label": "Lainnya",
      "requires_text": true
    }
  ]
}
```

Alasan yang tersedia:

```text
siswa_sakit
siswa_izin
siswa_tidak_bawa_kartu
siswa_memakai_kartu_teman
koreksi_input
lainnya
```

## Implementasi Dev Saat Ini

Route frontend demo:

| Route | Fungsi |
|---|---|
| `/dev/scan` | Demo scan QR presensi |
| `/dev/attendance-audit` | Demo hasil presensi terkini |

Catatan dev:

```text
/dev/* hanya untuk demo/testing
Cloudflare Quick Tunnel didukung untuk kamera HP
scanner HP memakai crop, qrbox besar, dan camera track enhancement
```

## Error Code

| Code | Arti |
|---|---|
| `200` | Berhasil |
| `201` | Data dibuat |
| `401` | Token tidak ada/tidak valid |
| `403` | Tidak punya akses |
| `404` | Endpoint atau data tidak ditemukan |
| `405` | Method tidak diizinkan |
| `409` | Konflik data |
| `422` | Validasi gagal |
| `500` | Error sistem |
