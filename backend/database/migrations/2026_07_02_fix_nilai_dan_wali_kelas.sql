-- ============================================================
-- MIGRATION FIX: Analitik Prestasi + Logbook Review
-- Tanggal: 2026-07-02
--
-- Memperbaiki 2 root cause bug yang dilaporkan tim:
--
-- BUG A — "Belum bisa input nilai, mapel/rombel/tahun ajaran kosong"
--   Root cause: tabel `mata_pelajaran` dan `nilai_akademik` TIDAK PERNAH
--   dibuat di schema database, padahal NilaiController dan
--   AnalitikPrestasiController sudah lengkap kodenya dan menunggu tabel ini.
--
-- BUG B — "Guru tidak bisa validasi/kembalikan logbook siswa"
--   Root cause: logbook_praktik.guru_id di-assign otomatis dari
--   rombel_wali_kelas (wali kelas rombel siswa). Rombel yang dibuat di
--   seed sebelumnya (2026-07-01) tidak pernah diisi wali kelasnya,
--   sehingga guru_id logbook selalu NULL dan tidak ada guru yang
--   "memiliki" logbook tersebut untuk direview.
-- ============================================================

USE `sistem_presensi_siswa_qr`;

-- ────────────────────────────────────────────────────────────
-- BAGIAN A.1 — Tabel mata_pelajaran
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `mata_pelajaran` (
  `mapel_id`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_mapel`  VARCHAR(20)  NOT NULL,
  `nama_mapel`  VARCHAR(120) NOT NULL,
  `kelompok`    ENUM('umum','kejuruan','muatan_lokal') NOT NULL DEFAULT 'umum',
  `jurusan_id`  INT UNSIGNED DEFAULT NULL COMMENT 'NULL = mapel umum untuk semua jurusan',
  `kkm`         TINYINT UNSIGNED NOT NULL DEFAULT 75,
  `status`      ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`mapel_id`),
  UNIQUE KEY `uk_mapel_kode` (`kode_mapel`),
  KEY `idx_mapel_jurusan` (`jurusan_id`),
  KEY `idx_mapel_status` (`status`),
  CONSTRAINT `fk_mapel_jurusan`
    FOREIGN KEY (`jurusan_id`) REFERENCES `jurusan`(`jurusan_id`)
    ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- BAGIAN A.2 — Tabel nilai_akademik
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `nilai_akademik` (
  `nilai_id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `siswa_id`         INT UNSIGNED NOT NULL,
  `mapel_id`         INT UNSIGNED NOT NULL,
  `tahun_ajaran_id`  INT UNSIGNED NOT NULL,
  `semester`         ENUM('ganjil','genap','pendek') NOT NULL DEFAULT 'ganjil',
  `rombel_id`        INT UNSIGNED DEFAULT NULL,
  `nilai_harian`     DECIMAL(5,2) DEFAULT NULL,
  `nilai_uts`        DECIMAL(5,2) DEFAULT NULL,
  `nilai_uas`        DECIMAL(5,2) DEFAULT NULL,
  `nilai_akhir`      DECIMAL(5,2) DEFAULT NULL,
  `predikat`         VARCHAR(2) DEFAULT NULL,
  `catatan`          TEXT DEFAULT NULL,
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`nilai_id`),
  UNIQUE KEY `uk_nilai_kombinasi` (`siswa_id`, `mapel_id`, `tahun_ajaran_id`, `semester`),
  KEY `idx_nilai_rombel` (`rombel_id`),
  KEY `idx_nilai_mapel` (`mapel_id`),
  KEY `idx_nilai_tahun_semester` (`tahun_ajaran_id`, `semester`),
  CONSTRAINT `fk_nilai_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_nilai_mapel`
    FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`mapel_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_nilai_tahun_ajaran`
    FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`tahun_ajaran_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_nilai_rombel`
    FOREIGN KEY (`rombel_id`) REFERENCES `rombel`(`rombel_id`)
    ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- BAGIAN A.3 — Seed data mata pelajaran dasar
-- ────────────────────────────────────────────────────────────

INSERT INTO `mata_pelajaran` (`kode_mapel`, `nama_mapel`, `kelompok`, `jurusan_id`, `kkm`, `status`) VALUES
  ('MTK',    'Matematika',                   'umum', NULL, 75, 'aktif'),
  ('BIND',   'Bahasa Indonesia',             'umum', NULL, 75, 'aktif'),
  ('BING',   'Bahasa Inggris',               'umum', NULL, 75, 'aktif'),
  ('PKN',    'Pendidikan Kewarganegaraan',   'umum', NULL, 75, 'aktif'),
  ('PJOK',   'Pendidikan Jasmani',           'umum', NULL, 75, 'aktif'),
  ('IPAS',   'IPA dan IPS Terapan',          'umum', NULL, 75, 'aktif'),
  ('PROD-TKJ', 'Produktif TKJ',              'kejuruan', (SELECT jurusan_id FROM `jurusan` WHERE kode_jurusan='TKJ' LIMIT 1), 78, 'aktif'),
  ('PROD-RPL', 'Produktif RPL',              'kejuruan', (SELECT jurusan_id FROM `jurusan` WHERE kode_jurusan='RPL' LIMIT 1), 78, 'aktif'),
  ('PROD-MM',  'Produktif Multimedia',       'kejuruan', (SELECT jurusan_id FROM `jurusan` WHERE kode_jurusan='MM'  LIMIT 1), 78, 'aktif'),
  ('PKWU',   'Produk Kreatif & Kewirausahaan','kejuruan', NULL, 75, 'aktif')
ON DUPLICATE KEY UPDATE `nama_mapel` = VALUES(`nama_mapel`);

-- ────────────────────────────────────────────────────────────
-- BAGIAN B — Fix wali kelas kosong (root cause bug logbook)
-- Assign guru demo sebagai wali kelas untuk SEMUA rombel yang
-- belum punya wali kelas aktif, supaya logbook siswa punya
-- guru_id yang valid dan bisa direview.
-- ────────────────────────────────────────────────────────────

SET @guru_demo_id = (SELECT `guru_id` FROM `guru_staff` WHERE `nip` = 'GURU001' LIMIT 1);

INSERT INTO `rombel_wali_kelas` (`rombel_id`, `guru_id`, `status`, `tanggal_mulai`)
SELECT r.`rombel_id`, @guru_demo_id, 'aktif', CURDATE()
FROM `rombel` r
WHERE r.`status` = 'aktif'
  AND NOT EXISTS (
    SELECT 1 FROM `rombel_wali_kelas` rwk
    WHERE rwk.`rombel_id` = r.`rombel_id` AND rwk.`status` = 'aktif'
  );

-- ────────────────────────────────────────────────────────────
-- BAGIAN C — Perbaiki logbook lama yang sudah terlanjur guru_id NULL
-- (jika sudah ada entri logbook dari testing sebelumnya)
-- ────────────────────────────────────────────────────────────

UPDATE `logbook_praktik` lb
JOIN `siswa` s ON s.`siswa_id` = lb.`siswa_id`
JOIN `rombel_wali_kelas` rwk ON rwk.`rombel_id` = s.`rombel_id_aktif` AND rwk.`status` = 'aktif'
SET lb.`guru_id` = rwk.`guru_id`
WHERE lb.`guru_id` IS NULL;

SELECT 'Migration selesai: mata_pelajaran, nilai_akademik dibuat, wali_kelas di-assign, logbook lama diperbaiki.' AS status;
