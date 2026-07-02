-- ============================================================
-- MIGRATION: Portal Orang Tua — Token Akses (v2, FIXED)
-- Tabel untuk menyimpan token akses unik per siswa yang digunakan
-- orang tua untuk melihat riwayat kehadiran & e-izin anaknya
-- TANPA perlu login/akun terpisah.
--
-- PERUBAHAN dari v1:
--   RANDOM_BYTES() dalam bulk INSERT...SELECT dieksekusi TIDAK
--   konsisten oleh TiDB (hanya sekali per query, bukan per baris),
--   menyebabkan seluruh siswa mendapat token yang SAMA dan gagal
--   UNIQUE constraint di baris kedua dst.
--
--   Solusi: migration ini HANYA membuat tabel. Token dibuat otomatis
--   secara lazy (satu per satu) oleh AdminOrtuTokenController::get()
--   menggunakan PHP random_bytes() — aman di MySQL maupun TiDB karena
--   dieksekusi sebagai query terpisah per siswa, bukan bulk.
-- ============================================================

USE `sistem_presensi_siswa_qr`;

CREATE TABLE IF NOT EXISTS `ortu_portal_token` (
  `token_id`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `siswa_id`    INT UNSIGNED NOT NULL,
  `token`       VARCHAR(64) NOT NULL COMMENT 'Random token, dikirim via link WhatsApp ke orang tua',
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `last_accessed_at` TIMESTAMP NULL DEFAULT NULL,
  `access_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by_user_id` INT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `uk_ortu_token` (`token`),
  UNIQUE KEY `uk_ortu_siswa` (`siswa_id`),
  KEY `idx_ortu_active` (`is_active`),
  CONSTRAINT `fk_ortu_token_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabel ortu_portal_token siap. Token akan dibuat otomatis per siswa saat admin klik "Kirim WA" pertama kali.' AS status;
