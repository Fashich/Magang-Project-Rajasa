-- ============================================================
-- SEED DATA DEMO BESAR — SMKS RAJASA SURABAYA
-- Semester Genap 2025/2026 (Januari–Juni 2026)
-- 42 Guru | 408 Siswa | 6 bulan data
-- ============================================================

USE `sistem_presensi_siswa_qr`;
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @ta_id    = (SELECT tahun_ajaran_id FROM tahun_ajaran WHERE is_aktif=1 LIMIT 1);
SET @semester = (SELECT semester_aktif FROM tahun_ajaran WHERE is_aktif=1 LIMIT 1);
SET @admin_uid= (SELECT user_id FROM users WHERE username='admin' LIMIT 1);

-- ============================================================
-- 1. GURU STAFF (42 guru)
-- ============================================================
INSERT IGNORE INTO `guru_staff`
(nip, nama_lengkap, no_telp, email, jenis_user, status) VALUES
('1970000120021001','Bella Prasetyo','082723756669','bella.prasetyo@smksrajasa.sch.id','guru','aktif'),
('1970000220031002','Julia Anggraini','082139345092','julia.anggraini@smksrajasa.sch.id','guru','aktif'),
('1971000320041003','Pras Adi Suryanto','089983140807','pras.adi.suryanto@smksrajasa.sch.id','guru','aktif'),
('1971000420051004','Faisal Rahmat Prasetyo','081031429110','faisal.rahmat.prasetyo@smksrajasa.sch.id','guru','aktif'),
('1971000520061005','Vina Permata','085323718431','vina.permata@smksrajasa.sch.id','guru','aktif'),
('1972000620071006','Hendra Imam Ramadhan','081571662963','hendra.imam.ramadhan@smksrajasa.sch.id','guru','aktif'),
('1972000720081007','Bagas Aryo Kurniawan','088958537831','bagas.aryo.kurniawan@smksrajasa.sch.id','guru','aktif'),
('1972000820091008','Vivi Aryo Pratama','084720709497','vivi.aryo.pratama@smksrajasa.sch.id','guru','aktif'),
('1973000920011009','Gita Prasetyo','085631831063','gita.prasetyo@smksrajasa.sch.id','guru','aktif'),
('1973001020021010','Oscar Utama Prasetyo','089796977837','oscar.utama.prasetyo@smksrajasa.sch.id','guru','aktif'),
('1973001120031011','Sigit Susanto','085846231783','sigit.susanto@smksrajasa.sch.id','guru','aktif'),
('1974001220041012','Priska Wahyu Gunawan','081740742311','priska.wahyu.gunawan@smksrajasa.sch.id','guru','aktif'),
('1974001320051013','Ulfa Prasetyo','088252235350','ulfa.prasetyo@smksrajasa.sch.id','guru','aktif'),
('1974001420061014','Ivan Ningrum','082743101783','ivan.ningrum@smksrajasa.sch.id','guru','aktif'),
('1975001520071015','Julia Fadli Anggraini','086158586340','julia.fadli.anggraini@smksrajasa.sch.id','guru','aktif'),
('1975001620081016','Joko Purnomo','081624716857','joko.purnomo@smksrajasa.sch.id','guru','aktif'),
('1975001720091017','Lutfi Puspita Anggraini','085961220073','lutfi.puspita.anggraini@smksrajasa.sch.id','guru','aktif'),
('1976001820011018','Eva Nur Wahyudi','081125374874','eva.nur.wahyudi@smksrajasa.sch.id','guru','aktif'),
('1976001920021019','Julia Zain Prasetyo','085324972279','julia.zain.prasetyo@smksrajasa.sch.id','guru','aktif'),
('1976002020031020','Lutfi Laksono Hidayat','084377187530','lutfi.laksono.hidayat@smksrajasa.sch.id','guru','aktif'),
('1977002120041021','Hesti Putri Firmansyah','084895758349','hesti.putri.firmansyah@smksrajasa.sch.id','guru','aktif'),
('1977002220051022','Nanda Candra Fauzan','087981182864','nanda.candra.fauzan@smksrajasa.sch.id','guru','aktif'),
('1977002320061023','Nurul Purnomo','085651273847','nurul.purnomo@smksrajasa.sch.id','guru','aktif'),
('1978002420071024','Rendi Saputra','087219289546','rendi.saputra@smksrajasa.sch.id','guru','aktif'),
('1978002520081025','Julia Lestari','087083793389','julia.lestari@smksrajasa.sch.id','guru','aktif'),
('1978002620091026','Kevin Dewi Anggraini','087936998038','kevin.dewi.anggraini@smksrajasa.sch.id','guru','aktif'),
('1979002720011027','Amelia Fauzan','087670597444','amelia.fauzan@smksrajasa.sch.id','guru','aktif'),
('1979002820021028','Putra Maulana','088040885476','putra.maulana@smksrajasa.sch.id','guru','aktif'),
('1979002920031029','Aini Nugraha','081454349361','aini.nugraha@smksrajasa.sch.id','guru','aktif'),
('1980003020041030','Rendi Purnomo','082686644106','rendi.purnomo@smksrajasa.sch.id','guru','aktif'),
('1980003120051031','Putri Puspita Sulistyo','083422660194','putri.puspita.sulistyo@smksrajasa.sch.id','guru','aktif'),
('1980003220061032','Edwin Anggraini','081697705310','edwin.anggraini@smksrajasa.sch.id','guru','aktif'),
('1981003320071033','Gita Agung Rahmawati','082343374088','gita.agung.rahmawati@smksrajasa.sch.id','guru','aktif'),
('1981003420081034','Lukas Lestari','084572092888','lukas.lestari@smksrajasa.sch.id','guru','aktif'),
('1981003520091035','Farid Firmansyah','087911980765','farid.firmansyah@smksrajasa.sch.id','guru','aktif'),
('1982003620011036','Zara Susanto','087274606833','zara.susanto@smksrajasa.sch.id','guru','aktif'),
('1982003720021037','Cahyo Nugraha','081062401521','cahyo.nugraha@smksrajasa.sch.id','guru','aktif'),
('1982003820031038','Galih Gilang Anggraini','088198834863','galih.gilang.anggraini@smksrajasa.sch.id','guru','aktif'),
('1983003920041039','Jessica Kurniawan','081787736262','jessica.kurniawan@smksrajasa.sch.id','guru','aktif'),
('1983004020051040','Dewi Hakim','088473993471','dewi.hakim@smksrajasa.sch.id','guru','aktif'),
('1983004120061041','Kevin Danu Nugraha','082034941004','kevin.danu.nugraha@smksrajasa.sch.id','guru','aktif'),
('1984004220071042','Farid Susanto','088243046464','farid.susanto@smksrajasa.sch.id','guru','aktif');

-- User accounts untuk guru
-- Ambil hash password yang sudah ada dari akun demo
SET @demo_pw = (SELECT password_hash FROM users WHERE username='guru' LIMIT 1);

