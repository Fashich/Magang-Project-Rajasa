-- ============================================================
-- SEED DATA AKADEMIK - SMKS RAJASA SURABAYA v2
-- Fix: jam_id eksplisit karena TiDB overflow TINYINT AUTO_INCREMENT
-- ============================================================

USE `sistem_presensi_siswa_qr`;

-- 1. JURUSAN
INSERT INTO `jurusan` (`kode_jurusan`, `nama_jurusan`, `ketua_jurusan`, `status`) VALUES
  ('TKJ', 'Teknik Komputer dan Jaringan', NULL, 'aktif'),
  ('RPL', 'Rekayasa Perangkat Lunak',     NULL, 'aktif'),
  ('MM',  'Multimedia',                   NULL, 'aktif'),
  ('AK',  'Akuntansi',                    NULL, 'aktif'),
  ('PM',  'Pemasaran',                    NULL, 'aktif')
ON DUPLICATE KEY UPDATE `nama_jurusan` = VALUES(`nama_jurusan`);

-- 2. TAHUN AJARAN
INSERT INTO `tahun_ajaran` (`nama_tahun_ajaran`, `semester_aktif`, `tanggal_mulai`, `tanggal_selesai`, `is_aktif`) VALUES
  ('2024/2025', 'ganjil', '2024-07-15', '2024-12-20', 0),
  ('2024/2025', 'genap',  '2025-01-06', '2025-06-20', 0),
  ('2025/2026', 'ganjil', '2025-07-14', '2025-12-19', 0),
  ('2025/2026', 'genap',  '2026-01-05', '2026-06-19', 1)
ON DUPLICATE KEY UPDATE `is_aktif` = VALUES(`is_aktif`);

-- 3. JAM PEMBELAJARAN (jam_id eksplisit, hindari TiDB TINYINT AUTO_INCREMENT overflow)
INSERT INTO `jam_pembelajaran` (`jam_id`, `jam_ke`, `label_jam`, `waktu_mulai`, `waktu_selesai`, `tipe_hari`, `status`) VALUES
  (1,  1, 'Jam ke-1', '07:00', '07:45', 'normal', 'aktif'),
  (2,  2, 'Jam ke-2', '07:45', '08:30', 'normal', 'aktif'),
  (3,  3, 'Jam ke-3', '08:30', '09:15', 'normal', 'aktif'),
  (4,  4, 'Jam ke-4', '09:30', '10:15', 'normal', 'aktif'),
  (5,  5, 'Jam ke-5', '10:15', '11:00', 'normal', 'aktif'),
  (6,  6, 'Jam ke-6', '11:00', '11:45', 'normal', 'aktif'),
  (7,  7, 'Jam ke-7', '12:30', '13:15', 'normal', 'aktif'),
  (8,  8, 'Jam ke-8', '13:15', '14:00', 'normal', 'aktif'),
  (9,  1, 'Jam ke-1 (Jumat)', '07:00', '07:40', 'jumat', 'aktif'),
  (10, 2, 'Jam ke-2 (Jumat)', '07:40', '08:20', 'jumat', 'aktif'),
  (11, 3, 'Jam ke-3 (Jumat)', '08:20', '09:00', 'jumat', 'aktif'),
  (12, 4, 'Jam ke-4 (Jumat)', '09:30', '10:10', 'jumat', 'aktif'),
  (13, 5, 'Jam ke-5 (Jumat)', '10:10', '10:50', 'jumat', 'aktif'),
  (14, 6, 'Jam ke-6 (Jumat)', '10:50', '11:30', 'jumat', 'aktif')
ON DUPLICATE KEY UPDATE `label_jam` = VALUES(`label_jam`), `waktu_mulai` = VALUES(`waktu_mulai`), `waktu_selesai` = VALUES(`waktu_selesai`);

-- 4. ROMBEL
SET @ta_id  = (SELECT `tahun_ajaran_id` FROM `tahun_ajaran` WHERE `nama_tahun_ajaran` = '2025/2026' AND `semester_aktif` = 'genap' LIMIT 1);
SET @tkj_id = (SELECT `jurusan_id` FROM `jurusan` WHERE `kode_jurusan` = 'TKJ' LIMIT 1);
SET @rpl_id = (SELECT `jurusan_id` FROM `jurusan` WHERE `kode_jurusan` = 'RPL' LIMIT 1);
SET @mm_id  = (SELECT `jurusan_id` FROM `jurusan` WHERE `kode_jurusan` = 'MM'  LIMIT 1);

INSERT INTO `rombel` (`tahun_ajaran_id`, `tingkatan`, `tingkat_angka`, `jurusan_id`, `nomor_rombel`, `label_rombel`, `label_rombel_raw`, `display_mode`, `status`) VALUES
  (@ta_id, 'X',   10, @tkj_id, 1, 'X TKJ 1',   'X TKJ 1',   'dengan_nomor', 'aktif'),
  (@ta_id, 'X',   10, @tkj_id, 2, 'X TKJ 2',   'X TKJ 2',   'dengan_nomor', 'aktif'),
  (@ta_id, 'XI',  11, @tkj_id, 1, 'XI TKJ 1',  'XI TKJ 1',  'dengan_nomor', 'aktif'),
  (@ta_id, 'XI',  11, @tkj_id, 2, 'XI TKJ 2',  'XI TKJ 2',  'dengan_nomor', 'aktif'),
  (@ta_id, 'XII', 12, @tkj_id, 1, 'XII TKJ 1', 'XII TKJ 1', 'dengan_nomor', 'aktif'),
  (@ta_id, 'XII', 12, @tkj_id, 2, 'XII TKJ 2', 'XII TKJ 2', 'dengan_nomor', 'aktif'),
  (@ta_id, 'X',   10, @rpl_id, 1, 'X RPL 1',   'X RPL 1',   'dengan_nomor', 'aktif'),
  (@ta_id, 'XI',  11, @rpl_id, 1, 'XI RPL 1',  'XI RPL 1',  'dengan_nomor', 'aktif'),
  (@ta_id, 'XII', 12, @rpl_id, 1, 'XII RPL 1', 'XII RPL 1', 'dengan_nomor', 'aktif'),
  (@ta_id, 'X',   10, @mm_id,  1, 'X MM 1',    'X MM 1',    'dengan_nomor', 'aktif'),
  (@ta_id, 'XI',  11, @mm_id,  1, 'XI MM 1',   'XI MM 1',   'dengan_nomor', 'aktif'),
  (@ta_id, 'XII', 12, @mm_id,  1, 'XII MM 1',  'XII MM 1',  'dengan_nomor', 'aktif')
ON DUPLICATE KEY UPDATE `label_rombel` = VALUES(`label_rombel`), `status` = VALUES(`status`);

-- 5. DEMO SISWA
SET @rombel_xi_tkj1 = (SELECT `rombel_id` FROM `rombel` WHERE `label_rombel` = 'XI TKJ 1' LIMIT 1);

INSERT INTO `siswa` (`nisn`, `nis`, `nama_lengkap`, `jenis_kelamin`, `status`, `rombel_id_aktif`)
SELECT '0000000001', '2024001', 'Demo Siswa', 'L', 'aktif', @rombel_xi_tkj1
WHERE NOT EXISTS (SELECT 1 FROM `siswa` WHERE `nisn` = '0000000001');

SET @real_siswa_id = (SELECT `siswa_id` FROM `siswa` WHERE `nisn` = '0000000001' LIMIT 1);
UPDATE `users` SET `siswa_id` = @real_siswa_id WHERE `username` = 'siswa' AND `user_type` = 'siswa';

SELECT 'Seed data akademik selesai!' AS status;
