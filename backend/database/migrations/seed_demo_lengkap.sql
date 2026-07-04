-- ============================================================
-- SEED DATA DEMO LENGKAP - SMKS RAJASA SURABAYA
-- Untuk dokumentasi & presentasi (data terlihat rame)
-- Jalankan SETELAH seed_data_akademik.sql dan seed_akun_demo_mvp_presensi_qr.sql
-- ============================================================

USE `sistem_presensi_siswa_qr`;

-- ============================================================
-- VARIABEL REFERENSI
-- ============================================================
SET @ta_id     = (SELECT tahun_ajaran_id FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1);
SET @semester  = (SELECT semester_aktif FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1);

SET @r_xi_tkj1 = (SELECT rombel_id FROM rombel WHERE label_rombel = 'XI TKJ 1' LIMIT 1);
SET @r_xi_tkj2 = (SELECT rombel_id FROM rombel WHERE label_rombel = 'XI TKJ 2' LIMIT 1);
SET @r_xi_rpl1 = (SELECT rombel_id FROM rombel WHERE label_rombel = 'XI RPL 1' LIMIT 1);
SET @r_x_tkj1  = (SELECT rombel_id FROM rombel WHERE label_rombel = 'X TKJ 1'  LIMIT 1);
SET @r_xii_tkj1= (SELECT rombel_id FROM rombel WHERE label_rombel = 'XII TKJ 1' LIMIT 1);

SET @guru_id   = (SELECT guru_id FROM guru_staff WHERE nip = 'GURU001' LIMIT 1);
SET @guru_uid  = (SELECT user_id FROM users WHERE username = 'guru' LIMIT 1);
SET @admin_uid = (SELECT user_id FROM users WHERE username = 'admin' LIMIT 1);
SET @siswa_uid = (SELECT user_id FROM users WHERE username = 'siswa' LIMIT 1);
SET @siswa_id  = (SELECT siswa_id FROM users WHERE username = 'siswa' LIMIT 1);

-- ============================================================
-- 1. TAMBAH SISWA DEMO (30 siswa realistis)
-- ============================================================

-- Siswa XI TKJ 1 (10 siswa)
INSERT IGNORE INTO `siswa` (nisn, nis, nama_lengkap, jenis_kelamin, status, rombel_id_aktif) VALUES
('3210001001','2025001','Ahmad Fauzan Hidayat',        'L','aktif',@r_xi_tkj1),
('3210001002','2025002','Budi Santoso Pratama',         'L','aktif',@r_xi_tkj1),
('3210001003','2025003','Cindy Aulia Rahmawati',        'P','aktif',@r_xi_tkj1),
('3210001004','2025004','Deni Firmansyah',              'L','aktif',@r_xi_tkj1),
('3210001005','2025005','Eka Putri Lestari',            'P','aktif',@r_xi_tkj1),
('3210001006','2025006','Farid Alamsyah Nugraha',       'L','aktif',@r_xi_tkj1),
('3210001007','2025007','Gilang Ramadan Kusuma',        'L','aktif',@r_xi_tkj1),
('3210001008','2025008','Hana Safitri Dewi',            'P','aktif',@r_xi_tkj1),
('3210001009','2025009','Ilham Wahyu Saputra',          'L','aktif',@r_xi_tkj1),
('3210001010','2025010','Jessica Amelia Putri',         'P','aktif',@r_xi_tkj1);

-- Siswa XI TKJ 2 (8 siswa)
INSERT IGNORE INTO `siswa` (nisn, nis, nama_lengkap, jenis_kelamin, status, rombel_id_aktif) VALUES
('3210002001','2025011','Kartika Sari Ningrum',         'P','aktif',@r_xi_tkj2),
('3210002002','2025012','Lutfi Hakim Pratama',          'L','aktif',@r_xi_tkj2),
('3210002003','2025013','Mega Fitriani Susanto',        'P','aktif',@r_xi_tkj2),
('3210002004','2025014','Nanda Rizki Maulana',          'L','aktif',@r_xi_tkj2),
('3210002005','2025015','Okta Dwi Cahyani',             'P','aktif',@r_xi_tkj2),
('3210002006','2025016','Putra Setia Budi',             'L','aktif',@r_xi_tkj2),
('3210002007','2025017','Qori Nur Hidayah',             'P','aktif',@r_xi_tkj2),
('3210002008','2025018','Rendi Setiawan',               'L','aktif',@r_xi_tkj2);

