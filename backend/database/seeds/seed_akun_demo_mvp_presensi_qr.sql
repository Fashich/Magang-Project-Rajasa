-- =========================================================
-- SEED AKUN DEMO MVP - PRESENSI QR SISWA
-- Target DB: sistem_presensi_siswa_qr
-- Password semua akun demo: Rajasa@123
-- Hash: bcrypt/PHP password_hash, cocok untuk password_verify()
-- Aman dijalankan berulang. Tidak membuat tabel akses lama.
-- Jalankan setelah schema prototype-db-3.9 dan seed_permissions_mvp_presensi_qr.sql.
-- =========================================================

USE `sistem_presensi_siswa_qr`;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

SET @demo_password_hash := '$2y$12$qsBTAZEla6ytj21DsIFONuN4ZAEIDtr1OPUcVSHKioV1whJlIG4bC';

-- ---------------------------------------------------------
-- 1. Pastikan role dasar tersedia
-- ---------------------------------------------------------
INSERT INTO `roles` (`nama_role`, `role_slug`, `deskripsi`, `level_rank`, `is_system`) VALUES
  ('Super Admin', 'super_admin', 'Akses tertinggi sistem.', 100, 1),
  ('Admin', 'admin', 'Mengelola data utama, koreksi presensi, laporan, import, dan konfigurasi.', 80, 1),
  ('Guru', 'guru', 'Melakukan presensi rombel/piket, koreksi presensi, warning, dan laporan terkait.', 30, 1),
  ('Staff', 'staff', 'Melakukan presensi piket/rombel, koreksi presensi, warning, dan laporan terkait.', 30, 1),
  ('Intern Presensi', 'intern_presensi', 'Akses custom terbatas untuk membantu presensi.', 20, 1),
  ('Siswa', 'siswa', 'Melihat profil dan hasil presensi milik sendiri.', 10, 1)
ON DUPLICATE KEY UPDATE
  `nama_role` = VALUES(`nama_role`),
  `deskripsi` = VALUES(`deskripsi`),
  `level_rank` = VALUES(`level_rank`),
  `is_system` = VALUES(`is_system`),
  `status` = 'aktif';

-- ---------------------------------------------------------
-- 2. Data akademik demo
-- ---------------------------------------------------------
INSERT INTO `tahun_ajaran` (`nama_tahun_ajaran`, `semester_aktif`, `tanggal_mulai`, `tanggal_selesai`, `is_aktif`) VALUES
('2026/2027', 'ganjil', '2026-07-01', '2027-06-30', 1)
ON DUPLICATE KEY UPDATE
  `semester_aktif` = VALUES(`semester_aktif`),
  `tanggal_mulai` = VALUES(`tanggal_mulai`),
  `tanggal_selesai` = VALUES(`tanggal_selesai`),
  `is_aktif` = VALUES(`is_aktif`);

SET @tahun_ajaran_demo_id := (
  SELECT `tahun_ajaran_id`
  FROM `tahun_ajaran`
  WHERE `nama_tahun_ajaran` = '2026/2027'
  LIMIT 1
);

INSERT INTO `jurusan` (`kode_jurusan`, `nama_jurusan`, `ketua_jurusan`, `deskripsi_jurusan`, `status`) VALUES
('TKJ', 'Teknik Komputer dan Jaringan', NULL, 'Jurusan demo untuk presensi QR siswa.', 'aktif')
ON DUPLICATE KEY UPDATE
  `nama_jurusan` = VALUES(`nama_jurusan`),
  `deskripsi_jurusan` = VALUES(`deskripsi_jurusan`),
  `status` = 'aktif';

SET @jurusan_tkj_id := (
  SELECT `jurusan_id`
  FROM `jurusan`
  WHERE `kode_jurusan` = 'TKJ'
  LIMIT 1
);

-- Jam pembelajaran demo. Disediakan lagi agar aman jika seed schema awal dilewati.
INSERT INTO `jam_pembelajaran` (`jam_ke`, `label_jam`, `tipe_hari`, `status`) VALUES
  (1, 'Jam ke-1', 'normal', 'aktif'),
  (2, 'Jam ke-2', 'normal', 'aktif'),
  (3, 'Jam ke-3', 'normal', 'aktif'),
  (4, 'Jam ke-4', 'normal', 'aktif'),
  (5, 'Jam ke-5', 'normal', 'aktif'),
  (6, 'Jam ke-6', 'normal', 'aktif'),
  (7, 'Jam ke-7', 'normal', 'aktif'),
  (8, 'Jam ke-8', 'normal', 'aktif')
ON DUPLICATE KEY UPDATE
  `label_jam` = VALUES(`label_jam`),
  `status` = VALUES(`status`);

