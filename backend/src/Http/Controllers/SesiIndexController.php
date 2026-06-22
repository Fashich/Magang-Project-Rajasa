<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * SesiIndexController
 *
 * GET /api/admin/sesi — Daftar semua sesi presensi (admin view)
 * Query params: ?tanggal=Y-m-d &status=aktif|suspended|selesai|semua &mode=rombel|piket|semua &page=1
 *
 * @author feature/admin-dashboard
 */
final class SesiIndexController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if ($user->user_type !== 'admin') {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        $tanggal = $_GET['tanggal'] ?? Carbon::now()->toDateString();
        $status  = $_GET['status']  ?? 'semua';
        $mode    = $_GET['mode']    ?? 'semua';
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = 20;

        // Validasi tanggal
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            $tanggal = Carbon::now()->toDateString();
        }

        $query = DB::table('presensi_sesi AS ps')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 'ps.rombel_id')
            ->leftJoin('users AS u', 'u.user_id', '=', 'ps.opened_by_user_id')
            ->leftJoin('guru_staff AS gs', 'gs.guru_id', '=', 'u.guru_id')
            ->where('ps.tanggal', $tanggal)
            ->selectRaw("
                ps.presensi_sesi_id,
                ps.session_uuid,
                ps.mode_presensi,
                ps.status,
                ps.ruang_label_snapshot,
                ps.tanggal,
                ps.started_at,
                ps.paused_at,
                ps.ended_at,
                ps.expires_at,
                ps.opened_by_user_id,
                u.username      AS dibuka_oleh_username,
                gs.nama_lengkap AS dibuka_oleh_nama,
                r.rombel_id,
                r.label_rombel
            ");

        // Filter status
        $validStatuses = ['aktif', 'suspended', 'selesai', 'gagal', 'expired', 'terputus'];
        if ($status !== 'semua' && in_array($status, $validStatuses, true)) {
            $query->where('ps.status', $status);
        }

        // Filter mode
        if ($mode !== 'semua' && in_array($mode, ['rombel', 'piket'], true)) {
            $query->where('ps.mode_presensi', $mode);
        }

        $total  = $query->count();
        $offset = ($page - 1) * $perPage;

        $rows = $query
            ->orderByDesc('ps.presensi_sesi_id')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        // Ambil jumlah scan per sesi
        $sesiIds = $rows->pluck('presensi_sesi_id')->filter()->values()->all();
        $scanCounts = [];
        if (!empty($sesiIds)) {
            $counts = DB::table('presensi_jam_siswa')
                ->whereIn('presensi_sesi_id', $sesiIds)
                ->selectRaw('presensi_sesi_id, COUNT(DISTINCT siswa_id) AS total_hadir')
                ->where('status', '!=', 'alpha')
                ->groupBy('presensi_sesi_id')
                ->get();
            foreach ($counts as $c) {
                $scanCounts[(int) $c->presensi_sesi_id] = (int) $c->total_hadir;
            }
        }

        // Ambil jam per sesi
        $jamMap = [];
        if (!empty($sesiIds)) {
            $jams = DB::table('presensi_sesi_jam AS psj')
                ->join('jam_pembelajaran AS jp', 'jp.jam_id', '=', 'psj.jam_id')
                ->whereIn('psj.presensi_sesi_id', $sesiIds)
                ->selectRaw('psj.presensi_sesi_id, GROUP_CONCAT(jp.jam_ke ORDER BY jp.jam_ke) AS jam_list')
                ->groupBy('psj.presensi_sesi_id')
                ->get();
            foreach ($jams as $j) {
                $jamMap[(int) $j->presensi_sesi_id] = $j->jam_list;
            }
        }

        $data = $rows->map(function ($row) use ($scanCounts, $jamMap) {
            $id = (int) $row->presensi_sesi_id;
            return [
                'presensi_sesi_id'    => $id,
                'session_uuid'        => $row->session_uuid,
                'mode_presensi'       => $row->mode_presensi,
                'status'              => $row->status,
                'ruang'               => $row->ruang_label_snapshot,
                'tanggal'             => $row->tanggal,
                'started_at'          => $row->started_at,
                'paused_at'           => $row->paused_at,
                'ended_at'            => $row->ended_at,
                'expires_at'          => $row->expires_at,
                'dibuka_oleh'         => [
                    'user_id'  => (int) $row->opened_by_user_id,
                    'username' => $row->dibuka_oleh_username,
                    'nama'     => $row->dibuka_oleh_nama ?? $row->dibuka_oleh_username,
                ],
                'rombel'              => $row->rombel_id ? [
                    'rombel_id'   => (int) $row->rombel_id,
                    'label_rombel'=> $row->label_rombel,
                ] : null,
                'jam_list'            => $jamMap[$id] ?? null,
                'total_hadir'         => $scanCounts[$id] ?? 0,
            ];
        })->values()->all();

        // Hitung ringkasan status untuk tanggal ini
        $summary = DB::table('presensi_sesi')
            ->where('tanggal', $tanggal)
            ->selectRaw("
                COUNT(*) AS total,
                SUM(status IN ('aktif','suspended')) AS sedang_berjalan,
                SUM(status = 'selesai') AS selesai,
                SUM(status IN ('gagal','expired','terputus')) AS bermasalah
            ")
            ->first();

        Response::success('Daftar sesi presensi.', [
            'data' => $data,
            'meta' => [
                'tanggal'  => $tanggal,
                'page'     => $page,
                'per_page' => $perPage,
                'total'    => $total,
                'last_page'=> (int) ceil($total / $perPage),
            ],
            'summary' => [
                'total'             => (int) ($summary->total ?? 0),
                'sedang_berjalan'   => (int) ($summary->sedang_berjalan ?? 0),
                'selesai'           => (int) ($summary->selesai ?? 0),
                'bermasalah'        => (int) ($summary->bermasalah ?? 0),
            ],
        ]);
    }
}
