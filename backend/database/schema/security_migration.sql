-- =========================================================
-- MIGRATION: Phase 6 — Security & Compliance
-- Target DB: sistem_presensi_siswa_qr
-- Branch: feature/prd-6-security
--
-- Perubahan:
--   1. users: tambah totp_secret dan totp_enabled (2FA)
--   2. login_attempts: rate limiting per IP
--   3. two_factor_pending: temp token saat login 2FA
-- =========================================================

USE `sistem_presensi_siswa_qr`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 1. Tambah kolom 2FA ke tabel users
-- ─────────────────────────────────────────────────────────
ALTER TABLE `users`
  ADD COLUMN `totp_secret`  VARCHAR(32)  DEFAULT NULL
    COMMENT 'Secret TOTP base32 (null = 2FA belum di-setup)'
    AFTER `status`,
  ADD COLUMN `totp_enabled` TINYINT(1)   NOT NULL DEFAULT 0
    COMMENT '1 = 2FA aktif, wajib saat login'
    AFTER `totp_secret`;

-- ─────────────────────────────────────────────────────────
-- 2. Tabel rate limiting login per IP
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address`      VARCHAR(45)     NOT NULL,
  `attempts`        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `blocked_until`   DATETIME        DEFAULT NULL
    COMMENT 'NULL = tidak diblokir',
  `last_attempt_at` DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_login_ip` (`ip_address`),
  INDEX `idx_login_blocked` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 3. Tabel temporary token saat proses 2FA login
--    Setelah password benar tapi sebelum TOTP diverifikasi
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `two_factor_pending` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED    NOT NULL,
  `temp_token`  VARCHAR(64)     NOT NULL,
  `expires_at`  DATETIME        NOT NULL
    COMMENT 'Token berlaku 5 menit',
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_2fa_token` (`temp_token`),
  INDEX `idx_2fa_expires` (`expires_at`),
  CONSTRAINT `fk_2fa_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Cleanup: hapus pending tokens kedaluwarsa setiap hari
-- Jalankan manual atau via cron: setiap hari jam 00:00
-- DELETE FROM two_factor_pending WHERE expires_at < NOW();
-- ─────────────────────────────────────────────────────────
