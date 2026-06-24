-- ============================================================
-- Migration: feature/communication-hub
-- Tambahkan 2 tabel: tiket + tiket_balasan
-- Jalankan setelah prototype-db-3.9.sql
-- ============================================================

-- ── 1. Tabel tiket utama ─────────────────────────────────────
CREATE TABLE `tiket` (
  `tiket_id`       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Pengirim (bisa siswa atau guru)
  `dari_user_id`   INT UNSIGNED    NOT NULL,

  -- Penerima awal (opsional — bisa ke guru tertentu atau broadcast ke admin)
  `kepada_user_id` INT UNSIGNED    DEFAULT NULL,

  -- Klasifikasi
  `kategori`       ENUM(
                     'pertanyaan',
                     'keluhan',
                     'izin_khusus',
                     'konsultasi',
                     'laporan_masalah',
                     'lainnya'
                   ) NOT NULL DEFAULT 'pertanyaan',

  `prioritas`      ENUM('rendah','normal','tinggi','urgent')
                   NOT NULL DEFAULT 'normal',

  -- Konten
  `judul`          VARCHAR(200)    NOT NULL,
  `pesan`          TEXT            NOT NULL,

  -- Status alur
  `status`         ENUM('open','in_progress','waiting','resolved','closed')
                   NOT NULL DEFAULT 'open',

  -- Metadata
  `ditutup_by`     INT UNSIGNED    DEFAULT NULL,
  `ditutup_at`     DATETIME        DEFAULT NULL,
  `last_reply_at`  DATETIME        DEFAULT NULL,
  `reply_count`    SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`tiket_id`),

  KEY `idx_tiket_dari`     (`dari_user_id`, `status`, `created_at`),
  KEY `idx_tiket_kepada`   (`kepada_user_id`, `status`),
  KEY `idx_tiket_status`   (`status`, `prioritas`, `last_reply_at`),
  KEY `idx_tiket_kategori` (`kategori`, `status`),

  CONSTRAINT `fk_tiket_dari`
    FOREIGN KEY (`dari_user_id`) REFERENCES `users`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_tiket_kepada`
    FOREIGN KEY (`kepada_user_id`) REFERENCES `users`(`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tiket komunikasi siswa-guru-admin';


-- ── 2. Tabel balasan tiket ────────────────────────────────────
CREATE TABLE `tiket_balasan` (
  `balasan_id`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tiket_id`      BIGINT UNSIGNED NOT NULL,
  `dari_user_id`  INT UNSIGNED    NOT NULL,
  `pesan`         TEXT            NOT NULL,
  `is_internal`   TINYINT(1)      NOT NULL DEFAULT 0
                  COMMENT 'Catatan internal admin/guru — tidak terlihat siswa',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`balasan_id`),

  KEY `idx_balasan_tiket`  (`tiket_id`, `created_at`),
  KEY `idx_balasan_pengirim` (`dari_user_id`),

  CONSTRAINT `fk_balasan_tiket`
    FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`tiket_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_balasan_dari`
    FOREIGN KEY (`dari_user_id`) REFERENCES `users`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Balasan/percakapan dalam tiket';
