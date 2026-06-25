-- =========================================================
-- MIGRATION: Phase 2 — E-Izin Ortu Approval
-- Target DB: sistem_presensi_siswa_qr
-- Branch: feature/prd-2-eizin-ortu
--
-- Perubahan:
--   1. Tambah linked_siswa_id ke tabel users (untuk role ortu)
--   2. Tambah status 'menunggu_ortu' ke e_izin.status ENUM
--   3. Tambah kolom ortu_status, ortu_approved_at, ortu_catatan
--   4. Update existing records agar tidak rusak
-- =========================================================

USE `sistem_presensi_siswa_qr`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 1. Tambah linked_siswa_id ke users
--    Admin wajib mengisi ini untuk user bertipe 'ortu'
--    agar sistem tahu siswa mana yang mereka pantau
-- ─────────────────────────────────────────────────────────
ALTER TABLE `users`
  ADD COLUMN `linked_siswa_id` INT UNSIGNED DEFAULT NULL
    COMMENT 'Khusus role ortu: siswa_id anak yang terhubung ke akun ini'
    AFTER `guru_id`,
  ADD INDEX `idx_users_linked_siswa` (`linked_siswa_id`),
  ADD CONSTRAINT `fk_users_linked_siswa`
    FOREIGN KEY (`linked_siswa_id`)
    REFERENCES `siswa` (`siswa_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────
-- 2. Update ENUM status e_izin — tambah 'menunggu_ortu'
--    Urutan approval baru:
--    menunggu_ortu → pending → disetujui_wali → disetujui
-- ─────────────────────────────────────────────────────────
ALTER TABLE `e_izin`
  MODIFY COLUMN `status` ENUM(
    'menunggu_ortu',
    'pending',
    'disetujui_wali',
    'ditolak_wali',
    'disetujui',
    'ditolak'
  ) NOT NULL DEFAULT 'menunggu_ortu'
  COMMENT 'menunggu_ortu: baru diajukan siswa, menunggu ortu';

-- ─────────────────────────────────────────────────────────
-- 3. Tambah kolom ortu approval
-- ─────────────────────────────────────────────────────────
ALTER TABLE `e_izin`
  ADD COLUMN `ortu_status` ENUM('pending','approved','rejected')
    NOT NULL DEFAULT 'pending'
    COMMENT 'Status persetujuan orang tua'
    AFTER `status`,
  ADD COLUMN `ortu_approved_at` DATETIME DEFAULT NULL
    COMMENT 'Waktu orang tua memberikan keputusan'
    AFTER `ortu_status`,
  ADD COLUMN `ortu_catatan` TEXT DEFAULT NULL
    COMMENT 'Catatan/alasan dari orang tua'
    AFTER `ortu_approved_at`;

-- ─────────────────────────────────────────────────────────
-- 4. Update existing records agar tidak break
--    Record yang sudah ada (pending dst) dianggap
--    sudah melewati tahap ortu → ortu_status = 'approved'
-- ─────────────────────────────────────────────────────────
UPDATE `e_izin`
SET `ortu_status` = 'approved'
WHERE `status` IN ('pending', 'disetujui_wali', 'ditolak_wali', 'disetujui', 'ditolak');

-- ─────────────────────────────────────────────────────────
-- 5. Index tambahan untuk performa query ortu
-- ─────────────────────────────────────────────────────────
ALTER TABLE `e_izin`
  ADD INDEX `idx_eizin_ortu_status` (`ortu_status`, `siswa_id`);

-- ─────────────────────────────────────────────────────────
-- Verifikasi (jalankan manual jika ingin cek)
-- ─────────────────────────────────────────────────────────
-- DESCRIBE e_izin;
-- DESCRIBE users;
-- SELECT COUNT(*) FROM e_izin WHERE ortu_status = 'approved'; -- harus sama dengan jumlah record lama
