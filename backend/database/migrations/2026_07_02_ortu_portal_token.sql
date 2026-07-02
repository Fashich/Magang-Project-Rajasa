-- ============================================================
-- MIGRATION: Portal Orang Tua — Token Akses
-- Tabel untuk menyimpan token akses unik per siswa yang digunakan
-- orang tua untuk melihat riwayat kehadiran & e-izin anaknya
-- TANPA perlu login/akun terpisah.
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

-- Generate token untuk semua siswa aktif yang belum punya token
-- (Jalankan sekali setelah tabel dibuat)
INSERT INTO `ortu_portal_token` (`siswa_id`, `token`)
SELECT
  s.`siswa_id`,
  LOWER(CONCAT(
    HEX(RANDOM_BYTES(8)), '-',
    HEX(RANDOM_BYTES(4)), '-',
    HEX(RANDOM_BYTES(4)), '-',
    HEX(RANDOM_BYTES(4)), '-',
    HEX(RANDOM_BYTES(8))
  ))
FROM `siswa` s
WHERE s.`status` = 'aktif'
  AND NOT EXISTS (
    SELECT 1 FROM `ortu_portal_token` t WHERE t.`siswa_id` = s.`siswa_id`
  );

SELECT CONCAT('Portal ortu token dibuat untuk ', ROW_COUNT(), ' siswa.') AS status;
