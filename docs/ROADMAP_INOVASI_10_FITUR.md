# Roadmap Inovasi 10 Fitur

Dokumen ini menjadi acuan pengembangan resmi agar setiap fitur besar dikerjakan di branch terpisah, mudah direview, dan tidak merusak kode yang sudah ada.

## Kondisi Awal

- Branch aktif saat dokumen dibuat: `feature/logbook-praktik`.
- Branch yang sudah ada:
  - `main`
  - `development`
  - `feature/role-dashboard`
  - `feature/early-warning`
  - `feature/logbook-praktik`
- Frontend: Preact + Vite.
- Backend: PHP + FastRoute + PHP-DI + Illuminate Database.
- Fitur role selain siswa belum tersedia di routing utama dan masih jatuh ke halaman `RoleNotImplemented`.
- Backend sudah punya IAM dasar: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`.

## Strategi Branch

Semua fitur dikembangkan dari `development`, lalu merge kembali ke `development` setelah selesai dan lolos verifikasi.

Urutan umum:

```text
development
  -> feature/<nama-fitur>
  -> review/test
  -> merge ke development
```

Aturan kerja:

- Jangan menghapus kode lama kecuali memang menghambat fitur dan sudah jelas alasannya.
- Perubahan schema database masuk di file schema/migration terpisah atau patch SQL yang terdokumentasi.
- Setiap fitur minimal punya endpoint, permission, UI dasar, seed/demo data jika dibutuhkan, dan catatan API/docs.
- Fitur yang saling bergantung boleh dibuat bertahap, tapi branch tetap dipisahkan agar histori rapi.

## Milestone 0 - Fondasi Admin dan Navigasi Role

Branch: `feature/role-dashboard`

Status branch: sudah ada, gunakan branch ini untuk respons pengembangan berikutnya.

Tujuan:

- Membuat versi admin pertama yang layak dipakai.
- Menghubungkan user role `admin`, `guru`, `ortu`, dan `siswa` ke dashboard masing-masing.
- Menyiapkan layout role-aware agar fitur lain tidak membuat layout sendiri-sendiri.

Deliverable:

- `DashboardAdmin.jsx`
- `DashboardGuru.jsx`
- `DashboardOrtu.jsx`
- routing role di `app.jsx`
- menu/sidebar berbasis permission
- service API dashboard
- endpoint ringkasan dashboard admin/guru/ortu

Kriteria selesai:

- Login admin tidak lagi masuk `RoleNotImplemented`.
- Admin bisa melihat ringkasan siswa, rombel, sesi presensi, hadir, terlambat, alfa.
- Guru bisa melihat tren kelas/rombel yang dia ampu.
- Ortu bisa melihat ringkasan anak.
- Data awal boleh dummy terkontrol, tetapi struktur endpoint harus siap diganti query live.

## Milestone 1 - Role-Based Smart Dashboard

Branch: `feature/role-dashboard`

Alasan memakai branch yang sama:

- Fitur ini adalah inti dari dashboard admin/guru/ortu.
- Branch sudah tersedia dan memang sesuai namanya.

Lingkup:

- Tambahkan chart library, disarankan `chart.js` atau `apexcharts`.
- Query backend difilter berdasarkan role dan permission.
- Dashboard menampilkan konten berbeda untuk admin, guru, ortu, dan siswa.

Deliverable:

- kartu KPI per role
- grafik tren presensi bulanan/mingguan
- grafik status hadir/terlambat/alfa/izin/sakit
- filter periode dan rombel

Kriteria selesai:

- Admin melihat agregat sekolah.
- Guru melihat kelas/rombel terkait.
- Ortu melihat anak terkait.
- Siswa tetap melihat presensi dirinya.

## Milestone 2 - Pattern-Based Early Warning

Branch: `feature/early-warning`

Status branch: sudah ada.

Lingkup:

- Rule sederhana, tanpa ML.
- Contoh aturan awal:
  - terlambat lebih dari 3 kali dalam 14 hari
  - alfa lebih dari 2 kali dalam 14 hari
  - izin/sakit berulang dalam pola tidak wajar
- Buat scheduled command/script backend yang bisa dipanggil cron Windows Task Scheduler.

Deliverable:

- tabel `attendance_alerts`
- tabel `notification_outbox`
- service deteksi pola
- endpoint daftar alert untuk admin/guru/BK
- UI alert di dashboard admin/guru
- adapter notifikasi email/WhatsApp yang bisa dimatikan lewat `.env`

Kriteria selesai:

- Alert tidak dobel untuk pola yang sama.
- Alert memiliki status `open`, `acknowledged`, `resolved`.
- Data demo bisa memicu alert secara konsisten.

## Milestone 3 - Integrasi Absensi dan Logbook Praktik

Branch: `feature/logbook-praktik`

Status branch: aktif saat dokumen dibuat.

Lingkup:

- Absensi lab/bengkel terkait langsung dengan logbook praktik.
- Fokus satu jurusan dulu.
- Tidak memakai IoT, cukup QR check-in berbasis web.

Deliverable:

- tabel `workshop_logs`
- tabel relasi `attendance_workshop_logs` atau foreign key dari log ke presensi
- upload foto/bukti praktik
- status verifikasi guru produktif: `draft`, `submitted`, `verified`, `rejected`
- UI siswa untuk submit logbook
- UI guru untuk verifikasi

Kriteria selesai:

- Satu presensi lab bisa dihubungkan ke satu atau lebih log praktik.
- Guru produktif bisa memberi catatan verifikasi.
- Admin/guru bisa filter log berdasarkan kelas, jurusan, tanggal, dan status.

## Milestone 4 - Portal E-Izin dan Approval Berjenjang

Branch baru: `feature/permission-workflow`

Lingkup:

- Pengajuan izin/sakit online.
- Workflow sederhana: `pending`, `approved`, `rejected`.
- Approval trail: ortu, wali kelas, BK.

Deliverable:

- tabel `permission_requests`
- tabel `permission_approval_logs`
- upload lampiran surat/foto
- endpoint submit, approve, reject, list
- UI form pengajuan
- UI approval per role
- integrasi status sah ke presensi

Kriteria selesai:

- Request yang approved bisa memengaruhi status presensi menjadi izin/sakit sah.
- Setiap approval/rejection menyimpan actor, waktu, role, dan catatan.

## Milestone 5 - Gamifikasi Kehadiran

Branch baru: `feature/attendance-gamification`

Lingkup:

- Poin hadir tepat waktu.
- Badge disiplin.
- Reward non-materi sederhana.

Deliverable:

- tabel `attendance_points`
- tabel `badges`
- tabel `student_badges`
- service kalkulasi poin
- dashboard progress siswa dan ortu
- template sertifikat PDF sederhana

Kriteria selesai:

- Poin bertambah otomatis dari presensi valid.
- Badge diberikan berdasarkan threshold.
- Admin bisa melihat leaderboard sederhana per kelas.

## Milestone 6 - Laporan Akreditasi Otomatis

Branch baru: `feature/accreditation-reports`

Lingkup:

- Laporan bulanan.
- Laporan per kelas.
- Laporan per jurusan.
- Export Excel dan PDF.

Deliverable:

- endpoint export laporan
- filter periode, kelas, jurusan
- template laporan SNAP/BKD friendly
- audit export

Kriteria selesai:

- Admin bisa export Excel/PDF.
- Angka laporan cocok dengan data presensi.
- Export tercatat di audit log.

## Milestone 7 - QR Attendance Offline Auto-Sync

Branch baru: `feature/offline-qr-sync`

Lingkup:

- PWA ringan.
- Cache scan saat offline memakai IndexedDB atau localStorage.
- Endpoint sync batch.

Deliverable:

- service worker
- manifest PWA
- local queue scan
- endpoint `/api/presensi/scan-sync`
- UI indikator online/offline dan jumlah antrean sync

Kriteria selesai:

- Scan tetap tersimpan saat jaringan mati.
- Saat online, antrean terkirim otomatis.
- Konflik/duplikasi scan ditangani backend secara idempotent.

## Milestone 8 - Analitik Korelasi Kehadiran dan Prestasi

Branch baru: `feature/academic-correlation`

Lingkup:

- Import CSV nilai atau input manual.
- Hitung korelasi sederhana antara persentase hadir dan rata-rata nilai.
- Visualisasi trendline di dashboard guru/ortu/admin.

Deliverable:

- tabel `academic_scores`
- endpoint import nilai CSV
- service hitung korelasi/regresi sederhana
- grafik scatter + trendline

Kriteria selesai:

- Guru melihat korelasi per kelas.
- Ortu melihat posisi anaknya tanpa membuka data pribadi siswa lain.
- Admin melihat agregat per jurusan/kelas.

## Milestone 9 - Audit Trail dan Kepatuhan Data

Branch baru: `feature/compliance-audit-trail`

Lingkup:

- Fokus aktivitas kritis: login, absen, edit data, export.
- Permission ketat per role.
- Audit viewer khusus admin.

Deliverable:

- tabel `audit_logs`
- middleware/helper audit
- log login success/failure
- log scan presensi
- log manual edit
- log export laporan
- halaman audit viewer admin

Kriteria selesai:

- Admin bisa filter audit berdasarkan actor, aksi, tanggal, dan modul.
- Data lama tidak rusak.
- Password tetap memakai hash, bukan plaintext.

## Milestone 10 - Communication Hub Terarah

Branch baru: `feature/communication-hub`

Lingkup:

- Ticketing sederhana, bukan chat realtime penuh.
- Kategori awal: izin, akademik, teknis.
- Routing berdasarkan kategori dan role.

Deliverable:

- tabel `communication_tickets`
- tabel `communication_ticket_messages`
- status `open`, `in_progress`, `resolved`, `closed`
- prioritas `normal`, `urgent`
- endpoint list/create/reply/status
- UI inbox per role

Kriteria selesai:

- Pesan izin masuk ke wali kelas/BK.
- Pesan akademik masuk ke guru/wali kelas.
- Pesan teknis masuk ke admin/staff.
- Semua perubahan status tercatat.

## Urutan Implementasi Disarankan

1. `feature/role-dashboard`
2. `feature/compliance-audit-trail`
3. `feature/early-warning`
4. `feature/logbook-praktik`
5. `feature/permission-workflow`
6. `feature/accreditation-reports`
7. `feature/offline-qr-sync`
8. `feature/attendance-gamification`
9. `feature/academic-correlation`
10. `feature/communication-hub`

Alasan urutan:

- Dashboard dan admin shell dibutuhkan hampir semua fitur.
- Audit trail sebaiknya masuk awal agar fitur berikutnya langsung tercatat.
- Early warning, izin, laporan, dan komunikasi memakai data presensi yang sama.
- Offline sync perlu hati-hati karena menyentuh flow scan utama.

## Rekomendasi Branch Untuk Respons Berikutnya

Gunakan branch:

```text
feature/role-dashboard
```

Target respons berikutnya:

- checkout ke `feature/role-dashboard`
- pastikan perubahan lokal di `frontend/vite.config.js` aman dan tidak tertimpa
- implementasi Dashboard Admin versi pertama
- sambungkan routing role admin/guru/ortu
- siapkan endpoint ringkasan dashboard role-aware

## Definisi Selesai Global

Setiap fitur dianggap selesai jika:

- endpoint backend tersedia dan memakai permission yang tepat
- UI tersedia sesuai role
- data dummy/seed tersedia jika fitur butuh demo
- validasi input dan error state ada
- dokumentasi API/database diperbarui
- minimal diuji dengan build frontend dan test backend yang relevan