-- Siswa XI RPL 1 (7 siswa)
INSERT IGNORE INTO `siswa` (nisn, nis, nama_lengkap, jenis_kelamin, status, rombel_id_aktif) VALUES
('3210003001','2025019','Sari Indah Permata',           'P','aktif',@r_xi_rpl1),
('3210003002','2025020','Taufiq Hidayatullah',          'L','aktif',@r_xi_rpl1),
('3210003003','2025021','Ulfa Rahmadani',               'P','aktif',@r_xi_rpl1),
('3210003004','2025022','Vicky Pratama Putra',          'L','aktif',@r_xi_rpl1),
('3210003005','2025023','Wulan Dari Safitri',           'P','aktif',@r_xi_rpl1),
('3210003006','2025024','Yogi Setiabudi Nugroho',       'L','aktif',@r_xi_rpl1),
('3210003007','2025025','Zahra Fitria Nisa',            'P','aktif',@r_xi_rpl1);

-- Link user demo 'siswa' ke siswa pertama
UPDATE `users` SET siswa_id = (SELECT siswa_id FROM siswa WHERE nis='2025001' LIMIT 1)
WHERE username = 'siswa' AND user_type = 'siswa';

-- Simpan referensi siswa-siswa
SET @s1  = (SELECT siswa_id FROM siswa WHERE nis='2025001' LIMIT 1);
SET @s2  = (SELECT siswa_id FROM siswa WHERE nis='2025002' LIMIT 1);
SET @s3  = (SELECT siswa_id FROM siswa WHERE nis='2025003' LIMIT 1);
SET @s4  = (SELECT siswa_id FROM siswa WHERE nis='2025004' LIMIT 1);
SET @s5  = (SELECT siswa_id FROM siswa WHERE nis='2025005' LIMIT 1);
SET @s6  = (SELECT siswa_id FROM siswa WHERE nis='2025006' LIMIT 1);
SET @s7  = (SELECT siswa_id FROM siswa WHERE nis='2025007' LIMIT 1);
SET @s8  = (SELECT siswa_id FROM siswa WHERE nis='2025008' LIMIT 1);
SET @s9  = (SELECT siswa_id FROM siswa WHERE nis='2025009' LIMIT 1);
SET @s10 = (SELECT siswa_id FROM siswa WHERE nis='2025010' LIMIT 1);
SET @s11 = (SELECT siswa_id FROM siswa WHERE nis='2025011' LIMIT 1);
SET @s12 = (SELECT siswa_id FROM siswa WHERE nis='2025012' LIMIT 1);
SET @s13 = (SELECT siswa_id FROM siswa WHERE nis='2025013' LIMIT 1);
SET @s19 = (SELECT siswa_id FROM siswa WHERE nis='2025019' LIMIT 1);
SET @s20 = (SELECT siswa_id FROM siswa WHERE nis='2025020' LIMIT 1);

-- ============================================================
-- 2. SESI PRESENSI (5 sesi historis + 1 sedang berjalan)
-- ============================================================
INSERT IGNORE INTO `presensi_sesi`
(session_uuid, mode_presensi, rombel_id, tahun_ajaran_id, semester, tanggal,
 status, ruang_pilihan, ruang_label_snapshot, opened_by_user_id,
 started_at, ended_at) VALUES
-- Sesi selesai hari-hari lalu
('uuid-sesi-001','rombel',@r_xi_tkj1,@ta_id,@semester,'2026-06-23',
 'selesai','lab-tkj-1','Lab TKJ 1',@guru_uid,
 '2026-06-23 07:05:00','2026-06-23 09:00:00'),
('uuid-sesi-002','rombel',@r_xi_tkj2,@ta_id,@semester,'2026-06-24',
 'selesai','lab-tkj-2','Lab TKJ 2',@guru_uid,
 '2026-06-24 07:03:00','2026-06-24 09:00:00'),
