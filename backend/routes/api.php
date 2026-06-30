<?php

declare(strict_types=1);

use FastRoute\RouteCollector;
use Rajasa\PresensiSiswa\Http\Controllers\AuthLoginController;
use Rajasa\PresensiSiswa\Http\Controllers\TwoFactorController;
use Rajasa\PresensiSiswa\Http\Controllers\AuthLogoutController;
use Rajasa\PresensiSiswa\Http\Controllers\HealthController;
use Rajasa\PresensiSiswa\Http\Controllers\ImportJobsController;
use Rajasa\PresensiSiswa\Http\Controllers\ImportRowsController;
use Rajasa\PresensiSiswa\Http\Controllers\MeController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiScanController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiAuditController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiEditReasonController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiJamSiswaController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiManualEditController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiActiveController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiCreateController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiFinishController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiHeartbeatController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiWarningCheckController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiPauseController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiResumeController;
use Rajasa\PresensiSiswa\Http\Controllers\SiswaDashboardController;
use Rajasa\PresensiSiswa\Http\Controllers\AdminDashboardController;
use Rajasa\PresensiSiswa\Http\Controllers\SiswaPresensiController;
use Rajasa\PresensiSiswa\Http\Controllers\SiswaKalenderController;
use Rajasa\PresensiSiswa\Http\Controllers\RombelController;
use Rajasa\PresensiSiswa\Http\Controllers\ScanReadinessImportController;
use Rajasa\PresensiSiswa\Http\Controllers\UsersIndexController;
use Rajasa\PresensiSiswa\Http\Controllers\UsersCreateController;
use Rajasa\PresensiSiswa\Http\Controllers\UsersUpdateController;
use Rajasa\PresensiSiswa\Http\Controllers\UsersDeleteController;
use Rajasa\PresensiSiswa\Http\Controllers\UsersResetPasswordController;
use Rajasa\PresensiSiswa\Http\Controllers\SesiIndexController;
use Rajasa\PresensiSiswa\Http\Controllers\SesiForceFinishController;
use Rajasa\PresensiSiswa\Http\Controllers\AuditTrailController;
use Rajasa\PresensiSiswa\Http\Controllers\LaporanController;
use Rajasa\PresensiSiswa\Http\Controllers\NotifikasiController;
use Rajasa\PresensiSiswa\Http\Controllers\NotifikasiActionController;
use Rajasa\PresensiSiswa\Http\Controllers\LaporanExportController;
use Rajasa\PresensiSiswa\Http\Controllers\AnalitikController;
use Rajasa\PresensiSiswa\Http\Controllers\PengaturanGetController;
use Rajasa\PresensiSiswa\Http\Controllers\PengaturanTahunAjaranController;
use Rajasa\PresensiSiswa\Http\Controllers\PengaturanJurusanController;
use Rajasa\PresensiSiswa\Http\Controllers\PengaturanKonfigurasiController;
use Rajasa\PresensiSiswa\Http\Controllers\EarlyWarningController;
use Rajasa\PresensiSiswa\Http\Controllers\EIzinIndexController;
use Rajasa\PresensiSiswa\Http\Controllers\EIzinCreateController;
use Rajasa\PresensiSiswa\Http\Controllers\EIzinApproveController;
use Rajasa\PresensiSiswa\Http\Controllers\LogbookIndexController;
use Rajasa\PresensiSiswa\Http\Controllers\LogbookCreateController;
use Rajasa\PresensiSiswa\Http\Controllers\LogbookUpdateController;
use Rajasa\PresensiSiswa\Http\Controllers\LogbookDeleteController;
use Rajasa\PresensiSiswa\Http\Controllers\LogbookPenilaianController;
use Rajasa\PresensiSiswa\Http\Controllers\NilaiController;
use Rajasa\PresensiSiswa\Http\Controllers\AnalitikPrestasiController;
use Rajasa\PresensiSiswa\Http\Controllers\TiketController;
use Rajasa\PresensiSiswa\Http\Controllers\GamifikasiController;
use Rajasa\PresensiSiswa\Http\Controllers\ProfileController;
use Rajasa\PresensiSiswa\Http\Controllers\AdminGuruController;
use Rajasa\PresensiSiswa\Http\Controllers\AdminSiswaController;
use Rajasa\PresensiSiswa\Http\Controllers\JurusanOptionsController;

