-- ============================================================
-- Migration: feature/analitik-prestasi
-- Tambahkan 2 tabel: mata_pelajaran + nilai_akademik
-- Jalankan setelah prototype-db-3.9.sql
-- ============================================================

-- ── 1. Tabel mata pelajaran ──────────────────────────────────
CREATE TABLE `mata_pelajaran` (
  `mapel_id`     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `kode_mapel`   VARCHAR(20)   NOT NULL,
  `nama_mapel`   VARCHAR(100)  NOT NULL,
  `jurusan_id`   INT UNSIGNED  DEFAULT NULL  COMMENT 'NULL = semua jurusan',
  `tingkatan`    ENUM('X','XI','XII','XIII','semua') NOT NULL DEFAULT 'semua',
  `kelompok`     ENUM('normatif','adaptif','produktif','muatan_lokal','pengembangan_diri')
                 NOT NULL DEFAULT 'adaptif',
  `kkm`          TINYINT UNSIGNED NOT NULL DEFAULT 75,
  `status`       ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`mapel_id`),
  UNIQUE KEY `uk_kode_mapel` (`kode_mapel`),
  KEY `idx_mapel_jurusan`   (`jurusan_id`, `status`),
  KEY `idx_mapel_tingkatan` (`tingkatan`, `status`),

  CONSTRAINT `fk_mapel_jurusan`
    FOREIGN KEY (`jurusan_id`) REFERENCES `jurusan`(`jurusan_id`)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Daftar mata pelajaran untuk penilaian akademik';


-- ── 2. Tabel nilai akademik per siswa per semester ───────────
CREATE TABLE `nilai_akademik` (
  `nilai_id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Relasi utama
  `siswa_id`         INT UNSIGNED    NOT NULL,
  `mapel_id`         INT UNSIGNED    NOT NULL,
  `tahun_ajaran_id`  INT UNSIGNED    NOT NULL,
  `semester`         ENUM('ganjil','genap','pendek') NOT NULL DEFAULT 'ganjil',
  `rombel_id`        INT UNSIGNED    DEFAULT NULL,

  -- Komponen nilai
  `nilai_harian`     DECIMAL(5,2)    DEFAULT NULL COMMENT 'Rata-rata nilai harian/tugas',
  `nilai_uts`        DECIMAL(5,2)    DEFAULT NULL COMMENT 'Nilai Ujian Tengah Semester',
  `nilai_uas`        DECIMAL(5,2)    DEFAULT NULL COMMENT 'Nilai Ujian Akhir Semester',
  `nilai_akhir`      DECIMAL(5,2)    DEFAULT NULL COMMENT 'Nilai akhir (dihitung otomatis jika NULL)',
  `predikat`         ENUM('A','B','C','D','E') DEFAULT NULL,

  -- Metadata
  `input_by`         INT UNSIGNED    DEFAULT NULL COMMENT 'user_id guru yang input',
  `catatan`          TEXT            DEFAULT NULL,

  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`nilai_id`),
  UNIQUE KEY `uk_nilai_siswa_mapel_semester`
    (`siswa_id`, `mapel_id`, `tahun_ajaran_id`, `semester`),

  KEY `idx_nilai_siswa`       (`siswa_id`, `tahun_ajaran_id`, `semester`),
  KEY `idx_nilai_mapel`       (`mapel_id`, `tahun_ajaran_id`),
  KEY `idx_nilai_rombel`      (`rombel_id`, `tahun_ajaran_id`, `semester`),
  KEY `idx_nilai_akhir`       (`nilai_akhir`),

  CONSTRAINT `fk_nilai_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_nilai_mapel`
    FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`mapel_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_nilai_tahun_ajaran`
    FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`tahun_ajaran_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_nilai_rombel`
    FOREIGN KEY (`rombel_id`) REFERENCES `rombel`(`rombel_id`)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nilai akademik siswa per mata pelajaran per semester';


-- ── 3. Seed mata pelajaran dasar ─────────────────────────────
INSERT INTO `mata_pelajaran`
  (`kode_mapel`, `nama_mapel`, `tingkatan`, `kelompok`, `kkm`) VALUES
  ('MTK',   'Matematika',                        'semua', 'adaptif',    75),
  ('BIN',   'Bahasa Indonesia',                  'semua', 'normatif',   75),
  ('BING',  'Bahasa Inggris',                    'semua', 'adaptif',    75),
  ('PKN',   'Pendidikan Kewarganegaraan',        'semua', 'normatif',   75),
  ('AGAMA', 'Pendidikan Agama',                  'semua', 'normatif',   75),
  ('PJOK',  'Penjasorkes',                       'semua', 'normatif',   75),
  ('FISIKA','Fisika',                             'X',    'adaptif',    75),
  ('KIM',   'Kimia',                             'X',    'adaptif',    75),
  ('PROD',  'Kompetensi Kejuruan',               'semua', 'produktif',  75),
  ('PKK',   'Produk Kreatif dan Kewirausahaan',  'XI',   'produktif',  75);