('uuid-sesi-003','rombel',@r_xi_rpl1,@ta_id,@semester,'2026-06-25',
 'selesai','lab-tkj-1','Lab TKJ 1',@guru_uid,
 '2026-06-25 07:08:00','2026-06-25 09:00:00'),
('uuid-sesi-004','rombel',@r_xi_tkj1,@ta_id,@semester,'2026-06-30',
 'selesai','lab-tkj-3','Lab TKJ 3',@guru_uid,
 '2026-06-30 07:02:00','2026-06-30 09:00:00'),
('uuid-sesi-005','piket',NULL,@ta_id,@semester,'2026-07-01',
 'selesai','piket','Piket',@guru_uid,
 '2026-07-01 07:00:00','2026-07-01 08:00:00'),
-- Sesi hari ini (sedang berjalan)
('uuid-sesi-006','rombel',@r_xi_tkj1,@ta_id,@semester,CURDATE(),
 'aktif','lab-tkj-1','Lab TKJ 1',@guru_uid,
 NOW()- INTERVAL 30 MINUTE, NULL);

-- ============================================================
-- 3. PRESENSI SISWA (data kehadiran 4 minggu)
-- ============================================================
SET @sesi1 = (SELECT presensi_sesi_id FROM presensi_sesi WHERE session_uuid='uuid-sesi-001' LIMIT 1);
SET @sesi2 = (SELECT presensi_sesi_id FROM presensi_sesi WHERE session_uuid='uuid-sesi-002' LIMIT 1);
SET @sesi3 = (SELECT presensi_sesi_id FROM presensi_sesi WHERE session_uuid='uuid-sesi-003' LIMIT 1);
SET @sesi4 = (SELECT presensi_sesi_id FROM presensi_sesi WHERE session_uuid='uuid-sesi-004' LIMIT 1);

-- Presensi 2026-06-23 (XI TKJ 1) — campuran status
INSERT IGNORE INTO `presensi_jam_siswa`
(tanggal, siswa_id, rombel_id_snapshot, tahun_ajaran_id_snapshot, semester_snapshot,
 jam_id, status, mode_presensi, presensi_sesi_id, scanned_at) VALUES
