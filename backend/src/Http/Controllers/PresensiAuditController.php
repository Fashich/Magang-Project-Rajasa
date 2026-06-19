<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;

final class PresensiAuditController
{
    public function __construct(private readonly PermissionMiddleware $permission) {}

    public function __invoke(): void
    {
        $this->permission->require('attendance.log.read');

        $scanLogs = DB::table('presensi_scan_log')
            ->whereIn('status_scan', ['berhasil', 'warning', 'invalid', 'ditolak'])
            ->orderByDesc('scan_log_id')
            ->limit(20)
            ->get();

        $attendanceRows = DB::table('presensi_jam_siswa as p')
            ->leftJoin('siswa as s', 's.siswa_id', '=', 'p.siswa_id')
            ->whereNotNull('p.scan_log_id')
            ->orderByDesc('p.presensi_id')
            ->limit(20)
            ->get([
                'p.presensi_id', 'p.presensi_sesi_id', 'p.scan_log_id',
                'p.siswa_id', 's.nisn', 's.nama_lengkap', 's.kelas_aktif',
                'p.tanggal', 'p.jam_id', 'p.status', 'p.mode_presensi', 'p.scanned_at',
            ]);

        Response::success('Audit presensi terkini.', [
            'summary' => [
                'scan_berhasil' => DB::table('presensi_scan_log')->where('status_scan', 'berhasil')->count(),
                'scan_warning' => DB::table('presensi_scan_log')->where('status_scan', 'warning')->count(),
                'scan_invalid' => DB::table('presensi_scan_log')->where('status_scan', 'invalid')->count(),
                'scan_ditolak' => DB::table('presensi_scan_log')->where('status_scan', 'ditolak')->count(),
                'attendance_from_scan' => DB::table('presensi_jam_siswa')->whereNotNull('scan_log_id')->count(),
            ],
            'scan_logs' => $scanLogs,
            'attendance_rows' => $attendanceRows,
        ]);
    }
}