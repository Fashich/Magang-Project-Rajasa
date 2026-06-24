-- ============================================================
-- Migration: feature/gamifikasi
-- Tambahkan 3 tabel: gamifikasi_poin, gamifikasi_badge, gamifikasi_badge_siswa
-- Jalankan setelah prototype-db-3.9.sql
-- ============================================================

-- ── 1. Log poin per siswa ─────────────────────────────────────
CREATE TABLE `gamifikasi_poin` (
  `poin_id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `siswa_id`       INT UNSIGNED    NOT NULL,

  -- Sumber poin
  `tipe`           ENUM(
                     'hadir_tepat_waktu',
                     'hadir_terlambat',
                     'izin_surat',
                     'streak_7',
                     'streak_30',
                     'perfect_month',
                     'submit_logbook',
                     'logbook_approved',
                     'tiket_selesai',
                     'early_bird',
                     'bonus_admin'
                   ) NOT NULL,

  `poin`           SMALLINT        NOT NULL COMMENT 'Nilai positif = dapat poin, negatif = dikurangi',
  `keterangan`     VARCHAR(200)    DEFAULT NULL,
  `related_table`  VARCHAR(80)     DEFAULT NULL,
  `related_id`     BIGINT UNSIGNED DEFAULT NULL,
  `tanggal`        DATE            NOT NULL,

  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`poin_id`),
  KEY `idx_poin_siswa`   (`siswa_id`, `tanggal`),
  KEY `idx_poin_tipe`    (`tipe`, `tanggal`),
  KEY `idx_poin_related` (`related_table`, `related_id`),

  CONSTRAINT `fk_poin_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Log perolehan poin gamifikasi per siswa';


-- ── 2. Master daftar badge ────────────────────────────────────
CREATE TABLE `gamifikasi_badge` (
  `badge_id`       TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode`           VARCHAR(30)      NOT NULL,
  `nama`           VARCHAR(80)      NOT NULL,
  `deskripsi`      VARCHAR(200)     NOT NULL,
  `icon`           VARCHAR(10)      NOT NULL COMMENT 'Emoji icon',
  `warna`          VARCHAR(20)      NOT NULL DEFAULT '#6366f1',
  `kategori`       ENUM('kehadiran','logbook','komunikasi','prestasi','khusus')
                   NOT NULL DEFAULT 'kehadiran',
  -- Kriteria otomatis (dihitung oleh GamifikasiController)
  `kriteria_tipe`  VARCHAR(50)      DEFAULT NULL COMMENT 'hadir_rate|streak|perfect_month|logbook_count|tiket_count|top3|early_bird|konsisten',
  `kriteria_nilai` SMALLINT UNSIGNED DEFAULT NULL COMMENT 'Threshold nilai kriteria',
  `poin_reward`    SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Poin bonus saat badge didapat',
  `is_aktif`       TINYINT(1)       NOT NULL DEFAULT 1,

  PRIMARY KEY (`badge_id`),
  UNIQUE KEY `uk_badge_kode` (`kode`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master daftar badge/achievement';


-- ── 3. Badge yang dimiliki siswa ──────────────────────────────
CREATE TABLE `gamifikasi_badge_siswa` (
  `id`             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `siswa_id`       INT UNSIGNED     NOT NULL,
  `badge_id`       TINYINT UNSIGNED NOT NULL,
  `diraih_at`      DATE             NOT NULL,
  `periode`        VARCHAR(7)       DEFAULT NULL COMMENT 'YYYY-MM untuk badge bulanan',

  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_badge_siswa_periode` (`siswa_id`, `badge_id`, `periode`),
  KEY `idx_badge_siswa` (`siswa_id`, `diraih_at`),

  CONSTRAINT `fk_badge_siswa_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_badge_siswa_badge`
    FOREIGN KEY (`badge_id`) REFERENCES `gamifikasi_badge`(`badge_id`)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Badge yang diraih oleh setiap siswa';


-- ── 4. Seed badge master ──────────────────────────────────────
INSERT INTO `gamifikasi_badge`
  (`kode`, `nama`, `deskripsi`, `icon`, `warna`, `kategori`, `kriteria_tipe`, `kriteria_nilai`, `poin_reward`) VALUES
  ('rajin',          'Rajin',          'Hadir 90%+ dalam sebulan',                   '🌟', '#f59e0b', 'kehadiran',  'hadir_rate',    90,  50),
  ('streak_7',       'Streak 7',       '7 hari hadir berturut-turut',                '🔥', '#ef4444', 'kehadiran',  'streak',         7,  50),
  ('streak_30',      'Streak 30',      '30 hari hadir berturut-turut',               '💎', '#8b5cf6', 'kehadiran',  'streak',        30, 200),
  ('perfect_month',  'Perfect Month',  'Tidak ada alpha dalam sebulan penuh',        '🏆', '#10b981', 'kehadiran',  'perfect_month',  1, 100),
  ('logbook_aktif',  'Logbook Aktif',  '10+ entri logbook PKL disetujui',            '📒', '#0284c7', 'logbook',    'logbook_count', 10,  30),
  ('komunikatif',    'Komunikatif',    '5+ tiket komunikasi diselesaikan',            '💬', '#06b6d4', 'komunikasi', 'tiket_count',    5,  25),
  ('early_bird',     'Early Bird',     '10× hadir sebelum jam pelajaran pertama',    '⚡', '#f97316', 'kehadiran',  'early_bird',    10,  40),
  ('konsisten',      'Konsisten',      '3 bulan berturut hadir 85%+',               '🎯', '#6366f1', 'prestasi',   'konsisten',      3,  150),
  ('top_3',          'Top 3',          'Masuk leaderboard top 3 di rombel',         '🚀', '#dc2626', 'prestasi',   'top3',           3,  75);