('2026-06-23',@s1, @r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:08:12'),
('2026-06-23',@s2, @r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:06:45'),
('2026-06-23',@s3, @r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:11:23'),
('2026-06-23',@s4, @r_xi_tkj1,@ta_id,@semester,1,'terlambat','rombel',@sesi1,'2026-06-23 07:18:44'),
('2026-06-23',@s5, @r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:09:01'),
('2026-06-23',@s6, @r_xi_tkj1,@ta_id,@semester,1,'alpha',   'rombel',@sesi1,NULL),
('2026-06-23',@s7, @r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:07:33'),
('2026-06-23',@s8, @r_xi_tkj1,@ta_id,@semester,1,'sakit',   'rombel',@sesi1,NULL),
('2026-06-23',@s9, @r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:10:55'),
('2026-06-23',@s10,@r_xi_tkj1,@ta_id,@semester,1,'hadir',   'rombel',@sesi1,'2026-06-23 07:12:08');

-- Presensi 2026-06-24 (XI TKJ 2)
INSERT IGNORE INTO `presensi_jam_siswa`
(tanggal, siswa_id, rombel_id_snapshot, tahun_ajaran_id_snapshot, semester_snapshot,
 jam_id, status, mode_presensi, presensi_sesi_id, scanned_at) VALUES
('2026-06-24',@s11,@r_xi_tkj2,@ta_id,@semester,1,'hadir',   'rombel',@sesi2,'2026-06-24 07:05:10'),
('2026-06-24',@s12,@r_xi_tkj2,@ta_id,@semester,1,'hadir',   'rombel',@sesi2,'2026-06-24 07:06:22'),
('2026-06-24',@s13,@r_xi_tkj2,@ta_id,@semester,1,'terlambat','rombel',@sesi2,'2026-06-24 07:19:33'),
('2026-06-24',@s4, @r_xi_tkj1,@ta_id,@semester,1,'izin',    'rombel',@sesi2,NULL);

-- Presensi 2026-06-25 (XI RPL 1)
INSERT IGNORE INTO `presensi_jam_siswa`
(tanggal, siswa_id, rombel_id_snapshot, tahun_ajaran_id_snapshot, semester_snapshot,
 jam_id, status, mode_presensi, presensi_sesi_id, scanned_at) VALUES
('2026-06-25',@s19,@r_xi_rpl1,@ta_id,@semester,1,'hadir',   'rombel',@sesi3,'2026-06-25 07:04:55'),
('2026-06-25',@s20,@r_xi_rpl1,@ta_id,@semester,1,'hadir',   'rombel',@sesi3,'2026-06-25 07:07:11'),
('2026-06-25',@s6, @r_xi_tkj1,@ta_id,@semester,1,'alpha',   'rombel',@sesi3,NULL);

-- Presensi 2026-06-30 (XI TKJ 1)
INSERT IGNORE INTO `presensi_jam_siswa`
(tanggal, siswa_id, rombel_id_snapshot, tahun_ajaran_id_snapshot, semester_snapshot,
 jam_id, status, mode_presensi, presensi_sesi_id, scanned_at) VALUES
('2026-06-30',@s1, @r_xi_tkj1,@ta_id,@semester,1,'hadir',    'rombel',@sesi4,'2026-06-30 07:03:41'),
('2026-06-30',@s2, @r_xi_tkj1,@ta_id,@semester,1,'hadir',    'rombel',@sesi4,'2026-06-30 07:04:59'),
('2026-06-30',@s3, @r_xi_tkj1,@ta_id,@semester,1,'terlambat','rombel',@sesi4,'2026-06-30 07:21:07'),
('2026-06-30',@s5, @r_xi_tkj1,@ta_id,@semester,1,'hadir',    'rombel',@sesi4,'2026-06-30 07:06:18'),
('2026-06-30',@s6, @r_xi_tkj1,@ta_id,@semester,1,'alpha',    'rombel',@sesi4,NULL),
('2026-06-30',@s7, @r_xi_tkj1,@ta_id,@semester,1,'hadir',    'rombel',@sesi4,'2026-06-30 07:08:22'),
('2026-06-30',@s9, @r_xi_tkj1,@ta_id,@semester,1,'hadir',    'rombel',@sesi4,'2026-06-30 07:05:55');

-- ============================================================
-- 4. E-IZIN (beberapa pengajuan dengan berbagai status)
-- ============================================================
INSERT IGNORE INTO `e_izin`
(siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan,
 status, wali_catatan, created_at) VALUES
-- Disetujui
(@s8, 'sakit', '2026-06-23','2026-06-23',
 'Demam dan flu, sudah ke dokter puskesmas.',
 'disetujui','Izin diterima, semoga cepat sembuh.','2026-06-22 20:14:00'),
-- Menunggu wali kelas
(@s4, 'izin', '2026-06-24','2026-06-24',
 'Ada keperluan keluarga mendesak, orang tua sudah konfirmasi.',
 'pending',NULL,'2026-06-23 19:30:00'),
-- Ditolak
(@s6, 'izin', '2026-06-23','2026-06-23',
 'Pergi ke mall.',
 'ditolak','Alasan tidak dapat diterima untuk izin tidak masuk.','2026-06-22 21:00:00'),
-- Menunggu ortu
(@s3, 'sakit', '2026-07-03','2026-07-03',
 'Sakit kepala dan mual sejak pagi, tidak bisa ke sekolah.',
 'menunggu_ortu',NULL,NOW()),
-- Disetujui (siswa demo utama)
(@s1, 'izin', '2026-06-30','2026-06-30',
 'Mengikuti lomba LKS tingkat kota mewakili sekolah.',
 'disetujui','Izin resmi lomba disetujui.',NOW() - INTERVAL 5 DAY);

-- ============================================================
-- 5. LOGBOOK PKL
-- ============================================================
INSERT IGNORE INTO `logbook_praktik`
(siswa_id, guru_id, tanggal, jam_mulai, jam_selesai, lokasi, deskripsi, status,
 catatan_guru, reviewed_at, created_at) VALUES
-- Disetujui
(@s1, @guru_id, '2026-06-23','08:00','12:00','Lab Komputer TKJ',
 'Melakukan instalasi dan konfigurasi sistem operasi Windows Server 2019 pada server lab. Mengikuti prosedur instalasi clean install, melakukan setting partisi, instalasi driver, dan konfigurasi awal jaringan LAN.',
 'disetujui','Dokumentasi kegiatan lengkap dan deskripsi jelas. Pertahankan!',
 '2026-06-24 08:00:00','2026-06-23 15:00:00'),

(@s1, @guru_id, '2026-06-24','08:00','12:00','Lab Komputer TKJ',
 'Melanjutkan konfigurasi Windows Server: setup Active Directory Domain Services (AD DS), membuat domain smksrajasa.local, dan mendaftarkan 3 komputer klien ke domain. Troubleshooting koneksi klien yang tidak bisa join domain karena DNS salah konfigurasi.',
 'disetujui','Baik, troubleshooting DNS sudah benar. Lanjutkan dengan setup Group Policy.',
 '2026-06-25 09:00:00','2026-06-24 15:00:00'),

(@s2, @guru_id, '2026-06-23','08:00','12:00','Lab Komputer TKJ',
 'Pemasangan jaringan LAN di ruang kelas XII TKJ 1. Melakukan crimping kabel UTP cat5e sebanyak 15 kabel, pemasangan RJ45, dan testing menggunakan LAN tester. Semua kabel berhasil terkoneksi dengan baik.',
 'disetujui','Pekerjaan rapi dan sesuai standar. Dokumentasi foto perlu ditambahkan.',
 '2026-06-24 08:30:00','2026-06-23 15:00:00'),

-- Menunggu review
(@s3, @guru_id, '2026-06-25','07:00','11:00','Ruang Server',
 'Monitoring dan maintenance server sekolah. Cek status layanan web server Apache, database MySQL, dan file server Samba. Melakukan backup database mingguan menggunakan mysqldump dan menyimpan ke external HDD.',
 'menunggu_review',NULL,NULL,'2026-06-25 14:00:00'),

(@s5, @guru_id, '2026-06-30','08:00','12:00','Lab Komputer TKJ',
 'Belajar konfigurasi router Mikrotik: setting DHCP server, NAT masquerade untuk sharing internet, dan basic firewall rules. Berhasil membuat 3 VLAN untuk memisahkan jaringan siswa, guru, dan administrasi.',
 'menunggu_review',NULL,NULL,'2026-06-30 14:30:00'),

-- Draft
(@s7, @guru_id, '2026-07-01','08:00','12:00','Lab Komputer TKJ',
 'Instalasi dan konfigurasi web server XAMPP untuk pengembangan aplikasi web siswa kelas X RPL. Membantu siswa setting virtual host dan debugging masalah PHP error.',
 'draft',NULL,NULL,NOW() - INTERVAL 1 DAY),

-- Dikembalikan (perlu revisi)
(@s9, @guru_id, '2026-06-24','08:00','10:00','Lab TKJ',
 'Belajar networking.',
 'ditolak','Deskripsi terlalu singkat. Tolong ceritakan secara detail kegiatan apa yang dipelajari, tools yang digunakan, dan hasil yang dicapai.',
 '2026-06-25 07:30:00','2026-06-24 14:00:00');

-- ============================================================
-- 6. TIKET / PUSAT KOMUNIKASI
-- ============================================================
INSERT IGNORE INTO `tiket`
(dari_user_id, kepada_user_id, kategori, prioritas, judul, pesan,
 status, reply_count, created_at) VALUES
(@siswa_uid, @guru_uid, 'pertanyaan', 'normal',
 'Jadwal PKL bulan Juli 2026',
 'Pak/Bu Guru, mau tanya jadwal PKL untuk bulan Juli apakah masih sama dengan Juni atau ada perubahan? Karena saya dengar ada rencana rotasi penempatan. Terima kasih.',
 'resolved', 2, NOW() - INTERVAL 3 DAY),

(@siswa_uid, @admin_uid, 'izin_khusus', 'tinggi',
 'Izin lomba LKS Kota Surabaya',
 'Mohon izin tidak mengikuti kegiatan sekolah pada tanggal 30 Juni 2026 karena akan mengikuti Lomba Kompetensi Siswa (LKS) bidang IT Network tingkat Kota Surabaya yang diselenggarakan di SMKN 1 Surabaya. Surat tugas terlampir.',
 'resolved', 3, NOW() - INTERVAL 7 DAY),

(@guru_uid, @admin_uid, 'laporan_masalah', 'tinggi',
 'Komputer Lab TKJ 2 No. 8 tidak bisa booting',
 'Komputer nomor 8 di Lab TKJ 2 tidak bisa booting sejak kemarin. Muncul pesan error "BOOTMGR is missing". Sudah dicoba restart beberapa kali tapi hasilnya sama. Mohon segera diperbaiki karena mengganggu kegiatan praktik.',
 'in_progress', 1, NOW() - INTERVAL 2 DAY),

(@siswa_uid, @guru_uid, 'konsultasi', 'normal',
 'Minta saran topik laporan akhir PKL',
 'Bu guru, saya mau konsultasi untuk topik laporan akhir PKL. Saya tertarik mengangkat tema "Implementasi VLAN untuk Keamanan Jaringan di Laboratorium Komputer". Apakah topik ini sesuai dan layak untuk dijadikan laporan? Mohon bimbingannya.',
 'open', 0, NOW() - INTERVAL 1 DAY),

(@siswa_uid, @guru_uid, 'keluhan', 'rendah',
 'AC di Lab TKJ 1 sering mati',
 'Mau lapor bahwa AC di Lab TKJ 1 sering mati sendiri terutama di jam siang. Suhu menjadi sangat panas dan membuat tidak nyaman saat praktik. Sudah berlangsung sekitar 2 minggu.',
 'open', 0, NOW() - INTERVAL 5 HOUR);

-- ============================================================
-- 7. BADGE GAMIFIKASI (katalog badge)
-- ============================================================
INSERT IGNORE INTO `gamifikasi_badge`
(kode, nama, deskripsi, icon, warna, kategori,
 kriteria_tipe, kriteria_nilai, poin_reward, is_aktif) VALUES
-- Kehadiran
('HADIR_RAJIN',   'Si Rajin',          'Hadir tepat waktu minimal 20 hari dalam satu bulan',                   '⭐','#22c55e','kehadiran','hadir_rate',   90, 50, 1),
('HADIR_SEMPURNA','Perfect Attendance','Tidak ada alpha sama sekali dalam satu bulan penuh',                    '🏅','#f59e0b','kehadiran','perfect_month', 1, 100, 1),
('STREAK_7',      'Streak 7 Hari',     'Hadir 7 hari berturut-turut tanpa absen',                              '🔥','#ef4444','kehadiran','streak',        7,  30, 1),
('STREAK_30',     'Streak 30 Hari',    'Hadir 30 hari berturut-turut — pencapaian luar biasa!',                '💎','#8b5cf6','kehadiran','streak',        30, 200, 1),
('EARLY_BIRD',    'Early Bird',        'Scan presensi dalam 5 menit pertama sesi dibuka selama 5 hari',        '🐦','#0ea5e9','kehadiran','early_bird',    5,  25, 1),
-- Logbook
('LOGBOOK_AKTIF', 'Penulis Aktif',     'Mengisi logbook minimal 10 entri yang disetujui',                     '📒','#06b6d4','logbook','logbook_count',  10, 40, 1),
('LOGBOOK_PRO',   'Logbook Pro',       'Semua entri logbook disetujui tanpa ada yang dikembalikan',            '✍️','#10b981','logbook','logbook_count',  20, 80, 1),
-- Komunikasi
('KOMUNIKATIF',   'Komunikatif',       'Aktif menggunakan pusat komunikasi — minimal 3 tiket selesai',        '💬','#f97316','komunikasi','tiket_count',  3,  20, 1),
-- Prestasi
('TOP3_BULAN',    'Top 3 Bulan Ini',   'Masuk 3 besar leaderboard poin di rombel dalam satu bulan',           '🏆','#f59e0b','prestasi','top3',           3,  75, 1),
('KONSISTEN',     'Konsisten',         'Menjaga rate kehadiran di atas 85% selama 3 bulan berturut-turut',    '💪','#6366f1','prestasi','konsisten',      85,  60, 1),
-- Khusus
('PERDANA',       'Pendatang Baru',    'Badge pertama yang kamu dapatkan — selamat bergabung!',                '🎉','#ec4899','khusus',  NULL,             NULL, 10, 1),
('BETA_USER',     'Beta Tester',       'Terima kasih sudah menggunakan sistem presensi QR sejak awal',         '🚀','#64748b','khusus',  NULL,             NULL, 20, 1);

-- ============================================================
-- 8. POIN GAMIFIKASI SISWA
-- ============================================================
INSERT IGNORE INTO `gamifikasi_poin`
(siswa_id, tipe, poin, keterangan, tanggal, created_at) VALUES
-- Siswa 1 (Ahmad Fauzan - rajin)
(@s1,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
(@s1,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-24','2026-06-24',NOW()-INTERVAL  9 DAY),
(@s1,'logbook_approved',  20,'Logbook 2026-06-23 disetujui',  '2026-06-24',NOW()-INTERVAL  9 DAY),
(@s1,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-25','2026-06-25',NOW()-INTERVAL  8 DAY),
(@s1,'logbook_approved',  20,'Logbook 2026-06-24 disetujui',  '2026-06-25',NOW()-INTERVAL  8 DAY),
(@s1,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-30','2026-06-30',NOW()-INTERVAL  3 DAY),
(@s1,'streak_7',           30,'Bonus streak 7 hari berturut-turut','2026-06-30',NOW()-INTERVAL 3 DAY),
(@s1,'tiket_selesai',      10,'Tiket "Jadwal PKL" selesai',   '2026-07-01',NOW()-INTERVAL  2 DAY),
-- Siswa 2
(@s2,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
(@s2,'logbook_approved',  20,'Logbook PKL disetujui',         '2026-06-24',NOW()-INTERVAL  9 DAY),
(@s2,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-30','2026-06-30',NOW()-INTERVAL  3 DAY),
-- Siswa 3
(@s3,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
(@s3,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-25',NOW()-INTERVAL  8 DAY),
-- Siswa 4 (terlambat beberapa kali)
(@s4,'hadir_terlambat',    5,'Hadir terlambat - 2026-06-23',  '2026-06-23',NOW()-INTERVAL 10 DAY),
-- Siswa 5
(@s5,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
(@s5,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-30','2026-06-30',NOW()-INTERVAL  3 DAY),
-- Siswa 7
(@s7,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
(@s7,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-30','2026-06-30',NOW()-INTERVAL  3 DAY),
-- Siswa 9
(@s9,'hadir_tepat_waktu', 10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
-- Siswa 10
(@s10,'hadir_tepat_waktu',10,'Hadir tepat waktu - 2026-06-23','2026-06-23',NOW()-INTERVAL 10 DAY),
-- Siswa 11 (XI TKJ 2)
(@s11,'hadir_tepat_waktu',10,'Hadir tepat waktu - 2026-06-24','2026-06-24',NOW()-INTERVAL  9 DAY),
-- Siswa 12
(@s12,'hadir_tepat_waktu',10,'Hadir tepat waktu - 2026-06-24','2026-06-24',NOW()-INTERVAL  9 DAY),
-- Siswa 19 (RPL)
(@s19,'hadir_tepat_waktu',10,'Hadir tepat waktu - 2026-06-25','2026-06-25',NOW()-INTERVAL  8 DAY),
-- Siswa 20
(@s20,'hadir_tepat_waktu',10,'Hadir tepat waktu - 2026-06-25','2026-06-25',NOW()-INTERVAL  8 DAY);

-- ============================================================
-- 9. BADGE YANG SUDAH DIRAIH SISWA
-- ============================================================
SET @badge_perdana = (SELECT badge_id FROM gamifikasi_badge WHERE kode='PERDANA'   LIMIT 1);
SET @badge_streak7 = (SELECT badge_id FROM gamifikasi_badge WHERE kode='STREAK_7'  LIMIT 1);
SET @badge_beta    = (SELECT badge_id FROM gamifikasi_badge WHERE kode='BETA_USER' LIMIT 1);
SET @badge_logpro  = (SELECT badge_id FROM gamifikasi_badge WHERE kode='LOGBOOK_AKTIF' LIMIT 1);

INSERT IGNORE INTO `gamifikasi_badge_siswa`
(siswa_id, badge_id, periode, diraih_at) VALUES
(@s1, @badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s1, @badge_streak7, '2026-06', DATE(NOW()-INTERVAL  3 DAY)),
(@s1, @badge_logpro,  '2026-06', DATE(NOW()-INTERVAL  8 DAY)),
(@s2, @badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s2, @badge_beta,    '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s3, @badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s5, @badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s7, @badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s9, @badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY)),
(@s11,@badge_perdana, '2026-06', DATE(NOW()-INTERVAL 30 DAY));

-- ============================================================

-- ============================================================
-- 10. SESSION LOG (untuk halaman Audit admin)
-- ============================================================
INSERT IGNORE INTO `user_sessions`
(user_id, session_token, ip_address, user_agent, logged_in_at, last_activity, logout_at, is_online) VALUES
(@guru_uid,  UNHEX(MD5(CONCAT('guru-s1',NOW()))),  '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0 - Guru Laptop',  NOW()-INTERVAL 30 MINUTE, NOW()-INTERVAL 5 MINUTE,   NULL,                    1),
(@admin_uid, UNHEX(MD5(CONCAT('adm-s1',NOW()))),   '192.168.1.5',  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/124.0 - Admin PC',    NOW()-INTERVAL 2 HOUR,   NOW()-INTERVAL 1 HOUR,    NOW()-INTERVAL 1 HOUR,   0),
(@siswa_uid, UNHEX(MD5(CONCAT('siswa-s1',NOW()))), '192.168.1.20', 'Mozilla/5.0 (Android 13; Mobile) Chrome/125.0 - Siswa HP',               NOW()-INTERVAL 4 HOUR,   NOW()-INTERVAL 3 HOUR,    NOW()-INTERVAL 3 HOUR,   0),
(@guru_uid,  UNHEX(MD5(CONCAT('guru-d1',NOW()))),  '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/125.0',                             NOW()-INTERVAL 1 DAY,    NOW()-INTERVAL 23 HOUR,   NOW()-INTERVAL 23 HOUR,  0),
(@admin_uid, UNHEX(MD5(CONCAT('adm-d2',NOW()))),   '192.168.1.5',  'Mozilla/5.0 (Windows NT 10.0) Firefox/124.0',                            NOW()-INTERVAL 2 DAY,    NOW()-INTERVAL 47 HOUR,   NOW()-INTERVAL 47 HOUR,  0),
(@siswa_uid, UNHEX(MD5(CONCAT('siswa-d2',NOW()))), '192.168.1.21', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604.1',                    NOW()-INTERVAL 2 DAY,    NOW()-INTERVAL 46 HOUR,   NOW()-INTERVAL 46 HOUR,  0),
(@guru_uid,  UNHEX(MD5(CONCAT('guru-d3',NOW()))),  '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/125.0',                             NOW()-INTERVAL 3 DAY,    NOW()-INTERVAL 71 HOUR,   NOW()-INTERVAL 71 HOUR,  0);

-- ============================================================
-- SELESAI — TAMPILKAN SUMMARY
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM siswa)                     AS total_siswa,
  (SELECT COUNT(*) FROM presensi_sesi)              AS total_sesi_presensi,
  (SELECT COUNT(*) FROM presensi_jam_siswa)         AS total_record_presensi,
  (SELECT COUNT(*) FROM e_izin)                     AS total_e_izin,
  (SELECT COUNT(*) FROM logbook_praktik)            AS total_logbook_pkl,
  (SELECT COUNT(*) FROM tiket)                      AS total_tiket_komunikasi,
  (SELECT COUNT(*) FROM gamifikasi_badge)           AS total_badge_katalog,
  (SELECT COUNT(*) FROM gamifikasi_poin)            AS total_record_poin,
  (SELECT COUNT(*) FROM gamifikasi_badge_siswa)     AS total_badge_diraih,
  (SELECT COUNT(*) FROM user_sessions)              AS total_sessions_audit;
