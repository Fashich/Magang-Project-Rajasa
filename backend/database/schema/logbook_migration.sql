-- ============================================================
-- Migration: feature/logbook-praktik
-- Tambahkan 2 tabel: logbook_praktik + logbook_penilaian
-- Jalankan di MySQL setelah prototype-db-3.9.sql
-- ============================================================

-- ── 1. Tabel utama entri logbook (diisi siswa) ──────────────
CREATE TABLE `logbook_praktik` (
  `logbook_id`       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Relasi
  `siswa_id`         INT UNSIGNED    NOT NULL,
  `guru_id`          INT UNSIGNED    DEFAULT NULL  COMMENT 'Guru pembimbing yang di-assign',

  -- Konten entri
  `tanggal`          DATE            NOT NULL,
  `jam_mulai`        TIME            DEFAULT NULL,
  `jam_selesai`      TIME            DEFAULT NULL,
  `lokasi`           VARCHAR(200)    DEFAULT NULL,
  `deskripsi`        TEXT            NOT NULL,
  `foto_path`        VARCHAR(500)    DEFAULT NULL  COMMENT 'Path relatif file foto di server',

  -- Status approval
  `status`           ENUM('draft','menunggu_review','disetujui','ditolak') NOT NULL DEFAULT 'draft',

  -- Review oleh guru
  `reviewed_by`      INT UNSIGNED    DEFAULT NULL  COMMENT 'user_id guru yang mereview',
  `reviewed_at`      DATETIME        DEFAULT NULL,
  `catatan_guru`     TEXT            DEFAULT NULL  COMMENT 'Saran/masukan dari guru per entri',

  `created_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`logbook_id`),

  -- Satu siswa tidak bisa punya 2 entri di hari & lokasi yang sama
  UNIQUE KEY `uk_logbook_siswa_tanggal` (`siswa_id`, `tanggal`),

  KEY `idx_logbook_siswa`  (`siswa_id`, `tanggal`),
  KEY `idx_logbook_guru`   (`guru_id`, `status`),
  KEY `idx_logbook_status` (`status`),

  CONSTRAINT `fk_logbook_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_logbook_guru`
    FOREIGN KEY (`guru_id`) REFERENCES `guru_staff`(`guru_id`)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Logbook harian PKL siswa dengan approval guru pembimbing';


-- ── 2. Tabel penilaian keseluruhan logbook per siswa ─────────
CREATE TABLE `logbook_penilaian` (
  `penilaian_id`     INT UNSIGNED    NOT NULL AUTO_INCREMENT,

  `siswa_id`         INT UNSIGNED    NOT NULL,
  `guru_id`          INT UNSIGNED    NOT NULL  COMMENT 'Guru yang memberi penilaian',
  `dinilai_by`       INT UNSIGNED    NOT NULL  COMMENT 'user_id guru',

  -- Komponen nilai (0–100)
  `nilai_kedisiplinan`  TINYINT UNSIGNED DEFAULT NULL,
  `nilai_keterampilan`  TINYINT UNSIGNED DEFAULT NULL,
  `nilai_sikap`         TINYINT UNSIGNED DEFAULT NULL,
  `nilai_laporan`       TINYINT UNSIGNED DEFAULT NULL,

  -- Nilai akhir dihitung: avg dari 4 komponen
  `nilai_akhir`      DECIMAL(5,2)    DEFAULT NULL,

  `predikat`         ENUM('A','B','C','D') DEFAULT NULL
                     COMMENT 'A>=90, B>=75, C>=60, D<60',

  `catatan_akhir`    TEXT            DEFAULT NULL  COMMENT 'Catatan/rekomendasi akhir guru',

  `dinilai_at`       DATETIME        DEFAULT NULL,
  `created_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`penilaian_id`),
  UNIQUE KEY `uk_penilaian_siswa_guru` (`siswa_id`, `guru_id`),

  KEY `idx_penilaian_guru` (`guru_id`),

  CONSTRAINT `fk_penilaian_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_penilaian_guru`
    FOREIGN KEY (`guru_id`) REFERENCES `guru_staff`(`guru_id`)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Penilaian akhir keseluruhan logbook PKL oleh guru pembimbing';
