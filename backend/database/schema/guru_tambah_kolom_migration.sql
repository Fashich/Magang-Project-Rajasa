-- ============================================================
-- Migration: Tambah kolom jabatan, mapel, status_kepegawaian,
--            dan foto_profil ke guru_staff + profil_siswa
-- Jalankan di PowerShell:
--   Get-Content backend\database\schema\guru_tambah_kolom_migration.sql |
--     docker-compose exec -T db mysql -u root -proot sistem_presensi_siswa_qr
-- ============================================================

ALTER TABLE `guru_staff`
  ADD COLUMN `jabatan` VARCHAR(100) DEFAULT NULL
    COMMENT 'Guru Mapel / Wali Kelas / Kepala Program / Staff TU / Admin'
    AFTER `email`,
  ADD COLUMN `mapel_pengampu` VARCHAR(255) DEFAULT NULL
    COMMENT 'Mata pelajaran, comma-separated: "Matematika, Fisika"'
    AFTER `jabatan`,
  ADD COLUMN `status_kepegawaian`
    ENUM('PNS','PPPK','GTT','Honorer','Kontrak') DEFAULT NULL
    AFTER `mapel_pengampu`,
  ADD COLUMN `foto_profil` VARCHAR(255) DEFAULT NULL
    COMMENT 'Filename foto, diakses via /server/foto/guru/{filename}'
    AFTER `status_kepegawaian`;

ALTER TABLE `profil_siswa`
  ADD COLUMN `foto_profil` VARCHAR(255) DEFAULT NULL
    COMMENT 'Filename foto, diakses via /server/foto/siswa/{filename}'
    AFTER `email`;
