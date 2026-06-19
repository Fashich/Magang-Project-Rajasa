# Contributing Guide

Dokumen ini menjelaskan aturan kontribusi untuk project Presensi Siswa Rajasa.

## Branch

Semua branch development memakai prefix:

```text
alfy/
```

Contoh:

```text
alfy/backend-presensi-session
alfy/backend-presensi-scan
alfy/frontend-login
```

## Branch Utama

| Branch        | Fungsi                           |
| ------------- | -------------------------------- |
| `development` | Integrasi fitur aktif            |
| `nama/*`      | Branch kerja per fitur           |
| `main`        | Rilis stabil jika sudah tersedia |

## Alur Kerja

1. Pull branch `development`.
2. Buat branch baru dengan prefix `nama/`.
3. Kerjakan satu scope kecil.
4. Jalankan test.
5. Commit dengan pesan jelas.
6. Buat pull request ke `development`.

Contoh:

```bash
git checkout development
git pull origin development
git checkout -b alfy/backend-presensi-session
```

## Format Commit

Gunakan format:

```text
type: pesan singkat
```

Contoh:

```text
chore: clean documentation baseline
feat: add backend auth and permission baseline
test: add backend phpunit baseline
db: add mvp schema and seed assets
fix: handle invalid qr payload
```

## Tipe Commit

| Type       | Fungsi                                 |
| ---------- | -------------------------------------- |
| `chore`    | Struktur, konfigurasi, cleanup         |
| `feat`     | Fitur baru                             |
| `fix`      | Perbaikan bug                          |
| `test`     | Test                                   |
| `docs`     | Dokumentasi                            |
| `refactor` | Perapihan kode tanpa mengubah perilaku |
| `db`       | Schema, seed, atau script database     |

## Aturan Dokumentasi

Dokumentasi harus mengikuti kode nyata.

File utama:

```text
README.md
CHANGELOG.md
CONTRIBUTING.md
docs/ARCHITECTURE.md
docs/API.md
docs/DATABASE.md
docs/TESTING.md
```

Jika endpoint berubah, update `docs/API.md`.

Jika schema berubah, update `docs/DATABASE.md`.

Jika struktur backend berubah, update `docs/ARCHITECTURE.md`.

Jika test berubah, update `docs/TESTING.md`.

## Aturan Backend

Backend memakai pendekatan Composer based yang ringan.

Gunakan:

- FastRoute untuk routing,
- PHP-DI untuk dependency injection,
- Illuminate Database untuk database layer,
- PHPUnit untuk test.

Jangan menambah Laravel penuh, queue, Redis, policy engine, group engine, atau service berat lain tanpa kebutuhan MVP yang jelas.

## Aturan Database

Schema dan seed harus dipisah.

Lokasi:

```text
backend/database/schema/
backend/database/seeds/
```

Urutan reset demo:

```bash
./scripts/db-reset-demo.sh
```

Seed permission harus idempotent jika memungkinkan.

Akun demo tidak boleh berada di schema utama.

## Aturan Testing

Setiap fitur backend wajib punya test.

Minimal:

1. Unit test untuk logic utama.
2. Feature test untuk endpoint.
3. Test error case.

Sebelum PR, jalankan:

```bash
./scripts/db-reset-demo.sh
./scripts/test-backend.sh
```

## Sebelum Pull Request

Pastikan:

- Branch sudah up to date dari `development`.
- Tidak ada `.env` yang ikut commit.
- Tidak ada credential asli.
- Test passed.
- Dokumentasi sesuai perubahan.
- Tidak ada file development sampah.