-- ---------------------------------------------------------
-- 3. Data guru/staff demo
-- ---------------------------------------------------------
INSERT INTO `guru_staff` (`nip`, `nama_lengkap`, `no_telp`, `email`, `jenis_user`, `status`) VALUES
('SA001', 'Super Admin Demo', NULL, 'superadmin.demo@smksrajasa.sch.id', 'admin', 'aktif'),
('ADM001', 'Admin Demo', NULL, 'admin.demo@smksrajasa.sch.id', 'admin', 'aktif'),
('GURU001', 'Guru Demo', NULL, 'guru.demo@smksrajasa.sch.id', 'guru', 'aktif'),
('STAFF001', 'Staff Piket Demo', NULL, 'staff.demo@smksrajasa.sch.id', 'staff', 'aktif'),
('INT001', 'Intern Presensi Demo', NULL, 'intern.demo@smksrajasa.sch.id', 'intern', 'aktif')
ON DUPLICATE KEY UPDATE
  `nama_lengkap` = VALUES(`nama_lengkap`),
  `email` = VALUES(`email`),
  `jenis_user` = VALUES(`jenis_user`),
  `status` = 'aktif';

SET @superadmin_guru_id := (SELECT `guru_id` FROM `guru_staff` WHERE `nip` = 'SA001' LIMIT 1);
SET @admin_guru_id := (SELECT `guru_id` FROM `guru_staff` WHERE `nip` = 'ADM001' LIMIT 1);
SET @guru_demo_id := (SELECT `guru_id` FROM `guru_staff` WHERE `nip` = 'GURU001' LIMIT 1);
SET @staff_demo_id := (SELECT `guru_id` FROM `guru_staff` WHERE `nip` = 'STAFF001' LIMIT 1);
SET @intern_demo_id := (SELECT `guru_id` FROM `guru_staff` WHERE `nip` = 'INT001' LIMIT 1);

-- ---------------------------------------------------------
-- 4.  Akun user demo
-- ---------------------------------------------------------
INSERT INTO `users`
(`username`, `password_hash`, `email`, `user_type`, `siswa_id`, `guru_id`, `status`)
VALUES
('superadmin.demo', @demo_password_hash, 'superadmin.demo@smksrajasa.sch.id', 'super_admin', NULL, @superadmin_guru_id, 'aktif'),
('admin.demo', @demo_password_hash, 'admin.demo@smksrajasa.sch.id', 'admin', NULL, @admin_guru_id, 'aktif'),
('guru.demo', @demo_password_hash, 'guru.demo@smksrajasa.sch.id', 'guru', NULL, @guru_demo_id, 'aktif'),
('staff.demo', @demo_password_hash, 'staff.demo@smksrajasa.sch.id', 'staff', NULL, @staff_demo_id, 'aktif'),
('intern.demo', @demo_password_hash, 'intern.demo@smksrajasa.sch.id', 'intern', NULL, @intern_demo_id, 'aktif')
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `email` = VALUES(`email`),
  `user_type` = VALUES(`user_type`),
  `siswa_id` = VALUES(`siswa_id`),
  `guru_id` = VALUES(`guru_id`),
  `status` = 'aktif';

-- ---------------------------------------------------------
-- 5 Hubungkan akun demo ke role
-- ---------------------------------------------------------
INSERT INTO `user_roles` (`user_id`, `role_id`, `is_active`)
SELECT u.`user_id`, r.`role_id`, 1
FROM `users` u
JOIN `roles` r
WHERE u.`username` = 'superadmin.demo'
  AND r.`role_slug` = 'super_admin'
ON DUPLICATE KEY UPDATE `is_active` = 1;

INSERT INTO `user_roles` (`user_id`, `role_id`, `is_active`)
SELECT u.`user_id`, r.`role_id`, 1
FROM `users` u
JOIN `roles` r
WHERE u.`username` = 'admin.demo'
  AND r.`role_slug` = 'admin'
ON DUPLICATE KEY UPDATE `is_active` = 1;

INSERT INTO `user_roles` (`user_id`, `role_id`, `is_active`)
SELECT u.`user_id`, r.`role_id`, 1
FROM `users` u
JOIN `roles` r
WHERE u.`username` = 'guru.demo'
  AND r.`role_slug` = 'guru'
ON DUPLICATE KEY UPDATE `is_active` = 1;

INSERT INTO `user_roles` (`user_id`, `role_id`, `is_active`)
SELECT u.`user_id`, r.`role_id`, 1
FROM `users` u
JOIN `roles` r
WHERE u.`username` = 'staff.demo'
  AND r.`role_slug` = 'staff'
ON DUPLICATE KEY UPDATE `is_active` = 1;

INSERT INTO `user_roles` (`user_id`, `role_id`, `is_active`)
SELECT u.`user_id`, r.`role_id`, 1
FROM `users` u
JOIN `roles` r
WHERE u.`username` = 'intern.demo'
  AND r.`role_slug` = 'intern_presensi'
ON DUPLICATE KEY UPDATE `is_active` = 1;

COMMIT;

-- =========================================================
-- RINGKASAN AKUN DEMO
-- Password semua akun: Rajasa@123
--
-- superadmin.demo      -> role super_admin
-- admin.demo           -> role admin
-- staff.demo           -> role staff
-- intern.demo          -> role intern_presensi
--
-- =========================================================