-- Insert users untuk setiap guru
SET @gid_1 = (SELECT guru_id FROM guru_staff WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('bella.prasetyo1',@demo_pw,'bella.prasetyo@smksrajasa.sch.id','guru',@gid_1,'aktif');
SET @gid_2 = (SELECT guru_id FROM guru_staff WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('julia.anggraini2',@demo_pw,'julia.anggraini@smksrajasa.sch.id','guru',@gid_2,'aktif');
SET @gid_3 = (SELECT guru_id FROM guru_staff WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('pras.adi.suryanto3',@demo_pw,'pras.adi.suryanto@smksrajasa.sch.id','guru',@gid_3,'aktif');
SET @gid_4 = (SELECT guru_id FROM guru_staff WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('faisal.rahmat.prasetyo4',@demo_pw,'faisal.rahmat.prasetyo@smksrajasa.sch.id','guru',@gid_4,'aktif');
SET @gid_5 = (SELECT guru_id FROM guru_staff WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('vina.permata5',@demo_pw,'vina.permata@smksrajasa.sch.id','guru',@gid_5,'aktif');
SET @gid_6 = (SELECT guru_id FROM guru_staff WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('hendra.imam.ramadhan6',@demo_pw,'hendra.imam.ramadhan@smksrajasa.sch.id','guru',@gid_6,'aktif');
SET @gid_7 = (SELECT guru_id FROM guru_staff WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('bagas.aryo.kurniawan7',@demo_pw,'bagas.aryo.kurniawan@smksrajasa.sch.id','guru',@gid_7,'aktif');
SET @gid_8 = (SELECT guru_id FROM guru_staff WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('vivi.aryo.pratama8',@demo_pw,'vivi.aryo.pratama@smksrajasa.sch.id','guru',@gid_8,'aktif');
SET @gid_9 = (SELECT guru_id FROM guru_staff WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('gita.prasetyo9',@demo_pw,'gita.prasetyo@smksrajasa.sch.id','guru',@gid_9,'aktif');
SET @gid_10 = (SELECT guru_id FROM guru_staff WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('oscar.utama.prasetyo10',@demo_pw,'oscar.utama.prasetyo@smksrajasa.sch.id','guru',@gid_10,'aktif');
SET @gid_11 = (SELECT guru_id FROM guru_staff WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('sigit.susanto11',@demo_pw,'sigit.susanto@smksrajasa.sch.id','guru',@gid_11,'aktif');
SET @gid_12 = (SELECT guru_id FROM guru_staff WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('priska.wahyu.gunawan12',@demo_pw,'priska.wahyu.gunawan@smksrajasa.sch.id','guru',@gid_12,'aktif');
SET @gid_13 = (SELECT guru_id FROM guru_staff WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('ulfa.prasetyo13',@demo_pw,'ulfa.prasetyo@smksrajasa.sch.id','guru',@gid_13,'aktif');
SET @gid_14 = (SELECT guru_id FROM guru_staff WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('ivan.ningrum14',@demo_pw,'ivan.ningrum@smksrajasa.sch.id','guru',@gid_14,'aktif');
SET @gid_15 = (SELECT guru_id FROM guru_staff WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('julia.fadli.anggraini15',@demo_pw,'julia.fadli.anggraini@smksrajasa.sch.id','guru',@gid_15,'aktif');
SET @gid_16 = (SELECT guru_id FROM guru_staff WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('joko.purnomo16',@demo_pw,'joko.purnomo@smksrajasa.sch.id','guru',@gid_16,'aktif');
SET @gid_17 = (SELECT guru_id FROM guru_staff WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('lutfi.puspita.anggraini17',@demo_pw,'lutfi.puspita.anggraini@smksrajasa.sch.id','guru',@gid_17,'aktif');
SET @gid_18 = (SELECT guru_id FROM guru_staff WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('eva.nur.wahyudi18',@demo_pw,'eva.nur.wahyudi@smksrajasa.sch.id','guru',@gid_18,'aktif');
SET @gid_19 = (SELECT guru_id FROM guru_staff WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('julia.zain.prasetyo19',@demo_pw,'julia.zain.prasetyo@smksrajasa.sch.id','guru',@gid_19,'aktif');
SET @gid_20 = (SELECT guru_id FROM guru_staff WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('lutfi.laksono.hidayat20',@demo_pw,'lutfi.laksono.hidayat@smksrajasa.sch.id','guru',@gid_20,'aktif');
SET @gid_21 = (SELECT guru_id FROM guru_staff WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('hesti.putri.firmansyah21',@demo_pw,'hesti.putri.firmansyah@smksrajasa.sch.id','guru',@gid_21,'aktif');
SET @gid_22 = (SELECT guru_id FROM guru_staff WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('nanda.candra.fauzan22',@demo_pw,'nanda.candra.fauzan@smksrajasa.sch.id','guru',@gid_22,'aktif');
SET @gid_23 = (SELECT guru_id FROM guru_staff WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('nurul.purnomo23',@demo_pw,'nurul.purnomo@smksrajasa.sch.id','guru',@gid_23,'aktif');
SET @gid_24 = (SELECT guru_id FROM guru_staff WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('rendi.saputra24',@demo_pw,'rendi.saputra@smksrajasa.sch.id','guru',@gid_24,'aktif');
SET @gid_25 = (SELECT guru_id FROM guru_staff WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('julia.lestari25',@demo_pw,'julia.lestari@smksrajasa.sch.id','guru',@gid_25,'aktif');
SET @gid_26 = (SELECT guru_id FROM guru_staff WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('kevin.dewi.anggraini26',@demo_pw,'kevin.dewi.anggraini@smksrajasa.sch.id','guru',@gid_26,'aktif');
SET @gid_27 = (SELECT guru_id FROM guru_staff WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('amelia.fauzan27',@demo_pw,'amelia.fauzan@smksrajasa.sch.id','guru',@gid_27,'aktif');
SET @gid_28 = (SELECT guru_id FROM guru_staff WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('putra.maulana28',@demo_pw,'putra.maulana@smksrajasa.sch.id','guru',@gid_28,'aktif');
SET @gid_29 = (SELECT guru_id FROM guru_staff WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('aini.nugraha29',@demo_pw,'aini.nugraha@smksrajasa.sch.id','guru',@gid_29,'aktif');
SET @gid_30 = (SELECT guru_id FROM guru_staff WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('rendi.purnomo30',@demo_pw,'rendi.purnomo@smksrajasa.sch.id','guru',@gid_30,'aktif');
SET @gid_31 = (SELECT guru_id FROM guru_staff WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('putri.puspita.sulistyo31',@demo_pw,'putri.puspita.sulistyo@smksrajasa.sch.id','guru',@gid_31,'aktif');
SET @gid_32 = (SELECT guru_id FROM guru_staff WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('edwin.anggraini32',@demo_pw,'edwin.anggraini@smksrajasa.sch.id','guru',@gid_32,'aktif');
SET @gid_33 = (SELECT guru_id FROM guru_staff WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('gita.agung.rahmawati33',@demo_pw,'gita.agung.rahmawati@smksrajasa.sch.id','guru',@gid_33,'aktif');
SET @gid_34 = (SELECT guru_id FROM guru_staff WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('lukas.lestari34',@demo_pw,'lukas.lestari@smksrajasa.sch.id','guru',@gid_34,'aktif');
SET @gid_35 = (SELECT guru_id FROM guru_staff WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('farid.firmansyah35',@demo_pw,'farid.firmansyah@smksrajasa.sch.id','guru',@gid_35,'aktif');
SET @gid_36 = (SELECT guru_id FROM guru_staff WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('zara.susanto36',@demo_pw,'zara.susanto@smksrajasa.sch.id','guru',@gid_36,'aktif');
SET @gid_37 = (SELECT guru_id FROM guru_staff WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('cahyo.nugraha37',@demo_pw,'cahyo.nugraha@smksrajasa.sch.id','guru',@gid_37,'aktif');
SET @gid_38 = (SELECT guru_id FROM guru_staff WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('galih.gilang.anggraini38',@demo_pw,'galih.gilang.anggraini@smksrajasa.sch.id','guru',@gid_38,'aktif');
SET @gid_39 = (SELECT guru_id FROM guru_staff WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('jessica.kurniawan39',@demo_pw,'jessica.kurniawan@smksrajasa.sch.id','guru',@gid_39,'aktif');
SET @gid_40 = (SELECT guru_id FROM guru_staff WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('dewi.hakim40',@demo_pw,'dewi.hakim@smksrajasa.sch.id','guru',@gid_40,'aktif');
SET @gid_41 = (SELECT guru_id FROM guru_staff WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('kevin.danu.nugraha41',@demo_pw,'kevin.danu.nugraha@smksrajasa.sch.id','guru',@gid_41,'aktif');
SET @gid_42 = (SELECT guru_id FROM guru_staff WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `users` (username,password_hash,email,user_type,guru_id,status)
  VALUES('farid.susanto42',@demo_pw,'farid.susanto@smksrajasa.sch.id','guru',@gid_42,'aktif');

-- ============================================================
-- 2. WALI KELAS PER ROMBEL
-- ============================================================
SET @rombel_x_tkj_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='X TKJ 1' LIMIT 1);
SET @guru_1_id = (SELECT guru_id FROM guru_staff WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_x_tkj_1, @guru_1_id, @ta_id, @semester, '2026-01-06');
SET @rombel_x_tkj_2 = (SELECT rombel_id FROM rombel WHERE label_rombel='X TKJ 2' LIMIT 1);
SET @guru_2_id = (SELECT guru_id FROM guru_staff WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_x_tkj_2, @guru_2_id, @ta_id, @semester, '2026-01-06');
SET @rombel_x_rpl_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='X RPL 1' LIMIT 1);
SET @guru_3_id = (SELECT guru_id FROM guru_staff WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_x_rpl_1, @guru_3_id, @ta_id, @semester, '2026-01-06');
SET @rombel_x_mm_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='X MM 1' LIMIT 1);
SET @guru_4_id = (SELECT guru_id FROM guru_staff WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_x_mm_1, @guru_4_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xi_tkj_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='XI TKJ 1' LIMIT 1);
SET @guru_5_id = (SELECT guru_id FROM guru_staff WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xi_tkj_1, @guru_5_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xi_tkj_2 = (SELECT rombel_id FROM rombel WHERE label_rombel='XI TKJ 2' LIMIT 1);
SET @guru_6_id = (SELECT guru_id FROM guru_staff WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xi_tkj_2, @guru_6_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xi_rpl_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='XI RPL 1' LIMIT 1);
SET @guru_7_id = (SELECT guru_id FROM guru_staff WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xi_rpl_1, @guru_7_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xi_mm_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='XI MM 1' LIMIT 1);
SET @guru_8_id = (SELECT guru_id FROM guru_staff WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xi_mm_1, @guru_8_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xii_tkj_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='XII TKJ 1' LIMIT 1);
SET @guru_9_id = (SELECT guru_id FROM guru_staff WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xii_tkj_1, @guru_9_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xii_tkj_2 = (SELECT rombel_id FROM rombel WHERE label_rombel='XII TKJ 2' LIMIT 1);
SET @guru_10_id = (SELECT guru_id FROM guru_staff WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xii_tkj_2, @guru_10_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xii_rpl_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='XII RPL 1' LIMIT 1);
SET @guru_11_id = (SELECT guru_id FROM guru_staff WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xii_rpl_1, @guru_11_id, @ta_id, @semester, '2026-01-06');
SET @rombel_xii_mm_1 = (SELECT rombel_id FROM rombel WHERE label_rombel='XII MM 1' LIMIT 1);
SET @guru_12_id = (SELECT guru_id FROM guru_staff WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1);
INSERT IGNORE INTO `rombel_wali_kelas` (rombel_id, guru_id, tahun_ajaran_id, semester, tanggal_mulai)
  VALUES(@rombel_xii_mm_1, @guru_12_id, @ta_id, @semester, '2026-01-06');

-- ============================================================
-- 3. SISWA (408 siswa)
-- ============================================================
-- Siswa X TKJ 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025101','2025101','Omar Setia Pratama','L','aktif',@rombel_x_tkj_1),
  ('3202025102','2025102','Danang Utama Hakim','L','aktif',@rombel_x_tkj_1),
  ('3202025103','2025103','Nadia Hakim','P','aktif',@rombel_x_tkj_1),
  ('3202025104','2025104','Cahyo Wibowo','L','aktif',@rombel_x_tkj_1),
  ('3202025105','2025105','Bayu Kusuma','L','aktif',@rombel_x_tkj_1),
  ('3202025106','2025106','Olivia Firmansyah','P','aktif',@rombel_x_tkj_1),
  ('3202025107','2025107','Oscar Wahyudi','L','aktif',@rombel_x_tkj_1),
  ('3202025108','2025108','Zulfikar Ayu Kusuma','L','aktif',@rombel_x_tkj_1),
  ('3202025109','2025109','Yuli Setiawan','P','aktif',@rombel_x_tkj_1),
  ('3202025110','2025110','Lukas Wahyu Wibowo','L','aktif',@rombel_x_tkj_1),
  ('3202025111','2025111','Tegar Nur Hidayat','L','aktif',@rombel_x_tkj_1),
  ('3202025112','2025112','Kania Gilang Firmansyah','P','aktif',@rombel_x_tkj_1),
  ('3202025113','2025113','Joko Fadli Rahayu','L','aktif',@rombel_x_tkj_1),
  ('3202025114','2025114','Adib Permata','L','aktif',@rombel_x_tkj_1),
  ('3202025115','2025115','Nurul Maulana','P','aktif',@rombel_x_tkj_1),
  ('3202025116','2025116','Sigit Dewi Wahyudi','L','aktif',@rombel_x_tkj_1),
  ('3202025117','2025117','Sandi Nugraha','L','aktif',@rombel_x_tkj_1),
  ('3202025118','2025118','Cantika Prasetyo','P','aktif',@rombel_x_tkj_1),
  ('3202025119','2025119','Yogi Zain Lestari','L','aktif',@rombel_x_tkj_1),
  ('3202025120','2025120','Sandi Danu Safitri','L','aktif',@rombel_x_tkj_1),
  ('3202025121','2025121','Cantika Hidayat','P','aktif',@rombel_x_tkj_1),
  ('3202025122','2025122','Wawan Ayu Permata','L','aktif',@rombel_x_tkj_1),
  ('3202025123','2025123','Arif Permata','L','aktif',@rombel_x_tkj_1),
  ('3202025124','2025124','Cindy Gilang Fauzan','P','aktif',@rombel_x_tkj_1),
  ('3202025125','2025125','Deni Ramadhan','L','aktif',@rombel_x_tkj_1),
  ('3202025126','2025126','Rendi Firmansyah','L','aktif',@rombel_x_tkj_1),
  ('3202025127','2025127','Kania Ayu Fitriani','P','aktif',@rombel_x_tkj_1),
  ('3202025128','2025128','Adib Candra Susanto','L','aktif',@rombel_x_tkj_1),
  ('3202025129','2025129','Miftah Fitriani','L','aktif',@rombel_x_tkj_1),
  ('3202025130','2025130','Yeni Putri Maulana','P','aktif',@rombel_x_tkj_1),
  ('3202025131','2025131','Danang Susanto','L','aktif',@rombel_x_tkj_1),
  ('3202025132','2025132','Wawan Budi Hasanah','L','aktif',@rombel_x_tkj_1),
  ('3202025133','2025133','Fanny Eka Suryanto','P','aktif',@rombel_x_tkj_1),
  ('3202025134','2025134','Galih Imam Wibowo','L','aktif',@rombel_x_tkj_1);

-- Siswa X TKJ 2
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025135','2025135','Putra Eka Santoso','L','aktif',@rombel_x_tkj_2),
  ('3202025136','2025136','Cahyo Hadi Prasetyo','L','aktif',@rombel_x_tkj_2),
  ('3202025137','2025137','Afifah Fadli Ramadhan','P','aktif',@rombel_x_tkj_2),
  ('3202025138','2025138','Cahyo Utama Maulana','L','aktif',@rombel_x_tkj_2),
  ('3202025139','2025139','Ilham Wahyudi','L','aktif',@rombel_x_tkj_2),
  ('3202025140','2025140','Qori Agung Firmansyah','P','aktif',@rombel_x_tkj_2),
  ('3202025141','2025141','Zulfikar Hakim','L','aktif',@rombel_x_tkj_2),
  ('3202025142','2025142','Jefri Budi Hasanah','L','aktif',@rombel_x_tkj_2),
  ('3202025143','2025143','Mega Fadli Pratama','P','aktif',@rombel_x_tkj_2),
  ('3202025144','2025144','Ahmad Suryanto','L','aktif',@rombel_x_tkj_2),
  ('3202025145','2025145','Farid Utama Maulana','L','aktif',@rombel_x_tkj_2),
  ('3202025146','2025146','Silvi Dewi Rahayu','P','aktif',@rombel_x_tkj_2),
  ('3202025147','2025147','Vicky Nur Wibowo','L','aktif',@rombel_x_tkj_2),
  ('3202025148','2025148','Wahyu Januar Kurniawan','L','aktif',@rombel_x_tkj_2),
  ('3202025149','2025149','Mega Kusuma Hasanah','P','aktif',@rombel_x_tkj_2),
  ('3202025150','2025150','Miftah Wibowo','L','aktif',@rombel_x_tkj_2),
  ('3202025151','2025151','Ahmad Kurniawan','L','aktif',@rombel_x_tkj_2),
  ('3202025152','2025152','Maya Hakim','P','aktif',@rombel_x_tkj_2),
  ('3202025153','2025153','Faisal Utama Hartono','L','aktif',@rombel_x_tkj_2),
  ('3202025154','2025154','Adib Saputra','L','aktif',@rombel_x_tkj_2),
  ('3202025155','2025155','Silvi Maulana','P','aktif',@rombel_x_tkj_2),
  ('3202025156','2025156','Bayu Wibowo','L','aktif',@rombel_x_tkj_2),
  ('3202025157','2025157','Nanda Santoso','L','aktif',@rombel_x_tkj_2),
  ('3202025158','2025158','Fanny Kusuma','P','aktif',@rombel_x_tkj_2),
  ('3202025159','2025159','Sigit Rahmat Suryanto','L','aktif',@rombel_x_tkj_2),
  ('3202025160','2025160','Bagas Rahmawati','L','aktif',@rombel_x_tkj_2),
  ('3202025161','2025161','Rahma Wahyu Hidayat','P','aktif',@rombel_x_tkj_2),
  ('3202025162','2025162','Candra Ayu Firmansyah','L','aktif',@rombel_x_tkj_2),
  ('3202025163','2025163','Putra Ningrum','L','aktif',@rombel_x_tkj_2),
  ('3202025164','2025164','Putri Rahayu','P','aktif',@rombel_x_tkj_2),
  ('3202025165','2025165','Galih Utama Hakim','L','aktif',@rombel_x_tkj_2),
  ('3202025166','2025166','Faisal Setia Anggraini','L','aktif',@rombel_x_tkj_2),
  ('3202025167','2025167','Kania Laksono Setiawan','P','aktif',@rombel_x_tkj_2),
  ('3202025168','2025168','Habib Laksono Wahyudi','L','aktif',@rombel_x_tkj_2);

-- Siswa X RPL 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025169','2025169','Sigit Fadli Purnomo','L','aktif',@rombel_x_rpl_1),
  ('3202025170','2025170','Taufiq Laksono Kusuma','L','aktif',@rombel_x_rpl_1),
  ('3202025171','2025171','Putri Maulana','P','aktif',@rombel_x_rpl_1),
  ('3202025172','2025172','Bagas Wahyu Permata','L','aktif',@rombel_x_rpl_1),
  ('3202025173','2025173','Farid Fitriani','L','aktif',@rombel_x_rpl_1),
  ('3202025174','2025174','Eva Nugraha','P','aktif',@rombel_x_rpl_1),
  ('3202025175','2025175','Danang Januar Santoso','L','aktif',@rombel_x_rpl_1),
  ('3202025176','2025176','Bayu Hasanah','L','aktif',@rombel_x_rpl_1),
  ('3202025177','2025177','Wulan Gilang Hasanah','P','aktif',@rombel_x_rpl_1),
  ('3202025178','2025178','Danang Gunawan','L','aktif',@rombel_x_rpl_1),
  ('3202025179','2025179','Taufiq Purnomo','L','aktif',@rombel_x_rpl_1),
  ('3202025180','2025180','Vina Utama Rahmawati','P','aktif',@rombel_x_rpl_1),
  ('3202025181','2025181','Galih Putri Lestari','L','aktif',@rombel_x_rpl_1),
  ('3202025182','2025182','Lukas Adi Rahmawati','L','aktif',@rombel_x_rpl_1),
  ('3202025183','2025183','Silvi Adi Saputra','P','aktif',@rombel_x_rpl_1),
  ('3202025184','2025184','Joko Ningrum','L','aktif',@rombel_x_rpl_1),
  ('3202025185','2025185','Sandi Hakim','L','aktif',@rombel_x_rpl_1),
  ('3202025186','2025186','Ulfa Hasanah','P','aktif',@rombel_x_rpl_1),
  ('3202025187','2025187','Danang Saputra','L','aktif',@rombel_x_rpl_1),
  ('3202025188','2025188','Adib Pratama Nugraha','L','aktif',@rombel_x_rpl_1),
  ('3202025189','2025189','Wulan Eka Kusuma','P','aktif',@rombel_x_rpl_1),
  ('3202025190','2025190','Tegar Agung Santoso','L','aktif',@rombel_x_rpl_1),
  ('3202025191','2025191','Nanda Sari Santoso','L','aktif',@rombel_x_rpl_1),
  ('3202025192','2025192','Putri Candra Sulistyo','P','aktif',@rombel_x_rpl_1),
  ('3202025193','2025193','Nugroho Dwi Ningrum','L','aktif',@rombel_x_rpl_1),
  ('3202025194','2025194','Candra Imam Setiawan','L','aktif',@rombel_x_rpl_1),
  ('3202025195','2025195','Yeni Wahyu Rahayu','P','aktif',@rombel_x_rpl_1),
  ('3202025196','2025196','Lutfi Gilang Firmansyah','L','aktif',@rombel_x_rpl_1),
  ('3202025197','2025197','Vicky Hasanah','L','aktif',@rombel_x_rpl_1),
  ('3202025198','2025198','Vivi Dwi Kusuma','P','aktif',@rombel_x_rpl_1),
  ('3202025199','2025199','Sigit Eka Firmansyah','L','aktif',@rombel_x_rpl_1),
  ('3202025200','2025200','Vicky Dewi Rahayu','L','aktif',@rombel_x_rpl_1),
  ('3202025201','2025201','Lulu Pratama','P','aktif',@rombel_x_rpl_1),
  ('3202025202','2025202','Edwin Fauzan','L','aktif',@rombel_x_rpl_1);

-- Siswa X MM 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025203','2025203','Tegar Hadi Hidayat','L','aktif',@rombel_x_mm_1),
  ('3202025204','2025204','Ivan Budi Anggraini','L','aktif',@rombel_x_mm_1),
  ('3202025205','2025205','Priska Ayu Ningrum','P','aktif',@rombel_x_mm_1),
  ('3202025206','2025206','Edwin Danu Prasetyo','L','aktif',@rombel_x_mm_1),
  ('3202025207','2025207','Lukas Sulistyo','L','aktif',@rombel_x_mm_1),
  ('3202025208','2025208','Wening Prasetyo','P','aktif',@rombel_x_mm_1),
  ('3202025209','2025209','Faisal Eka Ningrum','L','aktif',@rombel_x_mm_1),
  ('3202025210','2025210','Udin Maulana','L','aktif',@rombel_x_mm_1),
  ('3202025211','2025211','Ulfa Purnomo','P','aktif',@rombel_x_mm_1),
  ('3202025212','2025212','Sandi Hadi Prasetyo','L','aktif',@rombel_x_mm_1),
  ('3202025213','2025213','Wawan Ayu Prasetyo','L','aktif',@rombel_x_mm_1),
  ('3202025214','2025214','Ika Saputra','P','aktif',@rombel_x_mm_1),
  ('3202025215','2025215','Danang Mahardika Susanto','L','aktif',@rombel_x_mm_1),
  ('3202025216','2025216','Tegar Purnomo','L','aktif',@rombel_x_mm_1),
  ('3202025217','2025217','Bella Kurniawan','P','aktif',@rombel_x_mm_1),
  ('3202025218','2025218','Wawan Eka Wibowo','L','aktif',@rombel_x_mm_1),
  ('3202025219','2025219','Arif Ramadhan','L','aktif',@rombel_x_mm_1),
  ('3202025220','2025220','Yeni Maulana','P','aktif',@rombel_x_mm_1),
  ('3202025221','2025221','Galih Wibowo','L','aktif',@rombel_x_mm_1),
  ('3202025222','2025222','Ilham Suryanto','L','aktif',@rombel_x_mm_1),
  ('3202025223','2025223','Yeni Wijaya','P','aktif',@rombel_x_mm_1),
  ('3202025224','2025224','Adib Mahardika Prasetyo','L','aktif',@rombel_x_mm_1),
  ('3202025225','2025225','Bayu Nur Kurniawan','L','aktif',@rombel_x_mm_1),
  ('3202025226','2025226','Mega Gunawan','P','aktif',@rombel_x_mm_1),
  ('3202025227','2025227','Vicky Lestari','L','aktif',@rombel_x_mm_1),
  ('3202025228','2025228','Eko Pratama Kurniawan','L','aktif',@rombel_x_mm_1),
  ('3202025229','2025229','Indah Purnomo','P','aktif',@rombel_x_mm_1),
  ('3202025230','2025230','Faisal Hadi Wijaya','L','aktif',@rombel_x_mm_1),
  ('3202025231','2025231','Sandi Sulistyo','L','aktif',@rombel_x_mm_1),
  ('3202025232','2025232','Eka Purnomo','P','aktif',@rombel_x_mm_1),
  ('3202025233','2025233','Sigit Nugraha','L','aktif',@rombel_x_mm_1),
  ('3202025234','2025234','Nugroho Gilang Saputra','L','aktif',@rombel_x_mm_1),
  ('3202025235','2025235','Hana Pratama Fitriani','P','aktif',@rombel_x_mm_1),
  ('3202025236','2025236','Rafi Hasanah','L','aktif',@rombel_x_mm_1);

-- Siswa XI TKJ 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025237','2025237','Faisal Anggraini','L','aktif',@rombel_xi_tkj_1),
  ('3202025238','2025238','Rafi Agung Firmansyah','L','aktif',@rombel_xi_tkj_1),
  ('3202025239','2025239','Nadia Hartono','P','aktif',@rombel_xi_tkj_1),
  ('3202025240','2025240','Gilang Susanto','L','aktif',@rombel_xi_tkj_1),
  ('3202025241','2025241','Farid Hidayat','L','aktif',@rombel_xi_tkj_1),
  ('3202025242','2025242','Uswah Sulistyo','P','aktif',@rombel_xi_tkj_1),
  ('3202025243','2025243','Putra Gilang Kurniawan','L','aktif',@rombel_xi_tkj_1),
  ('3202025244','2025244','Galih Aryo Gunawan','L','aktif',@rombel_xi_tkj_1),
  ('3202025245','2025245','Priska Suryanto','P','aktif',@rombel_xi_tkj_1),
  ('3202025246','2025246','Lukas Eka Permata','L','aktif',@rombel_xi_tkj_1),
  ('3202025247','2025247','Kartono Nugraha','L','aktif',@rombel_xi_tkj_1),
  ('3202025248','2025248','Tika Kurniawan','P','aktif',@rombel_xi_tkj_1),
  ('3202025249','2025249','Galih Wahyu Wibowo','L','aktif',@rombel_xi_tkj_1),
  ('3202025250','2025250','Pras Agung Anggraini','L','aktif',@rombel_xi_tkj_1),
  ('3202025251','2025251','Nurul Santoso','P','aktif',@rombel_xi_tkj_1),
  ('3202025252','2025252','Vino Sari Santoso','L','aktif',@rombel_xi_tkj_1),
  ('3202025253','2025253','Vino Sari Prasetyo','L','aktif',@rombel_xi_tkj_1),
  ('3202025254','2025254','Zara Wijaya','P','aktif',@rombel_xi_tkj_1),
  ('3202025255','2025255','Tegar Prasetyo','L','aktif',@rombel_xi_tkj_1),
  ('3202025256','2025256','Omar Kusuma Purnomo','L','aktif',@rombel_xi_tkj_1),
  ('3202025257','2025257','Fanny Fitriani','P','aktif',@rombel_xi_tkj_1),
  ('3202025258','2025258','Udin Setiawan','L','aktif',@rombel_xi_tkj_1),
  ('3202025259','2025259','Wawan Mahardika Kurniawan','L','aktif',@rombel_xi_tkj_1),
  ('3202025260','2025260','Amelia Pratama','P','aktif',@rombel_xi_tkj_1),
  ('3202025261','2025261','Wahyu Hakim','L','aktif',@rombel_xi_tkj_1),
  ('3202025262','2025262','Candra Januar Hidayat','L','aktif',@rombel_xi_tkj_1),
  ('3202025263','2025263','Julia Fitriani','P','aktif',@rombel_xi_tkj_1),
  ('3202025264','2025264','Kevin Imam Purnomo','L','aktif',@rombel_xi_tkj_1),
  ('3202025265','2025265','Bayu Hartono','L','aktif',@rombel_xi_tkj_1),
  ('3202025266','2025266','Indah Kurniawan','P','aktif',@rombel_xi_tkj_1),
  ('3202025267','2025267','Wawan Rahayu','L','aktif',@rombel_xi_tkj_1),
  ('3202025268','2025268','Sigit Setia Susanto','L','aktif',@rombel_xi_tkj_1),
  ('3202025269','2025269','Tika Pratama Hidayat','P','aktif',@rombel_xi_tkj_1),
  ('3202025270','2025270','Gilang Rahayu','L','aktif',@rombel_xi_tkj_1);

-- Siswa XI TKJ 2
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025271','2025271','Ilham Permata','L','aktif',@rombel_xi_tkj_2),
  ('3202025272','2025272','Yoga Prasetyo','L','aktif',@rombel_xi_tkj_2),
  ('3202025273','2025273','Fanny Susanto','P','aktif',@rombel_xi_tkj_2),
  ('3202025274','2025274','Kartono Januar Suryanto','L','aktif',@rombel_xi_tkj_2),
  ('3202025275','2025275','Jefri Yoga Lestari','L','aktif',@rombel_xi_tkj_2),
  ('3202025276','2025276','Rina Fitriani','P','aktif',@rombel_xi_tkj_2),
  ('3202025277','2025277','Jefri Hidayat','L','aktif',@rombel_xi_tkj_2),
  ('3202025278','2025278','Vicky Sari Purnomo','L','aktif',@rombel_xi_tkj_2),
  ('3202025279','2025279','Dian Sulistyo','P','aktif',@rombel_xi_tkj_2),
  ('3202025280','2025280','Maulana Hasanah','L','aktif',@rombel_xi_tkj_2),
  ('3202025281','2025281','Wahyu Dewi Suryanto','L','aktif',@rombel_xi_tkj_2),
  ('3202025282','2025282','Putri Hasanah','P','aktif',@rombel_xi_tkj_2),
  ('3202025283','2025283','Candra Pratama','L','aktif',@rombel_xi_tkj_2),
  ('3202025284','2025284','Habib Hasanah','L','aktif',@rombel_xi_tkj_2),
  ('3202025285','2025285','Silvi Permata','P','aktif',@rombel_xi_tkj_2),
  ('3202025286','2025286','Deni Candra Maulana','L','aktif',@rombel_xi_tkj_2),
  ('3202025287','2025287','Faisal Ningrum','L','aktif',@rombel_xi_tkj_2),
  ('3202025288','2025288','Jessica Permata','P','aktif',@rombel_xi_tkj_2),
  ('3202025289','2025289','Sandi Hadi Rahmawati','L','aktif',@rombel_xi_tkj_2),
  ('3202025290','2025290','Yogi Dewi Hasanah','L','aktif',@rombel_xi_tkj_2),
  ('3202025291','2025291','Priska Wahyu Purnomo','P','aktif',@rombel_xi_tkj_2),
  ('3202025292','2025292','Deni Kusuma','L','aktif',@rombel_xi_tkj_2),
  ('3202025293','2025293','Vino Putri Kurniawan','L','aktif',@rombel_xi_tkj_2),
  ('3202025294','2025294','Yeni Aryo Anggraini','P','aktif',@rombel_xi_tkj_2),
  ('3202025295','2025295','Bayu Firmansyah','L','aktif',@rombel_xi_tkj_2),
  ('3202025296','2025296','Wawan Santoso','L','aktif',@rombel_xi_tkj_2),
  ('3202025297','2025297','Dewi Ramadhan','P','aktif',@rombel_xi_tkj_2),
  ('3202025298','2025298','Kartono Eka Fitriani','L','aktif',@rombel_xi_tkj_2),
  ('3202025299','2025299','Miftah Wijaya','L','aktif',@rombel_xi_tkj_2),
  ('3202025300','2025300','Zahra Susanto','P','aktif',@rombel_xi_tkj_2),
  ('3202025301','2025301','Omar Gunawan','L','aktif',@rombel_xi_tkj_2),
  ('3202025302','2025302','Sandi Laksono Wahyudi','L','aktif',@rombel_xi_tkj_2),
  ('3202025303','2025303','Eva Ayu Kurniawan','P','aktif',@rombel_xi_tkj_2),
  ('3202025304','2025304','Lutfi Aryo Safitri','L','aktif',@rombel_xi_tkj_2);

-- Siswa XI RPL 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025305','2025305','Omar Gilang Anggraini','L','aktif',@rombel_xi_rpl_1),
  ('3202025306','2025306','Bagas Sulistyo','L','aktif',@rombel_xi_rpl_1),
  ('3202025307','2025307','Zahra Rahmat Ramadhan','P','aktif',@rombel_xi_rpl_1),
  ('3202025308','2025308','Wawan Gilang Santoso','L','aktif',@rombel_xi_rpl_1),
  ('3202025309','2025309','Udin Prasetyo','L','aktif',@rombel_xi_rpl_1),
  ('3202025310','2025310','Tasya Zain Nugraha','P','aktif',@rombel_xi_rpl_1),
  ('3202025311','2025311','Adib Mahardika Kurniawan','L','aktif',@rombel_xi_rpl_1),
  ('3202025312','2025312','Putra Ramadhan','L','aktif',@rombel_xi_rpl_1),
  ('3202025313','2025313','Mega Setia Wahyudi','P','aktif',@rombel_xi_rpl_1),
  ('3202025314','2025314','Zaky Zain Lestari','L','aktif',@rombel_xi_rpl_1),
  ('3202025315','2025315','Sigit Pratama','L','aktif',@rombel_xi_rpl_1),
  ('3202025316','2025316','Dian Agung Fauzan','P','aktif',@rombel_xi_rpl_1),
  ('3202025317','2025317','Gilang Kurniawan','L','aktif',@rombel_xi_rpl_1),
  ('3202025318','2025318','Danang Suryanto','L','aktif',@rombel_xi_rpl_1),
  ('3202025319','2025319','Julia Ayu Fauzan','P','aktif',@rombel_xi_rpl_1),
  ('3202025320','2025320','Taufiq Setiawan','L','aktif',@rombel_xi_rpl_1),
  ('3202025321','2025321','Habib Puspita Kurniawan','L','aktif',@rombel_xi_rpl_1),
  ('3202025322','2025322','Vina Rahayu','P','aktif',@rombel_xi_rpl_1),
  ('3202025323','2025323','Farid Candra Gunawan','L','aktif',@rombel_xi_rpl_1),
  ('3202025324','2025324','Zaky Utama Rahmawati','L','aktif',@rombel_xi_rpl_1),
  ('3202025325','2025325','Kania Imam Saputra','P','aktif',@rombel_xi_rpl_1),
  ('3202025326','2025326','Ahmad Rahayu','L','aktif',@rombel_xi_rpl_1),
  ('3202025327','2025327','Vino Yoga Wahyudi','L','aktif',@rombel_xi_rpl_1),
  ('3202025328','2025328','Priska Imam Firmansyah','P','aktif',@rombel_xi_rpl_1),
  ('3202025329','2025329','Habib Adi Hakim','L','aktif',@rombel_xi_rpl_1),
  ('3202025330','2025330','Putra Tri Kusuma','L','aktif',@rombel_xi_rpl_1),
  ('3202025331','2025331','Eva Putri Wibowo','P','aktif',@rombel_xi_rpl_1),
  ('3202025332','2025332','Ilham Candra Pratama','L','aktif',@rombel_xi_rpl_1),
  ('3202025333','2025333','Vicky Rahayu','L','aktif',@rombel_xi_rpl_1),
  ('3202025334','2025334','Julia Hasanah','P','aktif',@rombel_xi_rpl_1),
  ('3202025335','2025335','Udin Yoga Fitriani','L','aktif',@rombel_xi_rpl_1),
  ('3202025336','2025336','Zaky Candra Fitriani','L','aktif',@rombel_xi_rpl_1),
  ('3202025337','2025337','Gracia Setia Fitriani','P','aktif',@rombel_xi_rpl_1),
  ('3202025338','2025338','Taufiq Fauzan','L','aktif',@rombel_xi_rpl_1);

-- Siswa XI MM 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025339','2025339','Faisal Fauzan','L','aktif',@rombel_xi_mm_1),
  ('3202025340','2025340','Vino Ramadhan','L','aktif',@rombel_xi_mm_1),
  ('3202025341','2025341','Rina Dwi Rahayu','P','aktif',@rombel_xi_mm_1),
  ('3202025342','2025342','Galih Aryo Hartono','L','aktif',@rombel_xi_mm_1),
  ('3202025343','2025343','Pras Adi Nugraha','L','aktif',@rombel_xi_mm_1),
  ('3202025344','2025344','Putri Hartono','P','aktif',@rombel_xi_mm_1),
  ('3202025345','2025345','Bayu Pratama Hartono','L','aktif',@rombel_xi_mm_1),
  ('3202025346','2025346','Putra Hadi Permata','L','aktif',@rombel_xi_mm_1),
  ('3202025347','2025347','Nurul Adi Prasetyo','P','aktif',@rombel_xi_mm_1),
  ('3202025348','2025348','Kartono Candra Wahyudi','L','aktif',@rombel_xi_mm_1),
  ('3202025349','2025349','Ilham Santoso','L','aktif',@rombel_xi_mm_1),
  ('3202025350','2025350','Wulan Puspita Susanto','P','aktif',@rombel_xi_mm_1),
  ('3202025351','2025351','Budi Wahyudi','L','aktif',@rombel_xi_mm_1),
  ('3202025352','2025352','Adib Kusuma Rahayu','L','aktif',@rombel_xi_mm_1),
  ('3202025353','2025353','Fanny Laksono Fauzan','P','aktif',@rombel_xi_mm_1),
  ('3202025354','2025354','Hendra Laksono Gunawan','L','aktif',@rombel_xi_mm_1),
  ('3202025355','2025355','Deni Wibowo','L','aktif',@rombel_xi_mm_1),
  ('3202025356','2025356','Bella Agung Sulistyo','P','aktif',@rombel_xi_mm_1),
  ('3202025357','2025357','Edwin Firmansyah','L','aktif',@rombel_xi_mm_1),
  ('3202025358','2025358','Faisal Saputra','L','aktif',@rombel_xi_mm_1),
  ('3202025359','2025359','Jessica Lestari','P','aktif',@rombel_xi_mm_1),
  ('3202025360','2025360','Sigit Hakim','L','aktif',@rombel_xi_mm_1),
  ('3202025361','2025361','Pras Kurniawan','L','aktif',@rombel_xi_mm_1),
  ('3202025362','2025362','Nurul Kusuma Firmansyah','P','aktif',@rombel_xi_mm_1),
  ('3202025363','2025363','Ilham Hartono','L','aktif',@rombel_xi_mm_1),
  ('3202025364','2025364','Putra Kusuma Maulana','L','aktif',@rombel_xi_mm_1),
  ('3202025365','2025365','Amelia Firmansyah','P','aktif',@rombel_xi_mm_1),
  ('3202025366','2025366','Wahyu Wahyudi','L','aktif',@rombel_xi_mm_1),
  ('3202025367','2025367','Kartono Sulistyo','L','aktif',@rombel_xi_mm_1),
  ('3202025368','2025368','Fitri Anggraini','P','aktif',@rombel_xi_mm_1),
  ('3202025369','2025369','Adib Imam Lestari','L','aktif',@rombel_xi_mm_1),
  ('3202025370','2025370','Omar Pratama Maulana','L','aktif',@rombel_xi_mm_1),
  ('3202025371','2025371','Bunga Imam Anggraini','P','aktif',@rombel_xi_mm_1),
  ('3202025372','2025372','Zaky Agung Kurniawan','L','aktif',@rombel_xi_mm_1);

-- Siswa XII TKJ 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025373','2025373','Zulfikar Hartono','L','aktif',@rombel_xii_tkj_1),
  ('3202025374','2025374','Habib Firmansyah','L','aktif',@rombel_xii_tkj_1),
  ('3202025375','2025375','Kania Imam Rahayu','P','aktif',@rombel_xii_tkj_1),
  ('3202025376','2025376','Nugroho Eka Anggraini','L','aktif',@rombel_xii_tkj_1),
  ('3202025377','2025377','Candra Sari Santoso','L','aktif',@rombel_xii_tkj_1),
  ('3202025378','2025378','Silvi Prasetyo','P','aktif',@rombel_xii_tkj_1),
  ('3202025379','2025379','Taufiq Wahyu Wibowo','L','aktif',@rombel_xii_tkj_1),
  ('3202025380','2025380','Zulfikar Adi Wijaya','L','aktif',@rombel_xii_tkj_1),
  ('3202025381','2025381','Lulu Rahmawati','P','aktif',@rombel_xii_tkj_1),
  ('3202025382','2025382','Adib Santoso','L','aktif',@rombel_xii_tkj_1),
  ('3202025383','2025383','Kevin Hasanah','L','aktif',@rombel_xii_tkj_1),
  ('3202025384','2025384','Vina Fauzan','P','aktif',@rombel_xii_tkj_1),
  ('3202025385','2025385','Wahyu Zain Saputra','L','aktif',@rombel_xii_tkj_1),
  ('3202025386','2025386','Kartono Danu Nugraha','L','aktif',@rombel_xii_tkj_1),
  ('3202025387','2025387','Rina Anggraini','P','aktif',@rombel_xii_tkj_1),
  ('3202025388','2025388','Faisal Prasetyo','L','aktif',@rombel_xii_tkj_1),
  ('3202025389','2025389','Jefri Ramadhan','L','aktif',@rombel_xii_tkj_1),
  ('3202025390','2025390','Sari Utama Purnomo','P','aktif',@rombel_xii_tkj_1),
  ('3202025391','2025391','Vicky Gunawan','L','aktif',@rombel_xii_tkj_1),
  ('3202025392','2025392','Pras Hidayat','L','aktif',@rombel_xii_tkj_1),
  ('3202025393','2025393','Nadia Zain Lestari','P','aktif',@rombel_xii_tkj_1),
  ('3202025394','2025394','Umar Rahayu','L','aktif',@rombel_xii_tkj_1),
  ('3202025395','2025395','Adib Wijaya','L','aktif',@rombel_xii_tkj_1),
  ('3202025396','2025396','Julia Wahyu Gunawan','P','aktif',@rombel_xii_tkj_1),
  ('3202025397','2025397','Udin Ramadhan','L','aktif',@rombel_xii_tkj_1),
  ('3202025398','2025398','Adib Anggraini','L','aktif',@rombel_xii_tkj_1),
  ('3202025399','2025399','Eka Dewi Hakim','P','aktif',@rombel_xii_tkj_1),
  ('3202025400','2025400','Nugroho Fitriani','L','aktif',@rombel_xii_tkj_1),
  ('3202025401','2025401','Cahyo Hakim','L','aktif',@rombel_xii_tkj_1),
  ('3202025402','2025402','Olivia Fauzan','P','aktif',@rombel_xii_tkj_1),
  ('3202025403','2025403','Hendra Eka Anggraini','L','aktif',@rombel_xii_tkj_1),
  ('3202025404','2025404','Kevin Aryo Rahmawati','L','aktif',@rombel_xii_tkj_1),
  ('3202025405','2025405','Yeni Gunawan','P','aktif',@rombel_xii_tkj_1),
  ('3202025406','2025406','Lutfi Aryo Rahayu','L','aktif',@rombel_xii_tkj_1);

-- Siswa XII TKJ 2
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025407','2025407','Nanda Ramadhan','L','aktif',@rombel_xii_tkj_2),
  ('3202025408','2025408','Tegar Permata','L','aktif',@rombel_xii_tkj_2),
  ('3202025409','2025409','Jessica Suryanto','P','aktif',@rombel_xii_tkj_2),
  ('3202025410','2025410','Kartono Kusuma','L','aktif',@rombel_xii_tkj_2),
  ('3202025411','2025411','Candra Purnomo','L','aktif',@rombel_xii_tkj_2),
  ('3202025412','2025412','Lulu Zain Safitri','P','aktif',@rombel_xii_tkj_2),
  ('3202025413','2025413','Nugroho Tri Hakim','L','aktif',@rombel_xii_tkj_2),
  ('3202025414','2025414','Sigit Permata','L','aktif',@rombel_xii_tkj_2),
  ('3202025415','2025415','Fanny Laksono Wibowo','P','aktif',@rombel_xii_tkj_2),
  ('3202025416','2025416','Omar Agung Ramadhan','L','aktif',@rombel_xii_tkj_2),
  ('3202025417','2025417','Vicky Safitri','L','aktif',@rombel_xii_tkj_2),
  ('3202025418','2025418','Yuli Kurniawan','P','aktif',@rombel_xii_tkj_2),
  ('3202025419','2025419','Gilang Hasanah','L','aktif',@rombel_xii_tkj_2),
  ('3202025420','2025420','Maulana Pratama','L','aktif',@rombel_xii_tkj_2),
  ('3202025421','2025421','Lulu Suryanto','P','aktif',@rombel_xii_tkj_2),
  ('3202025422','2025422','Habib Nur Permata','L','aktif',@rombel_xii_tkj_2),
  ('3202025423','2025423','Faisal Budi Maulana','L','aktif',@rombel_xii_tkj_2),
  ('3202025424','2025424','Fitri Wijaya','P','aktif',@rombel_xii_tkj_2),
  ('3202025425','2025425','Yoga Laksono Safitri','L','aktif',@rombel_xii_tkj_2),
  ('3202025426','2025426','Rafi Fauzan','L','aktif',@rombel_xii_tkj_2),
  ('3202025427','2025427','Sari Januar Fitriani','P','aktif',@rombel_xii_tkj_2),
  ('3202025428','2025428','Vino Setia Nugraha','L','aktif',@rombel_xii_tkj_2),
  ('3202025429','2025429','Tegar Kusuma','L','aktif',@rombel_xii_tkj_2),
  ('3202025430','2025430','Kania Hasanah','P','aktif',@rombel_xii_tkj_2),
  ('3202025431','2025431','Zaky Permata','L','aktif',@rombel_xii_tkj_2),
  ('3202025432','2025432','Omar Utama Permata','L','aktif',@rombel_xii_tkj_2),
  ('3202025433','2025433','Tika Rahmawati','P','aktif',@rombel_xii_tkj_2),
  ('3202025434','2025434','Yoga Aryo Wibowo','L','aktif',@rombel_xii_tkj_2),
  ('3202025435','2025435','Tegar Puspita Maulana','L','aktif',@rombel_xii_tkj_2),
  ('3202025436','2025436','Silvi Wahyu Saputra','P','aktif',@rombel_xii_tkj_2),
  ('3202025437','2025437','Vicky Hartono','L','aktif',@rombel_xii_tkj_2),
  ('3202025438','2025438','Candra Suryanto','L','aktif',@rombel_xii_tkj_2),
  ('3202025439','2025439','Indah Kusuma','P','aktif',@rombel_xii_tkj_2),
  ('3202025440','2025440','Hendra Nur Pratama','L','aktif',@rombel_xii_tkj_2);

-- Siswa XII RPL 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025441','2025441','Candra Setia Lestari','L','aktif',@rombel_xii_rpl_1),
  ('3202025442','2025442','Kartono Danu Wijaya','L','aktif',@rombel_xii_rpl_1),
  ('3202025443','2025443','Afifah Setia Setiawan','P','aktif',@rombel_xii_rpl_1),
  ('3202025444','2025444','Deni Kusuma Fauzan','L','aktif',@rombel_xii_rpl_1),
  ('3202025445','2025445','Rendi Laksono Kurniawan','L','aktif',@rombel_xii_rpl_1),
  ('3202025446','2025446','Dian Susanto','P','aktif',@rombel_xii_rpl_1),
  ('3202025447','2025447','Habib Suryanto','L','aktif',@rombel_xii_rpl_1),
  ('3202025448','2025448','Nugroho Laksono Ningrum','L','aktif',@rombel_xii_rpl_1),
  ('3202025449','2025449','Afifah Januar Fitriani','P','aktif',@rombel_xii_rpl_1),
  ('3202025450','2025450','Nanda Puspita Lestari','L','aktif',@rombel_xii_rpl_1),
  ('3202025451','2025451','Eko Tri Sulistyo','L','aktif',@rombel_xii_rpl_1),
  ('3202025452','2025452','Kania Putri Firmansyah','P','aktif',@rombel_xii_rpl_1),
  ('3202025453','2025453','Kevin Rahayu','L','aktif',@rombel_xii_rpl_1),
  ('3202025454','2025454','Bayu Prasetyo','L','aktif',@rombel_xii_rpl_1),
  ('3202025455','2025455','Hesti Anggraini','P','aktif',@rombel_xii_rpl_1),
  ('3202025456','2025456','Putra Sari Safitri','L','aktif',@rombel_xii_rpl_1),
  ('3202025457','2025457','Budi Nugraha','L','aktif',@rombel_xii_rpl_1),
  ('3202025458','2025458','Yuli Eka Hasanah','P','aktif',@rombel_xii_rpl_1),
  ('3202025459','2025459','Arif Santoso','L','aktif',@rombel_xii_rpl_1),
  ('3202025460','2025460','Hendra Sari Maulana','L','aktif',@rombel_xii_rpl_1),
  ('3202025461','2025461','Indah Agung Kurniawan','P','aktif',@rombel_xii_rpl_1),
  ('3202025462','2025462','Habib Wahyu Lestari','L','aktif',@rombel_xii_rpl_1),
  ('3202025463','2025463','Habib Laksono Hidayat','L','aktif',@rombel_xii_rpl_1),
  ('3202025464','2025464','Bella Fadli Hartono','P','aktif',@rombel_xii_rpl_1),
  ('3202025465','2025465','Maulana Anggraini','L','aktif',@rombel_xii_rpl_1),
  ('3202025466','2025466','Umar Wibowo','L','aktif',@rombel_xii_rpl_1),
  ('3202025467','2025467','Putri Ningrum','P','aktif',@rombel_xii_rpl_1),
  ('3202025468','2025468','Ivan Setia Santoso','L','aktif',@rombel_xii_rpl_1),
  ('3202025469','2025469','Nugroho Permata','L','aktif',@rombel_xii_rpl_1),
  ('3202025470','2025470','Aini Ramadhan','P','aktif',@rombel_xii_rpl_1),
  ('3202025471','2025471','Danang Danu Saputra','L','aktif',@rombel_xii_rpl_1),
  ('3202025472','2025472','Habib Agung Hasanah','L','aktif',@rombel_xii_rpl_1),
  ('3202025473','2025473','Qori Santoso','P','aktif',@rombel_xii_rpl_1),
  ('3202025474','2025474','Farid Imam Susanto','L','aktif',@rombel_xii_rpl_1);

-- Siswa XII MM 1
INSERT IGNORE INTO `siswa` (nisn,nis,nama_lengkap,jenis_kelamin,status,rombel_id_aktif) VALUES
  ('3202025475','2025475','Sigit Maulana','L','aktif',@rombel_xii_mm_1),
  ('3202025476','2025476','Zulfikar Pratama Maulana','L','aktif',@rombel_xii_mm_1),
  ('3202025477','2025477','Lina Sari Ningrum','P','aktif',@rombel_xii_mm_1),
  ('3202025478','2025478','Habib Tri Wijaya','L','aktif',@rombel_xii_mm_1),
  ('3202025479','2025479','Farid Ningrum','L','aktif',@rombel_xii_mm_1),
  ('3202025480','2025480','Mega Agung Suryanto','P','aktif',@rombel_xii_mm_1),
  ('3202025481','2025481','Wahyu Putri Wibowo','L','aktif',@rombel_xii_mm_1),
  ('3202025482','2025482','Lukas Wahyudi','L','aktif',@rombel_xii_mm_1),
  ('3202025483','2025483','Rahma Kurniawan','P','aktif',@rombel_xii_mm_1),
  ('3202025484','2025484','Candra Maulana','L','aktif',@rombel_xii_mm_1),
  ('3202025485','2025485','Arif Kusuma Rahmawati','L','aktif',@rombel_xii_mm_1),
  ('3202025486','2025486','Zahra Wijaya','P','aktif',@rombel_xii_mm_1),
  ('3202025487','2025487','Ivan Imam Prasetyo','L','aktif',@rombel_xii_mm_1),
  ('3202025488','2025488','Zaky Saputra','L','aktif',@rombel_xii_mm_1),
  ('3202025489','2025489','Lina Kurniawan','P','aktif',@rombel_xii_mm_1),
  ('3202025490','2025490','Pras Anggraini','L','aktif',@rombel_xii_mm_1),
  ('3202025491','2025491','Faisal Safitri','L','aktif',@rombel_xii_mm_1),
  ('3202025492','2025492','Wulan Anggraini','P','aktif',@rombel_xii_mm_1),
  ('3202025493','2025493','Eko Rahmawati','L','aktif',@rombel_xii_mm_1),
  ('3202025494','2025494','Adib Utama Setiawan','L','aktif',@rombel_xii_mm_1),
  ('3202025495','2025495','Jessica Safitri','P','aktif',@rombel_xii_mm_1),
  ('3202025496','2025496','Farid Fauzan','L','aktif',@rombel_xii_mm_1),
  ('3202025497','2025497','Nugroho Agung Permata','L','aktif',@rombel_xii_mm_1),
  ('3202025498','2025498','Yuli Imam Safitri','P','aktif',@rombel_xii_mm_1),
  ('3202025499','2025499','Nugroho Fauzan','L','aktif',@rombel_xii_mm_1),
  ('3202025500','2025500','Tegar Fadli Susanto','L','aktif',@rombel_xii_mm_1),
  ('3202025501','2025501','Bella Wijaya','P','aktif',@rombel_xii_mm_1),
  ('3202025502','2025502','Bagas Rahayu','L','aktif',@rombel_xii_mm_1),
  ('3202025503','2025503','Sandi Safitri','L','aktif',@rombel_xii_mm_1),
  ('3202025504','2025504','Olivia Purnomo','P','aktif',@rombel_xii_mm_1),
  ('3202025505','2025505','Joko Kusuma','L','aktif',@rombel_xii_mm_1),
  ('3202025506','2025506','Yoga Laksono Saputra','L','aktif',@rombel_xii_mm_1),
  ('3202025507','2025507','Ulfa Utama Ramadhan','P','aktif',@rombel_xii_mm_1),
  ('3202025508','2025508','Maulana Pratama Kurniawan','L','aktif',@rombel_xii_mm_1);

-- Referensi siswa per rombel (untuk presensi)
SET @first_rombel_x_tkj_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_x_tkj_1 LIMIT 1);
SET @first_rombel_x_tkj_2 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_x_tkj_2 LIMIT 1);
SET @first_rombel_x_rpl_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_x_rpl_1 LIMIT 1);
SET @first_rombel_x_mm_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_x_mm_1 LIMIT 1);
SET @first_rombel_xi_tkj_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xi_tkj_1 LIMIT 1);
SET @first_rombel_xi_tkj_2 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xi_tkj_2 LIMIT 1);
SET @first_rombel_xi_rpl_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xi_rpl_1 LIMIT 1);
SET @first_rombel_xi_mm_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xi_mm_1 LIMIT 1);
SET @first_rombel_xii_tkj_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xii_tkj_1 LIMIT 1);
SET @first_rombel_xii_tkj_2 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xii_tkj_2 LIMIT 1);
SET @first_rombel_xii_rpl_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xii_rpl_1 LIMIT 1);
SET @first_rombel_xii_mm_1 = (SELECT MIN(siswa_id) FROM siswa WHERE rombel_id_aktif=@rombel_xii_mm_1 LIMIT 1);

-- ============================================================
-- 4. SESI PRESENSI (Januari-Juni 2026)
-- ============================================================
-- Total sesi: 601
INSERT IGNORE INTO `presensi_sesi`
(session_uuid,mode_presensi,rombel_id,tahun_ajaran_id,semester,
 tanggal,status,ruang_pilihan,ruang_label_snapshot,opened_by_user_id,
 started_at,ended_at) VALUES
  ('sesi-00001','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-06','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-06 07:11:00','2026-01-06 8:64:00'),
  ('sesi-00002','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-06','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-01-06 07:04:00','2026-01-06 8:52:00'),
  ('sesi-00003','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-06','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-06 07:11:00','2026-01-06 8:64:00'),
  ('sesi-00004','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-01-06 08:04:00','2026-01-06 9:58:00'),
  ('sesi-00005','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-01-06 07:09:00','2026-01-06 8:60:00'),
  ('sesi-00006','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-07','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-01-07 08:13:00','2026-01-07 9:70:00'),
  ('sesi-00007','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-07','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-01-07 07:04:00','2026-01-07 8:54:00'),
  ('sesi-00008','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-07','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-07 08:14:00','2026-01-07 9:69:00'),
  ('sesi-00009','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-07','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-07 07:05:00','2026-01-07 8:62:00'),
  ('sesi-00010','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-07','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-07 08:01:00','2026-01-07 9:59:00'),
  ('sesi-00011','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-01-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-01-08 07:09:00','2026-01-08 8:56:00'),
  ('sesi-00012','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-08','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-08 07:11:00','2026-01-08 8:64:00'),
  ('sesi-00013','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-08','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-01-08 07:08:00','2026-01-08 8:56:00'),
  ('sesi-00014','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-08','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-08 08:04:00','2026-01-08 9:59:00'),
  ('sesi-00015','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-01-08 07:05:00','2026-01-08 8:59:00'),
  ('sesi-00016','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-08','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-08 07:05:00','2026-01-08 8:60:00'),
  ('sesi-00017','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-09','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-01-09 08:01:00','2026-01-09 9:59:00'),
  ('sesi-00018','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-09 07:01:00','2026-01-09 8:56:00'),
  ('sesi-00019','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-09','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-01-09 08:06:00','2026-01-09 9:63:00'),
  ('sesi-00020','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-01-09 07:15:00','2026-01-09 8:74:00'),
  ('sesi-00021','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-09','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-01-09 08:09:00','2026-01-09 9:61:00'),
  ('sesi-00022','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-01-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-01-12 08:09:00','2026-01-12 9:61:00'),
  ('sesi-00023','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-12','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-01-12 07:05:00','2026-01-12 8:57:00'),
  ('sesi-00024','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-01-12 08:06:00','2026-01-12 9:56:00'),
  ('sesi-00025','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-12 08:10:00','2026-01-12 9:66:00'),
  ('sesi-00026','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-12','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-01-12 08:12:00','2026-01-12 9:59:00'),
  ('sesi-00027','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-13','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-01-13 07:10:00','2026-01-13 8:58:00'),
  ('sesi-00028','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-13','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-01-13 08:14:00','2026-01-13 9:62:00'),
  ('sesi-00029','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-13','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-01-13 07:09:00','2026-01-13 8:60:00'),
  ('sesi-00030','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-01-13 08:07:00','2026-01-13 9:65:00'),
  ('sesi-00031','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-13 08:10:00','2026-01-13 9:58:00'),
  ('sesi-00032','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-14','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-01-14 08:14:00','2026-01-14 9:66:00'),
  ('sesi-00033','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-14','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-01-14 08:00:00','2026-01-14 9:46:00'),
  ('sesi-00034','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-14','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-01-14 08:07:00','2026-01-14 9:55:00'),
  ('sesi-00035','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-14','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-14 07:01:00','2026-01-14 8:50:00'),
  ('sesi-00036','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-14','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-01-14 08:09:00','2026-01-14 9:62:00'),
  ('sesi-00037','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-15','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-15 07:08:00','2026-01-15 8:64:00'),
  ('sesi-00038','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-15','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-01-15 08:11:00','2026-01-15 9:56:00'),
  ('sesi-00039','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-15','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-01-15 07:11:00','2026-01-15 8:64:00'),
  ('sesi-00040','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-15','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-01-15 08:14:00','2026-01-15 9:71:00'),
  ('sesi-00041','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-15','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-15 07:04:00','2026-01-15 8:50:00'),
  ('sesi-00042','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-16','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-16 08:11:00','2026-01-16 9:68:00'),
  ('sesi-00043','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-16 08:01:00','2026-01-16 9:46:00'),
  ('sesi-00044','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-01-16 08:14:00','2026-01-16 9:61:00'),
  ('sesi-00045','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-16','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-16 07:10:00','2026-01-16 8:69:00'),
  ('sesi-00046','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-01-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-01-19 07:12:00','2026-01-19 8:66:00'),
  ('sesi-00047','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-19','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-01-19 08:10:00','2026-01-19 9:63:00'),
  ('sesi-00048','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-01-19 08:09:00','2026-01-19 9:61:00'),
  ('sesi-00049','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-01-19 08:10:00','2026-01-19 9:65:00'),
  ('sesi-00050','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-19','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-19 08:09:00','2026-01-19 9:66:00'),
  ('sesi-00051','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-20','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-20 07:15:00','2026-01-20 8:64:00'),
  ('sesi-00052','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-20','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-20 07:01:00','2026-01-20 8:55:00'),
  ('sesi-00053','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-20','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-01-20 08:04:00','2026-01-20 9:62:00'),
  ('sesi-00054','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-20 07:03:00','2026-01-20 8:51:00'),
  ('sesi-00055','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-21','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-01-21 07:13:00','2026-01-21 8:69:00'),
  ('sesi-00056','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-21','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-21 08:01:00','2026-01-21 9:57:00'),
  ('sesi-00057','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-21','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-01-21 07:10:00','2026-01-21 8:65:00'),
  ('sesi-00058','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-21','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-21 08:10:00','2026-01-21 9:57:00'),
  ('sesi-00059','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-21','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-01-21 08:11:00','2026-01-21 9:66:00'),
  ('sesi-00060','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-01-22','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-22 08:15:00','2026-01-22 9:63:00'),
  ('sesi-00061','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-22','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-01-22 08:09:00','2026-01-22 9:57:00'),
  ('sesi-00062','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-22','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-01-22 08:09:00','2026-01-22 9:65:00'),
  ('sesi-00063','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-22','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-01-22 08:10:00','2026-01-22 9:62:00'),
  ('sesi-00064','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-22','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-01-22 08:09:00','2026-01-22 9:55:00'),
  ('sesi-00065','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-22','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-01-22 08:12:00','2026-01-22 9:70:00'),
  ('sesi-00066','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-23','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-01-23 07:09:00','2026-01-23 8:54:00'),
  ('sesi-00067','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-23 07:11:00','2026-01-23 8:70:00'),
  ('sesi-00068','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-23','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-01-23 08:15:00','2026-01-23 9:63:00'),
  ('sesi-00069','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-01-23 08:08:00','2026-01-23 9:55:00'),
  ('sesi-00070','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-23','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-01-23 07:07:00','2026-01-23 8:52:00'),
  ('sesi-00071','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-01-26','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-01-26 07:07:00','2026-01-26 8:52:00'),
  ('sesi-00072','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-26','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-01-26 08:15:00','2026-01-26 9:61:00'),
  ('sesi-00073','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-26','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-26 07:00:00','2026-01-26 8:53:00'),
  ('sesi-00074','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-01-26 07:13:00','2026-01-26 8:68:00'),
  ('sesi-00075','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-26','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-01-26 08:15:00','2026-01-26 9:70:00'),
  ('sesi-00076','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-27','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-01-27 08:10:00','2026-01-27 9:59:00'),
  ('sesi-00077','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-27','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-27 07:07:00','2026-01-27 8:60:00'),
  ('sesi-00078','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-27','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-01-27 07:05:00','2026-01-27 8:56:00'),
  ('sesi-00079','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-27 07:01:00','2026-01-27 8:59:00'),
  ('sesi-00080','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-01-27 08:05:00','2026-01-27 9:64:00'),
  ('sesi-00081','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-01-28','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-01-28 08:01:00','2026-01-28 9:46:00'),
  ('sesi-00082','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-28','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-01-28 07:10:00','2026-01-28 8:59:00'),
  ('sesi-00083','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-28','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-28 08:04:00','2026-01-28 9:62:00'),
  ('sesi-00084','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-01-28','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-28 08:06:00','2026-01-28 9:63:00'),
  ('sesi-00085','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-28','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-01-28 07:14:00','2026-01-28 8:69:00'),
  ('sesi-00086','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-01-29','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-01-29 07:00:00','2026-01-29 8:56:00'),
  ('sesi-00087','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-01-29','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-29 08:06:00','2026-01-29 9:53:00'),
  ('sesi-00088','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-01-29','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-01-29 08:13:00','2026-01-29 9:66:00'),
  ('sesi-00089','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-01-29','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-01-29 08:03:00','2026-01-29 9:50:00'),
  ('sesi-00090','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-29','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-01-29 08:10:00','2026-01-29 9:69:00'),
  ('sesi-00091','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-01-29','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-01-29 08:12:00','2026-01-29 9:60:00'),
  ('sesi-00092','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-01-30','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-30 08:10:00','2026-01-30 9:59:00'),
  ('sesi-00093','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-01-30','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-30 07:08:00','2026-01-30 8:63:00'),
  ('sesi-00094','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-01-30','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-01-30 07:01:00','2026-01-30 8:56:00'),
  ('sesi-00095','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-01-30','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-01-30 08:05:00','2026-01-30 9:56:00'),
  ('sesi-00096','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-01-30','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-01-30 08:03:00','2026-01-30 9:58:00'),
  ('sesi-00097','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-02-02 08:11:00','2026-02-02 9:65:00'),
  ('sesi-00098','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-02','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-02 07:15:00','2026-02-02 8:62:00'),
  ('sesi-00099','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-02 08:13:00','2026-02-02 9:69:00'),
  ('sesi-00100','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-02','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-02 08:06:00','2026-02-02 9:63:00'),
  ('sesi-00101','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-02','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-02-02 07:14:00','2026-02-02 8:67:00'),
  ('sesi-00102','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-03','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-03 07:03:00','2026-02-03 8:48:00'),
  ('sesi-00103','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-03','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-02-03 07:04:00','2026-02-03 8:51:00'),
  ('sesi-00104','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-03','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-02-03 08:03:00','2026-02-03 9:58:00'),
  ('sesi-00105','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-03','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-02-03 08:02:00','2026-02-03 9:61:00'),
  ('sesi-00106','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-03','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-03 07:14:00','2026-02-03 8:61:00'),
  ('sesi-00107','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-04','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-02-04 08:01:00','2026-02-04 9:54:00'),
  ('sesi-00108','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-04','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-02-04 08:00:00','2026-02-04 9:51:00'),
  ('sesi-00109','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-04','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-04 07:06:00','2026-02-04 8:60:00'),
  ('sesi-00110','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-04','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-02-04 08:11:00','2026-02-04 9:67:00'),
  ('sesi-00111','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-04','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-02-04 07:02:00','2026-02-04 8:61:00'),
  ('sesi-00112','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-05 08:13:00','2026-02-05 9:60:00'),
  ('sesi-00113','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-05 08:11:00','2026-02-05 9:70:00'),
  ('sesi-00114','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-05','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-02-05 08:12:00','2026-02-05 9:58:00'),
  ('sesi-00115','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-05 07:11:00','2026-02-05 8:57:00'),
  ('sesi-00116','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-02-05 08:04:00','2026-02-05 9:60:00'),
  ('sesi-00117','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-02-05 07:00:00','2026-02-05 8:49:00'),
  ('sesi-00118','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-06','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-02-06 08:12:00','2026-02-06 9:70:00'),
  ('sesi-00119','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-02-06 08:11:00','2026-02-06 9:58:00'),
  ('sesi-00120','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-06 07:01:00','2026-02-06 8:58:00'),
  ('sesi-00121','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-06 07:07:00','2026-02-06 8:55:00'),
  ('sesi-00122','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-02-06 07:14:00','2026-02-06 8:68:00'),
  ('sesi-00123','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-02-09 07:07:00','2026-02-09 8:63:00'),
  ('sesi-00124','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-09 07:01:00','2026-02-09 8:48:00'),
  ('sesi-00125','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-09','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-02-09 08:07:00','2026-02-09 9:65:00'),
  ('sesi-00126','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-09','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-09 08:10:00','2026-02-09 9:58:00'),
  ('sesi-00127','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-10','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-10 07:07:00','2026-02-10 8:58:00'),
  ('sesi-00128','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-10','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-02-10 07:05:00','2026-02-10 8:60:00'),
  ('sesi-00129','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-10','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-10 08:01:00','2026-02-10 9:51:00'),
  ('sesi-00130','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-10','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-02-10 08:10:00','2026-02-10 9:66:00'),
  ('sesi-00131','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-10','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-02-10 07:09:00','2026-02-10 8:60:00'),
  ('sesi-00132','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-11','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-02-11 08:07:00','2026-02-11 9:65:00'),
  ('sesi-00133','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-11','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-02-11 07:14:00','2026-02-11 8:73:00'),
  ('sesi-00134','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-11','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-11 08:13:00','2026-02-11 9:66:00'),
  ('sesi-00135','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-11','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-11 08:07:00','2026-02-11 9:56:00'),
  ('sesi-00136','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-11','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-02-11 07:14:00','2026-02-11 8:72:00'),
  ('sesi-00137','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-02-12 07:01:00','2026-02-12 8:50:00'),
  ('sesi-00138','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-12 07:02:00','2026-02-12 8:50:00'),
  ('sesi-00139','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-12','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-02-12 07:15:00','2026-02-12 8:63:00'),
  ('sesi-00140','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-12 08:09:00','2026-02-12 9:68:00'),
  ('sesi-00141','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-12 07:15:00','2026-02-12 8:74:00'),
  ('sesi-00142','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-13','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-13 07:12:00','2026-02-13 8:71:00'),
  ('sesi-00143','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-02-13 08:09:00','2026-02-13 9:60:00'),
  ('sesi-00144','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-13 08:09:00','2026-02-13 9:58:00'),
  ('sesi-00145','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-02-13 08:14:00','2026-02-13 9:60:00'),
  ('sesi-00146','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-02-13 08:10:00','2026-02-13 9:69:00'),
  ('sesi-00147','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-02-16 08:13:00','2026-02-16 9:58:00'),
  ('sesi-00148','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-16','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-16 07:04:00','2026-02-16 8:49:00'),
  ('sesi-00149','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-02-16 08:09:00','2026-02-16 9:56:00'),
  ('sesi-00150','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-16','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-02-16 07:12:00','2026-02-16 8:66:00'),
  ('sesi-00151','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-16','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-16 08:10:00','2026-02-16 9:59:00'),
  ('sesi-00152','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-17','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-02-17 08:15:00','2026-02-17 9:67:00'),
  ('sesi-00153','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-17','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-02-17 08:05:00','2026-02-17 9:52:00'),
  ('sesi-00154','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-17','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-17 08:05:00','2026-02-17 9:64:00'),
  ('sesi-00155','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-17','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-17 07:01:00','2026-02-17 8:59:00'),
  ('sesi-00156','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-17','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-02-17 07:00:00','2026-02-17 8:51:00'),
  ('sesi-00157','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-18','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-18 07:02:00','2026-02-18 8:58:00'),
  ('sesi-00158','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-18','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-02-18 07:14:00','2026-02-18 8:64:00'),
  ('sesi-00159','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-18','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-02-18 08:15:00','2026-02-18 9:60:00'),
  ('sesi-00160','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-18','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-02-18 07:00:00','2026-02-18 8:53:00'),
  ('sesi-00161','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-02-19 08:00:00','2026-02-19 9:53:00'),
  ('sesi-00162','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-19 08:05:00','2026-02-19 9:51:00'),
  ('sesi-00163','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-19','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-19 07:07:00','2026-02-19 8:55:00'),
  ('sesi-00164','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-02-19 08:11:00','2026-02-19 9:60:00'),
  ('sesi-00165','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-02-19 07:11:00','2026-02-19 8:62:00'),
  ('sesi-00166','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-19 07:07:00','2026-02-19 8:56:00'),
  ('sesi-00167','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-20','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-02-20 07:01:00','2026-02-20 8:47:00'),
  ('sesi-00168','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-20 08:15:00','2026-02-20 9:60:00'),
  ('sesi-00169','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-20 07:02:00','2026-02-20 8:54:00'),
  ('sesi-00170','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-02-20 08:03:00','2026-02-20 9:62:00'),
  ('sesi-00171','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-20 07:07:00','2026-02-20 8:55:00'),
  ('sesi-00172','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-02-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-02-23 08:08:00','2026-02-23 9:53:00'),
  ('sesi-00173','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-23','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-02-23 08:01:00','2026-02-23 9:48:00'),
  ('sesi-00174','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-02-23 08:00:00','2026-02-23 9:48:00'),
  ('sesi-00175','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-23','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-02-23 08:02:00','2026-02-23 9:51:00'),
  ('sesi-00176','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-23','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-23 07:12:00','2026-02-23 8:67:00'),
  ('sesi-00177','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-24','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-24 08:12:00','2026-02-24 9:69:00'),
  ('sesi-00178','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-24','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-02-24 07:11:00','2026-02-24 8:56:00'),
  ('sesi-00179','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-24','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-02-24 07:02:00','2026-02-24 8:52:00'),
  ('sesi-00180','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-24','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-24 08:10:00','2026-02-24 9:55:00'),
  ('sesi-00181','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-24','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-02-24 08:15:00','2026-02-24 9:63:00'),
  ('sesi-00182','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-02-25','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-25 08:13:00','2026-02-25 9:60:00'),
  ('sesi-00183','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-25','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-25 08:02:00','2026-02-25 9:59:00'),
  ('sesi-00184','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-25','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-25 07:02:00','2026-02-25 8:48:00'),
  ('sesi-00185','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-02-25','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-02-25 08:04:00','2026-02-25 9:60:00'),
  ('sesi-00186','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-25','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-02-25 08:03:00','2026-02-25 9:49:00'),
  ('sesi-00187','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-02-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-02-26 08:08:00','2026-02-26 9:54:00'),
  ('sesi-00188','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-02-26','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-02-26 07:13:00','2026-02-26 8:65:00'),
  ('sesi-00189','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-02-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-02-26 08:03:00','2026-02-26 9:48:00'),
  ('sesi-00190','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-26','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-02-26 07:10:00','2026-02-26 8:68:00'),
  ('sesi-00191','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-02-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-02-26 08:13:00','2026-02-26 9:64:00'),
  ('sesi-00192','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-02-27','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-02-27 07:05:00','2026-02-27 8:60:00'),
  ('sesi-00193','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-02-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-02-27 07:08:00','2026-02-27 8:57:00'),
  ('sesi-00194','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-02-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-02-27 07:02:00','2026-02-27 8:49:00'),
  ('sesi-00195','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-02-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-02-27 08:09:00','2026-02-27 9:61:00'),
  ('sesi-00196','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-02-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-02-27 08:08:00','2026-02-27 9:56:00'),
  ('sesi-00197','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-02 08:06:00','2026-03-02 9:58:00'),
  ('sesi-00198','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-02','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-03-02 08:00:00','2026-03-02 9:51:00'),
  ('sesi-00199','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-02 08:10:00','2026-03-02 9:62:00'),
  ('sesi-00200','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-02','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-03-02 07:09:00','2026-03-02 8:59:00');

INSERT IGNORE INTO `presensi_sesi`
(session_uuid,mode_presensi,rombel_id,tahun_ajaran_id,semester,
 tanggal,status,ruang_pilihan,ruang_label_snapshot,opened_by_user_id,
 started_at,ended_at) VALUES
  ('sesi-00201','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-02','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-03-02 07:15:00','2026-03-02 8:65:00'),
  ('sesi-00202','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-03','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-03-03 08:10:00','2026-03-03 9:59:00'),
  ('sesi-00203','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-03','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-03 08:07:00','2026-03-03 9:57:00'),
  ('sesi-00204','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-03','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-03 08:11:00','2026-03-03 9:57:00'),
  ('sesi-00205','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-03','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-03 07:05:00','2026-03-03 8:60:00'),
  ('sesi-00206','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-03','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-03-03 07:14:00','2026-03-03 8:70:00'),
  ('sesi-00207','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-04','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-03-04 08:02:00','2026-03-04 9:60:00'),
  ('sesi-00208','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-04','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-04 08:15:00','2026-03-04 9:62:00'),
  ('sesi-00209','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-04','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-04 07:08:00','2026-03-04 8:63:00'),
  ('sesi-00210','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-04','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-04 08:12:00','2026-03-04 9:58:00'),
  ('sesi-00211','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-04','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-04 08:12:00','2026-03-04 9:65:00'),
  ('sesi-00212','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-03-05 08:01:00','2026-03-05 9:58:00'),
  ('sesi-00213','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-05 07:03:00','2026-03-05 8:60:00'),
  ('sesi-00214','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-05','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-03-05 08:05:00','2026-03-05 9:60:00'),
  ('sesi-00215','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-03-05 08:10:00','2026-03-05 9:67:00'),
  ('sesi-00216','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-03-05 07:03:00','2026-03-05 8:52:00'),
  ('sesi-00217','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-03-05 07:14:00','2026-03-05 8:64:00'),
  ('sesi-00218','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-06','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-06 07:11:00','2026-03-06 8:56:00'),
  ('sesi-00219','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-06 08:13:00','2026-03-06 9:72:00'),
  ('sesi-00220','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-06 07:04:00','2026-03-06 8:54:00'),
  ('sesi-00221','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-03-06 08:06:00','2026-03-06 9:59:00'),
  ('sesi-00222','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-06 08:03:00','2026-03-06 9:55:00'),
  ('sesi-00223','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-03-09 08:10:00','2026-03-09 9:56:00'),
  ('sesi-00224','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-09','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-09 07:00:00','2026-03-09 8:58:00'),
  ('sesi-00225','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-09 07:05:00','2026-03-09 8:64:00'),
  ('sesi-00226','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-09','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-09 07:05:00','2026-03-09 8:58:00'),
  ('sesi-00227','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-09','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-03-09 08:14:00','2026-03-09 9:62:00'),
  ('sesi-00228','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-10','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-10 07:05:00','2026-03-10 8:60:00'),
  ('sesi-00229','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-10','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-03-10 08:00:00','2026-03-10 9:56:00'),
  ('sesi-00230','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-10','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-03-10 07:14:00','2026-03-10 8:68:00'),
  ('sesi-00231','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-10','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-03-10 07:06:00','2026-03-10 8:54:00'),
  ('sesi-00232','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-10','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-10 07:03:00','2026-03-10 8:60:00'),
  ('sesi-00233','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-11','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-03-11 07:11:00','2026-03-11 8:61:00'),
  ('sesi-00234','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-11','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-03-11 07:08:00','2026-03-11 8:63:00'),
  ('sesi-00235','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-11','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-11 08:12:00','2026-03-11 9:66:00'),
  ('sesi-00236','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-11','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-03-11 07:11:00','2026-03-11 8:61:00'),
  ('sesi-00237','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-11','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-03-11 07:09:00','2026-03-11 8:68:00'),
  ('sesi-00238','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-12 07:04:00','2026-03-12 8:54:00'),
  ('sesi-00239','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-12 08:03:00','2026-03-12 9:50:00'),
  ('sesi-00240','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-12','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-03-12 07:12:00','2026-03-12 8:63:00'),
  ('sesi-00241','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-12 08:13:00','2026-03-12 9:60:00'),
  ('sesi-00242','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-03-12 07:05:00','2026-03-12 8:57:00'),
  ('sesi-00243','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-03-12 07:10:00','2026-03-12 8:68:00'),
  ('sesi-00244','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-13','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-03-13 07:11:00','2026-03-13 8:56:00'),
  ('sesi-00245','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-13 07:12:00','2026-03-13 8:65:00'),
  ('sesi-00246','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-13 08:13:00','2026-03-13 9:68:00'),
  ('sesi-00247','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-13 08:15:00','2026-03-13 9:62:00'),
  ('sesi-00248','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-03-13 07:07:00','2026-03-13 8:56:00'),
  ('sesi-00249','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-16','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-03-16 08:05:00','2026-03-16 9:62:00'),
  ('sesi-00250','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-16 08:03:00','2026-03-16 9:57:00'),
  ('sesi-00251','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-16','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-16 08:01:00','2026-03-16 9:58:00'),
  ('sesi-00252','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-16','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-16 07:13:00','2026-03-16 8:59:00'),
  ('sesi-00253','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-17','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-17 07:09:00','2026-03-17 8:67:00'),
  ('sesi-00254','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-17','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-03-17 08:08:00','2026-03-17 9:58:00'),
  ('sesi-00255','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-17','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-17 07:14:00','2026-03-17 8:72:00'),
  ('sesi-00256','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-17','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-03-17 07:06:00','2026-03-17 8:63:00'),
  ('sesi-00257','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-17','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-03-17 08:13:00','2026-03-17 9:60:00'),
  ('sesi-00258','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-18','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-03-18 07:06:00','2026-03-18 8:63:00'),
  ('sesi-00259','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-18','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-03-18 08:08:00','2026-03-18 9:62:00'),
  ('sesi-00260','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-18','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-18 08:09:00','2026-03-18 9:58:00'),
  ('sesi-00261','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-18','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-18 07:04:00','2026-03-18 8:61:00'),
  ('sesi-00262','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-18','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-18 07:08:00','2026-03-18 8:66:00'),
  ('sesi-00263','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-03-19 07:07:00','2026-03-19 8:54:00'),
  ('sesi-00264','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-19 07:12:00','2026-03-19 8:64:00'),
  ('sesi-00265','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-19','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-03-19 08:13:00','2026-03-19 9:64:00'),
  ('sesi-00266','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-19 07:12:00','2026-03-19 8:65:00'),
  ('sesi-00267','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-19 08:14:00','2026-03-19 9:66:00'),
  ('sesi-00268','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-19 07:02:00','2026-03-19 8:58:00'),
  ('sesi-00269','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-20','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-03-20 08:02:00','2026-03-20 9:59:00'),
  ('sesi-00270','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-20 07:13:00','2026-03-20 8:71:00'),
  ('sesi-00271','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-03-20 08:10:00','2026-03-20 9:68:00'),
  ('sesi-00272','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-03-20 07:15:00','2026-03-20 8:72:00'),
  ('sesi-00273','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-03-20 07:01:00','2026-03-20 8:47:00'),
  ('sesi-00274','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-23 08:00:00','2026-03-23 9:46:00'),
  ('sesi-00275','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-23','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-03-23 07:14:00','2026-03-23 8:66:00'),
  ('sesi-00276','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-23','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-03-23 07:04:00','2026-03-23 8:63:00'),
  ('sesi-00277','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-23','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-23 07:08:00','2026-03-23 8:54:00'),
  ('sesi-00278','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-24','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-03-24 08:02:00','2026-03-24 9:52:00'),
  ('sesi-00279','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-24','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-03-24 07:01:00','2026-03-24 8:52:00'),
  ('sesi-00280','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-24','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-24 07:13:00','2026-03-24 8:68:00'),
  ('sesi-00281','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-24','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-03-24 07:00:00','2026-03-24 8:48:00'),
  ('sesi-00282','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-24','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-03-24 07:07:00','2026-03-24 8:60:00'),
  ('sesi-00283','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-25','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-25 07:00:00','2026-03-25 8:56:00'),
  ('sesi-00284','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-25','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-03-25 07:13:00','2026-03-25 8:69:00'),
  ('sesi-00285','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-25','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-03-25 07:07:00','2026-03-25 8:58:00'),
  ('sesi-00286','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-25','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-03-25 07:03:00','2026-03-25 8:53:00'),
  ('sesi-00287','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-25','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-25 08:04:00','2026-03-25 9:55:00'),
  ('sesi-00288','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-26','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-26 07:04:00','2026-03-26 8:50:00'),
  ('sesi-00289','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-26 07:05:00','2026-03-26 8:57:00'),
  ('sesi-00290','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-26','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-03-26 07:04:00','2026-03-26 8:63:00'),
  ('sesi-00291','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-03-26 08:06:00','2026-03-26 9:52:00'),
  ('sesi-00292','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-26','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-03-26 07:03:00','2026-03-26 8:57:00'),
  ('sesi-00293','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-03-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-26 08:13:00','2026-03-26 9:63:00'),
  ('sesi-00294','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-27','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-27 07:08:00','2026-03-27 8:63:00'),
  ('sesi-00295','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-27 08:00:00','2026-03-27 9:58:00'),
  ('sesi-00296','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-03-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-03-27 08:06:00','2026-03-27 9:59:00'),
  ('sesi-00297','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-27 07:12:00','2026-03-27 8:61:00'),
  ('sesi-00298','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-03-27 07:15:00','2026-03-27 8:66:00'),
  ('sesi-00299','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-03-30','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-03-30 08:02:00','2026-03-30 9:55:00'),
  ('sesi-00300','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-03-30','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-03-30 07:11:00','2026-03-30 8:70:00'),
  ('sesi-00301','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-03-30','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-03-30 08:13:00','2026-03-30 9:63:00'),
  ('sesi-00302','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-03-30','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-30 07:15:00','2026-03-30 8:72:00'),
  ('sesi-00303','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-03-30','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-30 07:00:00','2026-03-30 8:49:00'),
  ('sesi-00304','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-03-31','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-03-31 07:12:00','2026-03-31 8:65:00'),
  ('sesi-00305','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-03-31','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-03-31 08:13:00','2026-03-31 9:69:00'),
  ('sesi-00306','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-03-31','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-03-31 07:08:00','2026-03-31 8:54:00'),
  ('sesi-00307','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-03-31','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-03-31 07:04:00','2026-03-31 8:57:00'),
  ('sesi-00308','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-03-31','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-03-31 07:09:00','2026-03-31 8:65:00'),
  ('sesi-00309','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-01','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-01 07:01:00','2026-04-01 8:49:00'),
  ('sesi-00310','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-01','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-01 08:03:00','2026-04-01 9:55:00'),
  ('sesi-00311','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-01','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-04-01 07:09:00','2026-04-01 8:64:00'),
  ('sesi-00312','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-01','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-01 07:03:00','2026-04-01 8:48:00'),
  ('sesi-00313','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-01','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-04-01 07:05:00','2026-04-01 8:57:00'),
  ('sesi-00314','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-04-02 08:05:00','2026-04-02 9:55:00'),
  ('sesi-00315','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-02','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-04-02 08:03:00','2026-04-02 9:60:00'),
  ('sesi-00316','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-02','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-02 08:13:00','2026-04-02 9:62:00'),
  ('sesi-00317','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-02','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-04-02 08:02:00','2026-04-02 9:54:00'),
  ('sesi-00318','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-04-02 08:01:00','2026-04-02 9:53:00'),
  ('sesi-00319','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-02','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-02 07:11:00','2026-04-02 8:58:00'),
  ('sesi-00320','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-03','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-04-03 07:03:00','2026-04-03 8:51:00'),
  ('sesi-00321','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-03','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-04-03 07:01:00','2026-04-03 8:59:00'),
  ('sesi-00322','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-03','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-03 07:01:00','2026-04-03 8:53:00'),
  ('sesi-00323','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-03','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-03 07:05:00','2026-04-03 8:64:00'),
  ('sesi-00324','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-03','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-04-03 07:13:00','2026-04-03 8:61:00'),
  ('sesi-00325','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-06 08:10:00','2026-04-06 9:59:00'),
  ('sesi-00326','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-04-06 08:03:00','2026-04-06 9:56:00'),
  ('sesi-00327','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-04-06 07:05:00','2026-04-06 8:53:00'),
  ('sesi-00328','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-06','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-04-06 07:12:00','2026-04-06 8:58:00'),
  ('sesi-00329','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-06','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-06 08:09:00','2026-04-06 9:59:00'),
  ('sesi-00330','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-07','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-07 08:00:00','2026-04-07 9:50:00'),
  ('sesi-00331','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-07','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-07 08:07:00','2026-04-07 9:59:00'),
  ('sesi-00332','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-07','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-04-07 08:06:00','2026-04-07 9:62:00'),
  ('sesi-00333','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-07','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-04-07 07:04:00','2026-04-07 8:49:00'),
  ('sesi-00334','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-07','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-07 07:07:00','2026-04-07 8:60:00'),
  ('sesi-00335','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-08','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-08 07:10:00','2026-04-08 8:55:00'),
  ('sesi-00336','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-08 08:09:00','2026-04-08 9:55:00'),
  ('sesi-00337','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-08','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-08 07:13:00','2026-04-08 8:65:00'),
  ('sesi-00338','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-08','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-04-08 07:08:00','2026-04-08 8:54:00'),
  ('sesi-00339','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-09 08:11:00','2026-04-09 9:63:00'),
  ('sesi-00340','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-09','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-04-09 07:03:00','2026-04-09 8:56:00'),
  ('sesi-00341','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-09','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-04-09 08:02:00','2026-04-09 9:56:00'),
  ('sesi-00342','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-09','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-04-09 08:04:00','2026-04-09 9:52:00'),
  ('sesi-00343','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-04-09 08:12:00','2026-04-09 9:68:00'),
  ('sesi-00344','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-09','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-09 08:10:00','2026-04-09 9:62:00'),
  ('sesi-00345','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-10','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-10 07:06:00','2026-04-10 8:53:00'),
  ('sesi-00346','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-10','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-10 07:04:00','2026-04-10 8:50:00'),
  ('sesi-00347','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-10','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-04-10 08:10:00','2026-04-10 9:61:00'),
  ('sesi-00348','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-10','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-10 08:06:00','2026-04-10 9:58:00'),
  ('sesi-00349','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-10','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-04-10 08:03:00','2026-04-10 9:49:00'),
  ('sesi-00350','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-13 08:01:00','2026-04-13 9:49:00'),
  ('sesi-00351','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-13 08:04:00','2026-04-13 9:50:00'),
  ('sesi-00352','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-13 08:12:00','2026-04-13 9:65:00'),
  ('sesi-00353','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-13','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-04-13 07:00:00','2026-04-13 8:51:00'),
  ('sesi-00354','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-14','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-14 07:03:00','2026-04-14 8:55:00'),
  ('sesi-00355','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-14','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-04-14 07:03:00','2026-04-14 8:48:00'),
  ('sesi-00356','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-14','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-04-14 07:04:00','2026-04-14 8:52:00'),
  ('sesi-00357','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-14','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-04-14 08:02:00','2026-04-14 9:56:00'),
  ('sesi-00358','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-14','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-14 07:00:00','2026-04-14 8:46:00'),
  ('sesi-00359','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-15','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-04-15 08:04:00','2026-04-15 9:50:00'),
  ('sesi-00360','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-15','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-04-15 08:03:00','2026-04-15 9:48:00'),
  ('sesi-00361','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-15','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-15 07:05:00','2026-04-15 8:64:00'),
  ('sesi-00362','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-15','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-04-15 08:15:00','2026-04-15 9:60:00'),
  ('sesi-00363','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-15','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-04-15 08:05:00','2026-04-15 9:55:00'),
  ('sesi-00364','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-16 07:08:00','2026-04-16 8:57:00'),
  ('sesi-00365','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-16','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-16 07:01:00','2026-04-16 8:55:00'),
  ('sesi-00366','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-16','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-04-16 07:09:00','2026-04-16 8:61:00'),
  ('sesi-00367','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-16','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-16 08:01:00','2026-04-16 9:47:00'),
  ('sesi-00368','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-04-16 07:13:00','2026-04-16 8:61:00'),
  ('sesi-00369','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-16','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-04-16 07:00:00','2026-04-16 8:51:00'),
  ('sesi-00370','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-17','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-04-17 08:15:00','2026-04-17 9:68:00'),
  ('sesi-00371','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-17','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-17 08:10:00','2026-04-17 9:61:00'),
  ('sesi-00372','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-17','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-17 07:10:00','2026-04-17 8:64:00'),
  ('sesi-00373','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-17','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-17 08:01:00','2026-04-17 9:58:00'),
  ('sesi-00374','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-17','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-04-17 08:07:00','2026-04-17 9:54:00'),
  ('sesi-00375','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-04-20 07:08:00','2026-04-20 8:61:00'),
  ('sesi-00376','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-20 07:07:00','2026-04-20 8:61:00'),
  ('sesi-00377','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-20 08:11:00','2026-04-20 9:70:00'),
  ('sesi-00378','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-20','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-20 07:05:00','2026-04-20 8:53:00'),
  ('sesi-00379','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-20','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-20 08:00:00','2026-04-20 9:56:00'),
  ('sesi-00380','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-21','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-04-21 07:06:00','2026-04-21 8:64:00'),
  ('sesi-00381','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-21','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-21 08:09:00','2026-04-21 9:56:00'),
  ('sesi-00382','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-21','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-04-21 07:01:00','2026-04-21 8:49:00'),
  ('sesi-00383','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-21','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-04-21 07:15:00','2026-04-21 8:60:00'),
  ('sesi-00384','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-21','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-04-21 07:04:00','2026-04-21 8:54:00'),
  ('sesi-00385','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-22','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-04-22 08:01:00','2026-04-22 9:46:00'),
  ('sesi-00386','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-22','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-22 07:03:00','2026-04-22 8:61:00'),
  ('sesi-00387','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-22','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-22 08:02:00','2026-04-22 9:52:00'),
  ('sesi-00388','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-22','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-22 08:03:00','2026-04-22 9:53:00'),
  ('sesi-00389','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-22','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-04-22 07:05:00','2026-04-22 8:61:00'),
  ('sesi-00390','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-23 08:10:00','2026-04-23 9:57:00'),
  ('sesi-00391','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-23','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-04-23 08:07:00','2026-04-23 9:62:00'),
  ('sesi-00392','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-23','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-23 07:12:00','2026-04-23 8:61:00'),
  ('sesi-00393','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-23','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-23 08:04:00','2026-04-23 9:51:00'),
  ('sesi-00394','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-23','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-23 08:01:00','2026-04-23 9:48:00'),
  ('sesi-00395','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-23','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-04-23 07:03:00','2026-04-23 8:62:00'),
  ('sesi-00396','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-24','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-04-24 08:02:00','2026-04-24 9:50:00'),
  ('sesi-00397','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-24','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-04-24 08:05:00','2026-04-24 9:60:00'),
  ('sesi-00398','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-24','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-04-24 07:10:00','2026-04-24 8:62:00'),
  ('sesi-00399','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-24','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-04-24 07:11:00','2026-04-24 8:60:00'),
  ('sesi-00400','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-27 07:01:00','2026-04-27 8:52:00');

INSERT IGNORE INTO `presensi_sesi`
(session_uuid,mode_presensi,rombel_id,tahun_ajaran_id,semester,
 tanggal,status,ruang_pilihan,ruang_label_snapshot,opened_by_user_id,
 started_at,ended_at) VALUES
  ('sesi-00401','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-04-27 08:05:00','2026-04-27 9:64:00'),
  ('sesi-00402','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-04-27 08:11:00','2026-04-27 9:64:00'),
  ('sesi-00403','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-27','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-27 08:07:00','2026-04-27 9:54:00'),
  ('sesi-00404','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-27','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-04-27 07:09:00','2026-04-27 8:54:00'),
  ('sesi-00405','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-04-28','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-04-28 07:02:00','2026-04-28 8:52:00'),
  ('sesi-00406','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-04-28','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-28 08:05:00','2026-04-28 9:61:00'),
  ('sesi-00407','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-28','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-04-28 07:10:00','2026-04-28 8:64:00'),
  ('sesi-00408','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-28','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-04-28 08:00:00','2026-04-28 9:51:00'),
  ('sesi-00409','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-04-28','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-28 07:13:00','2026-04-28 8:60:00'),
  ('sesi-00410','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-04-29','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-04-29 08:06:00','2026-04-29 9:54:00'),
  ('sesi-00411','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-04-29','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-04-29 08:09:00','2026-04-29 9:58:00'),
  ('sesi-00412','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-04-29','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-04-29 07:12:00','2026-04-29 8:66:00'),
  ('sesi-00413','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-04-29','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-29 08:04:00','2026-04-29 9:49:00'),
  ('sesi-00414','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-29','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-29 08:02:00','2026-04-29 9:51:00'),
  ('sesi-00415','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-04-30','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-04-30 08:06:00','2026-04-30 9:52:00'),
  ('sesi-00416','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-04-30','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-04-30 08:02:00','2026-04-30 9:54:00'),
  ('sesi-00417','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-04-30','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-04-30 08:12:00','2026-04-30 9:64:00'),
  ('sesi-00418','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-04-30','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-04-30 08:02:00','2026-04-30 9:57:00'),
  ('sesi-00419','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-04-30','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-04-30 07:11:00','2026-04-30 8:70:00'),
  ('sesi-00420','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-01','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-01 07:14:00','2026-05-01 8:59:00'),
  ('sesi-00421','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-01','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-01 08:08:00','2026-05-01 9:56:00'),
  ('sesi-00422','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-01','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-05-01 07:04:00','2026-05-01 8:61:00'),
  ('sesi-00423','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-01','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-01 07:02:00','2026-05-01 8:57:00'),
  ('sesi-00424','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-01','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-05-01 08:07:00','2026-05-01 9:60:00'),
  ('sesi-00425','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-04','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-05-04 08:13:00','2026-05-04 9:66:00'),
  ('sesi-00426','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-04','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-05-04 08:07:00','2026-05-04 9:59:00'),
  ('sesi-00427','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-04','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-05-04 08:01:00','2026-05-04 9:54:00'),
  ('sesi-00428','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-04','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-04 07:03:00','2026-05-04 8:60:00'),
  ('sesi-00429','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-04','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-04 07:06:00','2026-05-04 8:63:00'),
  ('sesi-00430','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-05','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-05 07:13:00','2026-05-05 8:59:00'),
  ('sesi-00431','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-05','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-05-05 08:06:00','2026-05-05 9:64:00'),
  ('sesi-00432','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-05','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-05 08:10:00','2026-05-05 9:69:00'),
  ('sesi-00433','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-05-05 07:02:00','2026-05-05 8:53:00'),
  ('sesi-00434','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-05','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-05 08:08:00','2026-05-05 9:61:00'),
  ('sesi-00435','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-06 07:13:00','2026-05-06 8:59:00'),
  ('sesi-00436','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-06','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-06 07:03:00','2026-05-06 8:62:00'),
  ('sesi-00437','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-06','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-05-06 07:09:00','2026-05-06 8:67:00'),
  ('sesi-00438','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-06','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-06 08:13:00','2026-05-06 9:62:00'),
  ('sesi-00439','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-06','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-05-06 08:15:00','2026-05-06 9:60:00'),
  ('sesi-00440','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-07','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-05-07 08:04:00','2026-05-07 9:58:00'),
  ('sesi-00441','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-07','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-05-07 08:01:00','2026-05-07 9:52:00'),
  ('sesi-00442','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-07','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-07 08:07:00','2026-05-07 9:52:00'),
  ('sesi-00443','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-07','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-05-07 08:11:00','2026-05-07 9:56:00'),
  ('sesi-00444','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-07','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-05-07 08:09:00','2026-05-07 9:58:00'),
  ('sesi-00445','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-07','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-07 07:07:00','2026-05-07 8:54:00'),
  ('sesi-00446','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-08','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-05-08 08:10:00','2026-05-08 9:59:00'),
  ('sesi-00447','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-05-08 07:06:00','2026-05-08 8:58:00'),
  ('sesi-00448','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-08','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-05-08 08:15:00','2026-05-08 9:72:00'),
  ('sesi-00449','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-08 08:01:00','2026-05-08 9:54:00'),
  ('sesi-00450','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-08','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-05-08 07:09:00','2026-05-08 8:65:00'),
  ('sesi-00451','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-11','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-11 07:00:00','2026-05-11 8:47:00'),
  ('sesi-00452','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-11','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-05-11 07:01:00','2026-05-11 8:49:00'),
  ('sesi-00453','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-11','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-05-11 08:06:00','2026-05-11 9:55:00'),
  ('sesi-00454','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-11','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-05-11 08:12:00','2026-05-11 9:67:00'),
  ('sesi-00455','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-12','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-12 07:07:00','2026-05-12 8:57:00'),
  ('sesi-00456','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-12','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-05-12 08:05:00','2026-05-12 9:63:00'),
  ('sesi-00457','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-12','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-12 08:11:00','2026-05-12 9:58:00'),
  ('sesi-00458','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-05-12 08:02:00','2026-05-12 9:51:00'),
  ('sesi-00459','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-13','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-05-13 07:07:00','2026-05-13 8:62:00'),
  ('sesi-00460','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-13','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-05-13 07:08:00','2026-05-13 8:63:00'),
  ('sesi-00461','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-13','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-13 07:00:00','2026-05-13 8:52:00'),
  ('sesi-00462','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-13','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-13 07:00:00','2026-05-13 8:48:00'),
  ('sesi-00463','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-14','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-14 08:08:00','2026-05-14 9:59:00'),
  ('sesi-00464','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-14','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-05-14 08:14:00','2026-05-14 9:63:00'),
  ('sesi-00465','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-14','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-14 08:12:00','2026-05-14 9:66:00'),
  ('sesi-00466','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-14','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-05-14 08:09:00','2026-05-14 9:58:00'),
  ('sesi-00467','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-14','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-05-14 08:02:00','2026-05-14 9:52:00'),
  ('sesi-00468','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-14','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-05-14 08:08:00','2026-05-14 9:57:00'),
  ('sesi-00469','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-15','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-05-15 08:06:00','2026-05-15 9:53:00'),
  ('sesi-00470','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-15','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-15 07:01:00','2026-05-15 8:58:00'),
  ('sesi-00471','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-15','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-15 08:10:00','2026-05-15 9:65:00'),
  ('sesi-00472','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-15','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-15 07:15:00','2026-05-15 8:64:00'),
  ('sesi-00473','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-15','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-05-15 08:12:00','2026-05-15 9:63:00'),
  ('sesi-00474','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-18','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-18 07:10:00','2026-05-18 8:66:00'),
  ('sesi-00475','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-18','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-05-18 08:11:00','2026-05-18 9:64:00'),
  ('sesi-00476','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-18','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-18 07:05:00','2026-05-18 8:54:00'),
  ('sesi-00477','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-18','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-18 07:08:00','2026-05-18 8:64:00'),
  ('sesi-00478','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-18','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-18 07:10:00','2026-05-18 8:65:00'),
  ('sesi-00479','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-19','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-05-19 08:07:00','2026-05-19 9:63:00'),
  ('sesi-00480','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-19','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-19 08:10:00','2026-05-19 9:60:00'),
  ('sesi-00481','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-19','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-05-19 08:14:00','2026-05-19 9:72:00'),
  ('sesi-00482','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-05-19 07:02:00','2026-05-19 8:54:00'),
  ('sesi-00483','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-19','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-05-19 07:12:00','2026-05-19 8:65:00'),
  ('sesi-00484','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-20 07:04:00','2026-05-20 8:51:00'),
  ('sesi-00485','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-20','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-05-20 08:13:00','2026-05-20 9:67:00'),
  ('sesi-00486','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-20','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-05-20 08:04:00','2026-05-20 9:54:00'),
  ('sesi-00487','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-20','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-20 07:02:00','2026-05-20 8:54:00'),
  ('sesi-00488','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-20','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-05-20 07:10:00','2026-05-20 8:65:00'),
  ('sesi-00489','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-21','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-05-21 08:08:00','2026-05-21 9:56:00'),
  ('sesi-00490','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-21','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-05-21 07:05:00','2026-05-21 8:57:00'),
  ('sesi-00491','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-21','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-21 07:04:00','2026-05-21 8:58:00'),
  ('sesi-00492','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-21','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-05-21 08:12:00','2026-05-21 9:63:00'),
  ('sesi-00493','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-21','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-21 08:00:00','2026-05-21 9:45:00'),
  ('sesi-00494','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-21','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-05-21 08:00:00','2026-05-21 9:59:00'),
  ('sesi-00495','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-22','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-05-22 07:00:00','2026-05-22 8:55:00'),
  ('sesi-00496','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-22','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-05-22 07:11:00','2026-05-22 8:60:00'),
  ('sesi-00497','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-22','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-22 08:09:00','2026-05-22 9:56:00'),
  ('sesi-00498','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-22','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-05-22 07:09:00','2026-05-22 8:58:00'),
  ('sesi-00499','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-25','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-25 08:13:00','2026-05-25 9:72:00'),
  ('sesi-00500','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-25','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-05-25 07:10:00','2026-05-25 8:69:00'),
  ('sesi-00501','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-25','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-05-25 07:05:00','2026-05-25 8:64:00'),
  ('sesi-00502','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-25','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-05-25 08:00:00','2026-05-25 9:48:00'),
  ('sesi-00503','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-25','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-25 07:06:00','2026-05-25 8:62:00'),
  ('sesi-00504','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-26','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-26 07:11:00','2026-05-26 8:67:00'),
  ('sesi-00505','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-26','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-26 07:12:00','2026-05-26 8:71:00'),
  ('sesi-00506','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-26','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-05-26 07:01:00','2026-05-26 8:56:00'),
  ('sesi-00507','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-26','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-26 07:01:00','2026-05-26 8:57:00'),
  ('sesi-00508','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-05-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-05-27 08:12:00','2026-05-27 9:58:00'),
  ('sesi-00509','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-27','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-05-27 08:04:00','2026-05-27 9:52:00'),
  ('sesi-00510','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-27','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-05-27 07:09:00','2026-05-27 8:60:00'),
  ('sesi-00511','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-05-27','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-05-27 08:04:00','2026-05-27 9:55:00'),
  ('sesi-00512','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-27','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-27 07:03:00','2026-05-27 8:52:00'),
  ('sesi-00513','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-05-28','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-28 07:15:00','2026-05-28 8:63:00'),
  ('sesi-00514','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-05-28','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-05-28 08:06:00','2026-05-28 9:56:00'),
  ('sesi-00515','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-05-28','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-05-28 08:05:00','2026-05-28 9:50:00'),
  ('sesi-00516','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-05-28','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-28 07:15:00','2026-05-28 8:65:00'),
  ('sesi-00517','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-28','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-05-28 07:02:00','2026-05-28 8:61:00'),
  ('sesi-00518','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-05-28','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-28 08:04:00','2026-05-28 9:50:00'),
  ('sesi-00519','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-05-29','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-05-29 07:03:00','2026-05-29 8:62:00'),
  ('sesi-00520','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-05-29','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-05-29 07:14:00','2026-05-29 8:63:00'),
  ('sesi-00521','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-05-29','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-05-29 07:03:00','2026-05-29 8:61:00'),
  ('sesi-00522','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-05-29','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-05-29 07:09:00','2026-05-29 8:59:00'),
  ('sesi-00523','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-05-29','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-05-29 08:13:00','2026-05-29 9:69:00'),
  ('sesi-00524','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-06-01','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-06-01 07:00:00','2026-06-01 8:58:00'),
  ('sesi-00525','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-06-01','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-06-01 07:10:00','2026-06-01 8:60:00'),
  ('sesi-00526','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-01','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-06-01 08:02:00','2026-06-01 9:52:00'),
  ('sesi-00527','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-06-01','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-06-01 07:03:00','2026-06-01 8:54:00'),
  ('sesi-00528','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-06-01','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-06-01 08:08:00','2026-06-01 9:66:00'),
  ('sesi-00529','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-06-02','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-02 08:13:00','2026-06-02 9:68:00'),
  ('sesi-00530','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-06-02','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-06-02 07:03:00','2026-06-02 8:50:00'),
  ('sesi-00531','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-06-02','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-06-02 07:05:00','2026-06-02 8:51:00'),
  ('sesi-00532','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-02','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-06-02 08:14:00','2026-06-02 9:61:00'),
  ('sesi-00533','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-06-02','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-06-02 08:00:00','2026-06-02 9:58:00'),
  ('sesi-00534','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-06-03','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-06-03 07:15:00','2026-06-03 8:74:00'),
  ('sesi-00535','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-03','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-03 08:14:00','2026-06-03 9:59:00'),
  ('sesi-00536','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-06-03','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-06-03 08:00:00','2026-06-03 9:56:00'),
  ('sesi-00537','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-06-03','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-06-03 07:10:00','2026-06-03 8:63:00'),
  ('sesi-00538','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-06-03','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-06-03 07:13:00','2026-06-03 8:68:00'),
  ('sesi-00539','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-06-04','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-06-04 08:11:00','2026-06-04 9:66:00'),
  ('sesi-00540','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-06-04','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-06-04 08:04:00','2026-06-04 9:62:00'),
  ('sesi-00541','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-06-04','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-04 07:00:00','2026-06-04 8:55:00'),
  ('sesi-00542','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-06-04','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-06-04 08:15:00','2026-06-04 9:73:00'),
  ('sesi-00543','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-04','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-06-04 08:10:00','2026-06-04 9:58:00'),
  ('sesi-00544','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-06-04','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-06-04 08:01:00','2026-06-04 9:54:00'),
  ('sesi-00545','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-06-05','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-06-05 08:12:00','2026-06-05 9:70:00'),
  ('sesi-00546','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-05 08:14:00','2026-06-05 9:71:00'),
  ('sesi-00547','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-06-05','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-05 07:15:00','2026-06-05 8:67:00'),
  ('sesi-00548','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-05','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-06-05 08:00:00','2026-06-05 9:46:00'),
  ('sesi-00549','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-06-05','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-05 07:00:00','2026-06-05 8:58:00'),
  ('sesi-00550','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-06-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-06-08 08:06:00','2026-06-08 9:61:00'),
  ('sesi-00551','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-06-08','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-06-08 08:11:00','2026-06-08 9:69:00'),
  ('sesi-00552','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-08','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-06-08 07:14:00','2026-06-08 8:64:00'),
  ('sesi-00553','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-06-08','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-06-08 08:11:00','2026-06-08 9:67:00'),
  ('sesi-00554','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-06-08','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-08 07:07:00','2026-06-08 8:52:00'),
  ('sesi-00555','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-06-09','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-09 08:11:00','2026-06-09 9:67:00'),
  ('sesi-00556','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-06-09','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-06-09 07:15:00','2026-06-09 8:62:00'),
  ('sesi-00557','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-06-09','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-06-09 08:03:00','2026-06-09 9:52:00'),
  ('sesi-00558','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-09','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-09 07:03:00','2026-06-09 8:62:00'),
  ('sesi-00559','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-06-09','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-06-09 07:14:00','2026-06-09 8:72:00'),
  ('sesi-00560','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-06-10','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='julia.fadli.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-10 08:03:00','2026-06-10 9:60:00'),
  ('sesi-00561','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-10','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='joko.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-06-10 07:14:00','2026-06-10 8:66:00'),
  ('sesi-00562','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-06-10','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='lutfi.puspita.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-10 07:15:00','2026-06-10 8:60:00'),
  ('sesi-00563','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-06-10','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='eva.nur.wahyudi@smksrajasa.sch.id' LIMIT 1),'2026-06-10 07:13:00','2026-06-10 8:71:00'),
  ('sesi-00564','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-06-10','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.zain.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-10 07:05:00','2026-06-10 8:61:00'),
  ('sesi-00565','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-06-11','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='lutfi.laksono.hidayat@smksrajasa.sch.id' LIMIT 1),'2026-06-11 07:12:00','2026-06-11 8:67:00'),
  ('sesi-00566','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-06-11','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='hesti.putri.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-06-11 08:12:00','2026-06-11 9:63:00'),
  ('sesi-00567','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-06-11','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='nanda.candra.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-06-11 07:08:00','2026-06-11 8:59:00'),
  ('sesi-00568','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-06-11','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='nurul.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-06-11 08:14:00','2026-06-11 9:71:00'),
  ('sesi-00569','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-11','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='rendi.saputra@smksrajasa.sch.id' LIMIT 1),'2026-06-11 08:09:00','2026-06-11 9:67:00'),
  ('sesi-00570','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-06-11','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='julia.lestari@smksrajasa.sch.id' LIMIT 1),'2026-06-11 08:06:00','2026-06-11 9:54:00'),
  ('sesi-00571','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-06-12','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='kevin.dewi.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-12 08:11:00','2026-06-12 9:70:00'),
  ('sesi-00572','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='amelia.fauzan@smksrajasa.sch.id' LIMIT 1),'2026-06-12 07:10:00','2026-06-12 8:66:00'),
  ('sesi-00573','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-06-12','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='putra.maulana@smksrajasa.sch.id' LIMIT 1),'2026-06-12 08:15:00','2026-06-12 9:69:00'),
  ('sesi-00574','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-12','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='aini.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-06-12 08:09:00','2026-06-12 9:68:00'),
  ('sesi-00575','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-06-12','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='rendi.purnomo@smksrajasa.sch.id' LIMIT 1),'2026-06-12 07:03:00','2026-06-12 8:48:00'),
  ('sesi-00576','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-06-15','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='putri.puspita.sulistyo@smksrajasa.sch.id' LIMIT 1),'2026-06-15 07:01:00','2026-06-15 8:49:00'),
  ('sesi-00577','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-06-15','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='edwin.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-15 07:09:00','2026-06-15 8:64:00'),
  ('sesi-00578','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-15','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='gita.agung.rahmawati@smksrajasa.sch.id' LIMIT 1),'2026-06-15 07:09:00','2026-06-15 8:57:00'),
  ('sesi-00579','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-06-15','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='lukas.lestari@smksrajasa.sch.id' LIMIT 1),'2026-06-15 07:11:00','2026-06-15 8:69:00'),
  ('sesi-00580','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-06-15','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='farid.firmansyah@smksrajasa.sch.id' LIMIT 1),'2026-06-15 07:12:00','2026-06-15 8:60:00'),
  ('sesi-00581','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-06-16','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='zara.susanto@smksrajasa.sch.id' LIMIT 1),'2026-06-16 08:01:00','2026-06-16 9:60:00'),
  ('sesi-00582','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-06-16','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='cahyo.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-06-16 08:10:00','2026-06-16 9:63:00'),
  ('sesi-00583','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-06-16','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='galih.gilang.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-16 08:06:00','2026-06-16 9:60:00'),
  ('sesi-00584','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-16','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='jessica.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-06-16 08:07:00','2026-06-16 9:66:00'),
  ('sesi-00585','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-06-16','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='dewi.hakim@smksrajasa.sch.id' LIMIT 1),'2026-06-16 08:06:00','2026-06-16 9:63:00'),
  ('sesi-00586','rombel',@rombel_x_rpl_1,@ta_id,@semester,'2026-06-17','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='kevin.danu.nugraha@smksrajasa.sch.id' LIMIT 1),'2026-06-17 07:09:00','2026-06-17 8:61:00'),
  ('sesi-00587','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-17','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='farid.susanto@smksrajasa.sch.id' LIMIT 1),'2026-06-17 07:05:00','2026-06-17 8:52:00'),
  ('sesi-00588','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-06-17','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='bella.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-17 07:12:00','2026-06-17 8:57:00'),
  ('sesi-00589','rombel',@rombel_xii_tkj_2,@ta_id,@semester,'2026-06-17','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='julia.anggraini@smksrajasa.sch.id' LIMIT 1),'2026-06-17 08:04:00','2026-06-17 9:51:00'),
  ('sesi-00590','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-06-17','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='pras.adi.suryanto@smksrajasa.sch.id' LIMIT 1),'2026-06-17 08:00:00','2026-06-17 9:50:00'),
  ('sesi-00591','rombel',@rombel_x_tkj_1,@ta_id,@semester,'2026-06-18','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='faisal.rahmat.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-18 07:01:00','2026-06-18 8:48:00'),
  ('sesi-00592','rombel',@rombel_x_mm_1,@ta_id,@semester,'2026-06-18','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='vina.permata@smksrajasa.sch.id' LIMIT 1),'2026-06-18 07:09:00','2026-06-18 8:61:00'),
  ('sesi-00593','rombel',@rombel_xi_tkj_2,@ta_id,@semester,'2026-06-18','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='hendra.imam.ramadhan@smksrajasa.sch.id' LIMIT 1),'2026-06-18 08:02:00','2026-06-18 9:59:00'),
  ('sesi-00594','rombel',@rombel_xi_mm_1,@ta_id,@semester,'2026-06-18','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='bagas.aryo.kurniawan@smksrajasa.sch.id' LIMIT 1),'2026-06-18 07:05:00','2026-06-18 8:58:00'),
  ('sesi-00595','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-18','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='vivi.aryo.pratama@smksrajasa.sch.id' LIMIT 1),'2026-06-18 07:13:00','2026-06-18 8:66:00'),
  ('sesi-00596','rombel',@rombel_xii_mm_1,@ta_id,@semester,'2026-06-18','selesai','lab-tkj-4','Lab TKJ 4',(SELECT user_id FROM users WHERE email='gita.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-18 07:11:00','2026-06-18 8:59:00'),
  ('sesi-00597','rombel',@rombel_x_tkj_2,@ta_id,@semester,'2026-06-19','selesai','lab-tkj-2','Lab TKJ 2',(SELECT user_id FROM users WHERE email='oscar.utama.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-19 08:10:00','2026-06-19 9:60:00'),
  ('sesi-00598','rombel',@rombel_xi_tkj_1,@ta_id,@semester,'2026-06-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='sigit.susanto@smksrajasa.sch.id' LIMIT 1),'2026-06-19 08:00:00','2026-06-19 9:46:00'),
  ('sesi-00599','rombel',@rombel_xi_rpl_1,@ta_id,@semester,'2026-06-19','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='priska.wahyu.gunawan@smksrajasa.sch.id' LIMIT 1),'2026-06-19 08:07:00','2026-06-19 9:66:00'),
  ('sesi-00600','rombel',@rombel_xii_tkj_1,@ta_id,@semester,'2026-06-19','selesai','lab-tkj-1','Lab TKJ 1',(SELECT user_id FROM users WHERE email='ulfa.prasetyo@smksrajasa.sch.id' LIMIT 1),'2026-06-19 07:01:00','2026-06-19 8:56:00');

INSERT IGNORE INTO `presensi_sesi`
(session_uuid,mode_presensi,rombel_id,tahun_ajaran_id,semester,
 tanggal,status,ruang_pilihan,ruang_label_snapshot,opened_by_user_id,
 started_at,ended_at) VALUES
  ('sesi-00601','rombel',@rombel_xii_rpl_1,@ta_id,@semester,'2026-06-19','selesai','lab-tkj-3','Lab TKJ 3',(SELECT user_id FROM users WHERE email='ivan.ningrum@smksrajasa.sch.id' LIMIT 1),'2026-06-19 08:03:00','2026-06-19 9:54:00');


-- ============================================================
-- 5. PRESENSI SISWA (INSERT langsung dari sesi yang ada)
-- ============================================================
INSERT IGNORE INTO `presensi_jam_siswa`
(tanggal, siswa_id, rombel_id_snapshot, tahun_ajaran_id_snapshot,
 semester_snapshot, jam_id, status, mode_presensi, presensi_sesi_id, scanned_at)
SELECT
  ps.tanggal,
  s.siswa_id,
  ps.rombel_id,
  ps.tahun_ajaran_id,
  ps.semester,
  1,
  ELT(FLOOR(RAND()*20)+1,
    'hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir','hadir',
    'hadir','hadir','hadir','hadir','hadir',
    'terlambat','terlambat','alpha','sakit','izin'),
  'rombel',
  ps.presensi_sesi_id,
  CASE
    WHEN RAND() < 0.13 THEN NULL
    ELSE TIMESTAMP(ps.tanggal, MAKETIME(7, FLOOR(RAND()*20), FLOOR(RAND()*59)))
  END
FROM presensi_sesi ps
JOIN siswa s ON s.rombel_id_aktif = ps.rombel_id
WHERE ps.status = 'selesai'
  AND s.status = 'aktif';

-- ============================================================
-- 6. E-IZIN (200+ pengajuan)
-- ============================================================
INSERT IGNORE INTO `e_izin`
(siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status, wali_catatan, created_at)
SELECT
  s.siswa_id,
  ELT(FLOOR(RAND()*3)+1,'sakit','izin','dispensasi'),
  DATE_ADD('2026-01-06', INTERVAL FLOOR(RAND()*163) DAY),
  DATE_ADD('2026-01-06', INTERVAL FLOOR(RAND()*163) DAY),
  ELT(FLOOR(RAND()*5)+1,
    'Demam dan flu, tidak bisa masuk sekolah.',
    'Ada keperluan keluarga mendadak yang tidak bisa ditinggal.',
    'Sakit kepala dan mual sejak dini hari.',
    'Mengikuti lomba tingkat kota mewakili sekolah.',
    'Ada acara keluarga yang sudah direncanakan jauh hari.'),
  ELT(FLOOR(RAND()*5)+1,'disetujui','disetujui','pending','ditolak','menunggu_ortu'),
  ELT(FLOOR(RAND()*3)+1,
    'Izin diterima.',
    'Mohon segera sembuh dan kejar materi yang tertinggal.',
    NULL),
  DATE_ADD('2026-01-06', INTERVAL FLOOR(RAND()*163) DAY)
FROM siswa s
ORDER BY RAND()
LIMIT 250;

-- ============================================================
-- 7. LOGBOOK PKL (siswa XII — ~300 entri)
-- ============================================================
INSERT IGNORE INTO `logbook_praktik`
(siswa_id, guru_id, tanggal, jam_mulai, jam_selesai, lokasi, deskripsi, status,
 catatan_guru, reviewed_at, created_at)
SELECT
  s.siswa_id,
  (SELECT guru_id FROM guru_staff ORDER BY RAND() LIMIT 1),
  DATE_ADD('2026-01-06', INTERVAL FLOOR(RAND()*163) DAY),
  '08:00', '12:00',
  ELT(FLOOR(RAND()*4)+1,
    'Lab Komputer TKJ','Ruang Server','Lab Multimedia','Lab Jaringan'),
  ELT(FLOOR(RAND()*6)+1,
    'Melakukan instalasi dan konfigurasi sistem operasi Windows Server. Mengatur Active Directory dan Group Policy untuk manajemen pengguna.',
    'Konfigurasi router Mikrotik: setting DHCP, NAT, dan firewall rules dasar. Membuat VLAN untuk segmentasi jaringan.',
    'Pemasangan dan konfigurasi CCTV IP Camera beserta NVR. Testing koneksi dan pengaturan recording otomatis.',
    'Maintenance PC di laboratorium: cleaning hardware, update driver, scan virus, dan optimasi performa sistem.',
    'Desain dan cetak brosur promosi sekolah menggunakan CorelDRAW. Membuat layout, editing foto, dan persiapan file untuk cetak.',
    'Setting dan konfigurasi access point WiFi. Pengaturan SSID, keamanan WPA2, dan manajemen bandwidth per pengguna.'),
  ELT(FLOOR(RAND()*4)+1,'disetujui','menunggu_review','draft','ditolak'),
  ELT(FLOOR(RAND()*3)+1,
    'Dokumentasi baik, kegiatan sesuai kompetensi.',
    'Tambahkan foto dokumentasi kegiatan.',
    NULL),
  CASE WHEN RAND()<0.6 THEN NOW()-INTERVAL FLOOR(RAND()*30) DAY ELSE NULL END,
  NOW()-INTERVAL FLOOR(RAND()*163) DAY
FROM siswa s
JOIN rombel r ON r.rombel_id = s.rombel_id_aktif
WHERE r.tingkatan = 'XII'
ORDER BY RAND()
LIMIT 320;

-- ============================================================
-- 8. TIKET KOMUNIKASI (60 tiket)
-- ============================================================
INSERT IGNORE INTO `tiket`
(dari_user_id, kepada_user_id, kategori, prioritas, judul, pesan, status, reply_count, created_at)
SELECT
  u.user_id,
  (SELECT user_id FROM users WHERE user_type='guru' ORDER BY RAND() LIMIT 1),
  ELT(FLOOR(RAND()*6)+1,'pertanyaan','keluhan','izin_khusus','konsultasi','laporan_masalah','lainnya'),
  ELT(FLOOR(RAND()*4)+1,'rendah','normal','normal','tinggi'),
  ELT(FLOOR(RAND()*8)+1,
    'Pertanyaan tentang materi praktikum jaringan',
    'Laporan kerusakan komputer di lab TKJ',
    'Izin mengikuti lomba LKS tingkat kota',
    'Konsultasi laporan akhir PKL',
    'AC di laboratorium tidak berfungsi',
    'Jadwal ujian praktik semester genap',
    'Pertanyaan nilai akhir semester',
    'Laporan kehilangan barang di lingkungan sekolah'),
  ELT(FLOOR(RAND()*5)+1,
    'Mohon informasi jadwal dan materi yang perlu dipersiapkan untuk praktikum minggu depan.',
    'Ingin melaporkan bahwa komputer nomor 12 di lab tidak bisa menyala sejak kemarin.',
    'Mohon izin tidak mengikuti kegiatan sekolah untuk mengikuti lomba yang mewakili sekolah.',
    'Membutuhkan bimbingan untuk menyelesaikan laporan PKL terutama bagian metodologi.',
    'AC di lab TKJ 2 sudah mati selama 3 hari, suhu sangat panas saat praktik siang.'),
  ELT(FLOOR(RAND()*4)+1,'open','in_progress','resolved','closed'),
  FLOOR(RAND()*5),
  NOW()-INTERVAL FLOOR(RAND()*163) DAY
FROM users u
WHERE u.user_type='siswa'
ORDER BY RAND()
LIMIT 65;

-- ============================================================
-- 9. GAMIFIKASI POIN (generated dari presensi)
-- ============================================================
INSERT IGNORE INTO `gamifikasi_poin`
(siswa_id, tipe, poin, keterangan, tanggal, created_at)
SELECT
  siswa_id,
  CASE status
    WHEN 'hadir' THEN 'hadir_tepat_waktu'
    WHEN 'terlambat' THEN 'hadir_terlambat'
    WHEN 'izin' THEN 'izin_surat'
    ELSE 'hadir_tepat_waktu'
  END,
  CASE status
    WHEN 'hadir' THEN 10
    WHEN 'terlambat' THEN 5
    WHEN 'izin' THEN 3
    ELSE 10
  END,
  CONCAT('Presensi ', tanggal),
  tanggal,
  tanggal
FROM presensi_jam_siswa
WHERE status IN ('hadir','terlambat','izin')
  AND jam_id = 1
LIMIT 15000;

-- ============================================================
-- 10. BADGE KATALOG (pastikan ada)
-- ============================================================
INSERT IGNORE INTO `gamifikasi_badge`
(kode,nama,deskripsi,icon,warna,kategori,kriteria_tipe,kriteria_nilai,poin_reward,is_aktif)
VALUES
('HADIR_RAJIN','Si Rajin','Hadir tepat waktu 20+ hari/bulan','⭐','#22c55e','kehadiran','hadir_rate',90,50,1),
('HADIR_SEMPURNA','Perfect Attendance','Tidak alpha sebulan penuh','🏅','#f59e0b','kehadiran','perfect_month',1,100,1),
('STREAK_7','Streak 7 Hari','Hadir 7 hari berturut-turut','🔥','#ef4444','kehadiran','streak',7,30,1),
('STREAK_30','Streak 30 Hari','Hadir 30 hari berturut-turut','💎','#8b5cf6','kehadiran','streak',30,200,1),
('EARLY_BIRD','Early Bird','Scan di 5 menit pertama sesi selama 5 hari','🐦','#0ea5e9','kehadiran','early_bird',5,25,1),
('LOGBOOK_AKTIF','Penulis Aktif','10 entri logbook disetujui','📒','#06b6d4','logbook','logbook_count',10,40,1),
('LOGBOOK_PRO','Logbook Pro','20 entri disetujui tanpa dikembalikan','✍️','#10b981','logbook','logbook_count',20,80,1),
('KOMUNIKATIF','Komunikatif','3 tiket selesai','💬','#f97316','komunikasi','tiket_count',3,20,1),
('TOP3_BULAN','Top 3 Bulan Ini','Masuk 3 besar leaderboard rombel','🏆','#f59e0b','prestasi','top3',3,75,1),
('KONSISTEN','Konsisten','Rate hadir 85%+ selama 3 bulan','💪','#6366f1','prestasi','konsisten',85,60,1),
('PERDANA','Pendatang Baru','Badge pertama!','🎉','#ec4899','khusus',NULL,NULL,10,1),
('BETA_USER','Beta Tester','Pengguna awal sistem presensi QR','🚀','#64748b','khusus',NULL,NULL,20,1);

-- ============================================================
-- 11. BADGE DIRAIH SISWA (top performers)
-- ============================================================
INSERT IGNORE INTO `gamifikasi_badge_siswa`
(siswa_id, badge_id, periode, diraih_at)
SELECT
  p.siswa_id,
  (SELECT badge_id FROM gamifikasi_badge WHERE kode='PERDANA' LIMIT 1),
  '2026-01',
  '2026-01-10'
FROM (SELECT DISTINCT siswa_id FROM gamifikasi_poin LIMIT 200) p;

-- Badge streak untuk top performers
INSERT IGNORE INTO `gamifikasi_badge_siswa`
(siswa_id, badge_id, periode, diraih_at)
SELECT
  siswa_id,
  (SELECT badge_id FROM gamifikasi_badge WHERE kode='STREAK_7' LIMIT 1),
  '2026-03',
  '2026-03-15'
FROM (
  SELECT siswa_id, COUNT(*) as cnt
  FROM gamifikasi_poin
  WHERE tipe='hadir_tepat_waktu'
  GROUP BY siswa_id
  HAVING cnt >= 20
  ORDER BY cnt DESC
  LIMIT 100
) top;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM guru_staff WHERE status='aktif')   AS total_guru,
  (SELECT COUNT(*) FROM siswa WHERE status='aktif')        AS total_siswa,
  (SELECT COUNT(*) FROM presensi_sesi)                     AS total_sesi,
  (SELECT COUNT(*) FROM presensi_jam_siswa)                AS total_presensi,
  (SELECT COUNT(*) FROM e_izin)                            AS total_izin,
  (SELECT COUNT(*) FROM logbook_praktik)                   AS total_logbook,
  (SELECT COUNT(*) FROM tiket)                             AS total_tiket,
  (SELECT COUNT(*) FROM gamifikasi_poin)                   AS total_poin,
  (SELECT COUNT(*) FROM gamifikasi_badge_siswa)            AS total_badge_diraih;