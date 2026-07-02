-- ============================================================
-- MIGRATION FIX: Tambah kolom tingkatan yang terlewat
-- Tanggal: 2026-07-02 (v4)
--
-- Root cause: NilaiController::getMapel() akses $r->tingkatan,
-- tapi kolom ini tidak pernah dibuat di migration v3 karena query
-- backend pakai "SELECT mp.*" (wildcard) sehingga tidak terlihat
-- saat grep mencari referensi eksplisit "mp.tingkatan" di SQL string.
--
-- Dampak: PHP Warning "Undefined property" pada setiap request ke
-- /api/nilai/mapel (tidak fatal, tapi tetap bug yang harus diperbaiki
-- dan berpotensi mengotori log produksi).
-- ============================================================

USE `sistem_presensi_siswa_qr`;

ALTER TABLE `mata_pelajaran`
  ADD COLUMN `tingkatan` ENUM('X','XI','XII','semua') NOT NULL DEFAULT 'semua'
    COMMENT 'Tingkat kelas yang mengambil mapel ini, semua = lintas tingkat'
    AFTER `kelompok`;

SELECT 'Kolom tingkatan berhasil ditambahkan ke mata_pelajaran.' AS status;
