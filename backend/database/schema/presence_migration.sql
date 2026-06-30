-- ============================================================
-- Migration: Tambah kolom presence tracking (online/idle/offline)
-- Jalankan di PowerShell:
--   Get-Content backend\database\schema\presence_migration.sql |
--     docker-compose exec -T db mysql -u root -proot sistem_presensi_siswa_qr
-- ============================================================

ALTER TABLE `users`
  ADD COLUMN `last_heartbeat_at` DATETIME DEFAULT NULL
    COMMENT 'Timestamp heartbeat terakhir dari client (untuk deteksi online/idle/offline)'
    AFTER `last_login_at`,
  ADD COLUMN `presence_state` ENUM('online','idle') DEFAULT NULL
    COMMENT 'Status terakhir yang dilaporkan client. "offline" tidak disimpan — selalu diturunkan dari staleness last_heartbeat_at.'
    AFTER `last_heartbeat_at`;