return function (RouteCollector $route): void {
    $route->get('/api/health', HealthController::class);

    $route->post('/api/auth/login',           AuthLoginController::class);
    $route->post('/api/auth/2fa/verify',      [TwoFactorController::class, 'verifyLogin']);

    // 2FA admin settings (wajib login)
    $route->get('/api/admin/2fa/status',      [TwoFactorController::class, 'status']);
    $route->get('/api/admin/2fa/setup',       [TwoFactorController::class, 'setup']);
    $route->post('/api/admin/2fa/enable',     [TwoFactorController::class, 'enable']);
    $route->delete('/api/admin/2fa/disable',  [TwoFactorController::class, 'disable']);
    $route->post('/api/auth/logout', AuthLogoutController::class);
    $route->get('/api/me', MeController::class);

    $route->get('/api/siswa/dashboard', SiswaDashboardController::class);
    $route->get('/api/dashboard', AdminDashboardController::class);
    $route->get('/api/siswa/presensi', SiswaPresensiController::class);
    $route->get('/api/siswa/kalender-akademik', SiswaKalenderController::class);
    $route->get('/api/rombel/options', RombelController::class);
    $route->get('/api/jurusan/options', JurusanOptionsController::class);

    // ── Users (admin) ────────────────────────────────────────────────────────
    $route->get('/api/users',                               UsersIndexController::class);
    $route->post('/api/users',                              UsersCreateController::class);
    $route->patch('/api/users/{id:\d+}',                    UsersUpdateController::class);
    $route->delete('/api/users/{id:\d+}',                   UsersDeleteController::class);
    $route->post('/api/users/{id:\d+}/reset-password',      UsersResetPasswordController::class);

    // ── Sesi Presensi (admin monitor) ────────────────────────────────────────
    $route->get('/api/admin/sesi',                          SesiIndexController::class);
    $route->post('/api/admin/sesi/{id:\d+}/force-finish',   SesiForceFinishController::class);

    // ── Audit Trail (admin) ──────────────────────────────────────────────────
    $route->get('/api/admin/audit',                         AuditTrailController::class);
    // Notifikasi
    $route->get('/api/notifikasi',                         NotifikasiController::class);
    $route->post('/api/notifikasi/read-all',               [NotifikasiActionController::class, 'markAllRead']);
    $route->patch('/api/notifikasi/{id:\d+}/read',         [NotifikasiActionController::class, 'markRead']);
    $route->delete('/api/notifikasi/{id:\d+}',            [NotifikasiActionController::class, 'delete']);

    $route->get('/api/admin/laporan',                       LaporanController::class);
    $route->get('/api/admin/laporan/export',               LaporanExportController::class);
    $route->get('/api/admin/analitik',                      AnalitikController::class);

    // ── Pengaturan Sistem (admin) ─────────────────────────────────────────────
    $route->get('/api/admin/pengaturan',                            PengaturanGetController::class);
    $route->post('/api/admin/pengaturan/tahun-ajaran',              PengaturanTahunAjaranController::class);
    $route->patch('/api/admin/pengaturan/tahun-ajaran/{id:\d+}',    PengaturanTahunAjaranController::class);
    $route->post('/api/admin/pengaturan/jurusan',                   PengaturanJurusanController::class);
    $route->patch('/api/admin/pengaturan/jurusan/{id:\d+}',         PengaturanJurusanController::class);
    $route->delete('/api/admin/pengaturan/jurusan/{id:\d+}',        PengaturanJurusanController::class);
    $route->patch('/api/admin/pengaturan/konfigurasi',              PengaturanKonfigurasiController::class);

    // ── Early Warning ─────────────────────────────────────────────────────────
    $route->get('/api/early-warnings',                      EarlyWarningController::class);
    $route->post('/api/early-warnings/notify',              EarlyWarningController::class);

    // ── E-Izin (Portal Izin/Sakit Siswa) ─────────────────────────────────────
    $route->get('/api/e-izin',                              EIzinIndexController::class);
    $route->post('/api/e-izin',                             EIzinCreateController::class);
    $route->patch('/api/e-izin/{id:\d+}/approve',           EIzinApproveController::class);

    // ── Logbook Praktik (PKL) ─────────────────────────────────────────────────
    $route->get('/api/logbook',                             LogbookIndexController::class);
    $route->post('/api/logbook',                            LogbookCreateController::class);
    $route->patch('/api/logbook/{id:\d+}',                  LogbookUpdateController::class);
    $route->delete('/api/logbook/{id:\d+}',                 LogbookDeleteController::class);
    $route->get('/api/logbook/penilaian',                   LogbookPenilaianController::class);
    $route->post('/api/logbook/penilaian',                  LogbookPenilaianController::class);
    $route->patch('/api/logbook/penilaian/{id:\d+}',        LogbookPenilaianController::class);

    // ── Nilai Akademik ────────────────────────────────────────────────────────
    $route->get('/api/nilai/mapel',                         NilaiController::class);
    $route->get('/api/nilai',                               NilaiController::class);
    $route->post('/api/nilai',                              NilaiController::class);
    $route->patch('/api/nilai/{id:\d+}',                    NilaiController::class);
    $route->delete('/api/nilai/{id:\d+}',                   NilaiController::class);

    // ── Analitik Prestasi ─────────────────────────────────────────────────────
    $route->get('/api/analitik/prestasi',                   AnalitikPrestasiController::class);

    // ── Communication Hub (Tiket) ─────────────────────────────────────────────
    $route->get('/api/tiket',                               TiketController::class);
    $route->post('/api/tiket',                              TiketController::class);
    $route->get('/api/tiket/{id:\d+}',                      TiketController::class);
    $route->patch('/api/tiket/{id:\d+}',                    TiketController::class);
    $route->delete('/api/tiket/{id:\d+}',                   TiketController::class);
    $route->post('/api/tiket/{id:\d+}/balas',               TiketController::class);

    // ── Gamifikasi ────────────────────────────────────────────────────────────────
    $route->get('/api/gamifikasi/profil',          GamifikasiController::class);
    $route->get('/api/gamifikasi/leaderboard',     GamifikasiController::class);
    $route->get('/api/gamifikasi/badge',           GamifikasiController::class);
    $route->post('/api/gamifikasi/hitung',         GamifikasiController::class);
    $route->post('/api/gamifikasi/poin',           GamifikasiController::class);

    // ── Presensi Sesi ─────────────────────────────────────────────────────────
    $route->post('/api/presensi/sesi',                              PresensiSesiCreateController::class);
    $route->get('/api/presensi/sesi/aktif',                         PresensiSesiActiveController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/pause',               PresensiSesiPauseController::class);
    $route->post('/api/presensi/sesi/check-warning',                PresensiSesiWarningCheckController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/resume',              PresensiSesiResumeController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/finish',              PresensiSesiFinishController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/heartbeat',           PresensiSesiHeartbeatController::class);

    // ── Profil User (semua role) ──────────────────────────────────────────────
    $route->get('/api/profile/me',                          [ProfileController::class, 'me']);
    $route->post('/api/profile/foto',                       [ProfileController::class, 'uploadFoto']);
    $route->put('/api/profile/kontak',                      [ProfileController::class, 'updateKontak']);

    // ── Manajemen Guru (admin only) ───────────────────────────────────────────
    $route->get('/api/admin/guru',                          [AdminGuruController::class, 'index']);
    $route->post('/api/admin/guru',                         [AdminGuruController::class, 'store']);
    $route->get('/api/admin/guru/{id:\d+}',                 [AdminGuruController::class, 'show']);
    $route->put('/api/admin/guru/{id:\d+}',                 [AdminGuruController::class, 'update']);
    $route->delete('/api/admin/guru/{id:\d+}',              [AdminGuruController::class, 'destroy']);

    // ── Manajemen Siswa (admin only) ──────────────────────────────────────────
    $route->get('/api/admin/siswa',                         [AdminSiswaController::class, 'index']);
    $route->post('/api/admin/siswa',                        [AdminSiswaController::class, 'store']);
    $route->get('/api/admin/siswa/{id:\d+}',                [AdminSiswaController::class, 'show']);
    $route->put('/api/admin/siswa/{id:\d+}',                [AdminSiswaController::class, 'update']);
    $route->delete('/api/admin/siswa/{id:\d+}',             [AdminSiswaController::class, 'destroy']);

    // ── Import ────────────────────────────────────────────────────────────────
    $route->post('/api/import/scan-readiness',              ScanReadinessImportController::class);
    $route->get('/api/import/jobs',                         ImportJobsController::class);
    $route->get('/api/import/jobs/{id:\d+}/rows',           ImportRowsController::class);

    // ── Presensi ──────────────────────────────────────────────────────────────
    $route->post('/api/presensi/scan',                      PresensiScanController::class);
    $route->get('/api/presensi/audit/latest',               PresensiAuditController::class);
    $route->get('/api/presensi/jam-siswa',                  PresensiJamSiswaController::class);
    $route->patch('/api/presensi/jam-siswa/{id:\d+}',       PresensiManualEditController::class);
    $route->get('/api/presensi/edit-reasons',               PresensiEditReasonController::class);
};
