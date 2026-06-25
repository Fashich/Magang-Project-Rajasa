-- =========================================================
-- MIGRATION: Tabel E-Izin (Portal Pengajuan Izin/Sakit)
-- Target DB: sistem_presensi_siswa_qr
-- Branch: feature/e-izin
-- =========================================================

USE `sistem_presensi_siswa_qr`;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- Tabel utama pengajuan izin/sakit
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS `e_izin` (
  `izin_id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `siswa_id`          INT UNSIGNED NOT NULL,
  `tanggal_mulai`     DATE NOT NULL,
  `tanggal_selesai`   DATE NOT NULL,
  `jenis`             ENUM('sakit','izin','dispensasi') NOT NULL DEFAULT 'izin',
  `alasan`            TEXT NOT NULL,
  `keterangan_tambahan` TEXT DEFAULT NULL,
  `lampiran_url`      VARCHAR(255) DEFAULT NULL COMMENT 'Path file bukti (surat dokter, dll)',

  -- Status approval berjenjang
  `status`            ENUM('pending','disetujui_wali','ditolak_wali','disetujui','ditolak') NOT NULL DEFAULT 'pending',

  -- Approval wali kelas
  `wali_approved_by`  INT UNSIGNED DEFAULT NULL COMMENT 'user_id guru/wali kelas',
  `wali_approved_at`  DATETIME DEFAULT NULL,
  `wali_catatan`      TEXT DEFAULT NULL,

  -- Approval final (admin/BK)
  `final_approved_by` INT UNSIGNED DEFAULT NULL COMMENT 'user_id admin',
  `final_approved_at` DATETIME DEFAULT NULL,
  `final_catatan`     TEXT DEFAULT NULL,

  -- Submitter
  `submitted_by`      INT UNSIGNED DEFAULT NULL COMMENT 'user_id yang submit (siswa/ortu)',
  `submitted_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`izin_id`),
  KEY `idx_eizin_siswa_tanggal`  (`siswa_id`, `tanggal_mulai`),
  KEY `idx_eizin_status`         (`status`, `created_at`),
  KEY `idx_eizin_wali`           (`wali_approved_by`, `status`),
  KEY `idx_eizin_submitted_by`   (`submitted_by`),

  CONSTRAINT `fk_eizin_siswa`
    FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`siswa_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_eizin_wali_by`
    FOREIGN KEY (`wali_approved_by`) REFERENCES `users`(`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_eizin_final_by`
    FOREIGN KEY (`final_approved_by`) REFERENCES `users`(`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_eizin_submitted_by`
    FOREIGN KEY (`submitted_by`) REFERENCES `users`(`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `chk_eizin_tanggal`
    CHECK (`tanggal_selesai` >= `tanggal_mulai`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pengajuan izin/sakit siswa dengan approval berjenjang';
