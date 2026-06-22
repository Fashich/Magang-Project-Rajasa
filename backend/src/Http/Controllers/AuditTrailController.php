<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * AuditTrailController
 *
 * GET /api/admin/audit
 * Query params:
 *   tab=sessions|activities   (default: sessions)
 *   user_id=                  (opsional — filter per user)
 *   tanggal_dari=Y-m-d        (default: 7 hari lalu)
 *   tanggal_sampai=Y-m-d      (default: hari ini)
 *   page=1
 *
 * @author feature/admin-dashboard
 */
final class AuditTrailController
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

        $tab           = $_GET['tab']            ?? 'sessions';
        $userId        = isset($_GET['user_id']) && $_GET['user_id'] !== ''
                            ? (int) $_GET['user_id'] : null;
        $tanggalDari   = $_GET['tanggal_dari']   ?? Carbon::now()->subDays(6)->toDateString();
        $tanggalSampai = $_GET['tanggal_sampai'] ?? Carbon::now()->toDateString();
        $page          = max(1, (int) ($_GET['page'] ?? 1));
        $perPage       = 25;

        // Validasi tanggal
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalDari))  $tanggalDari   = Carbon::now()->subDays(6)->toDateString();
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalSampai)) $tanggalSampai = Carbon::now()->toDateString();

        if ($tab === 'activities') {
            $this->handleActivities($userId, $tanggalDari, $tanggalSampai, $page, $perPage);
        } else {
            $this->handleSessions($userId, $tanggalDari, $tanggalSampai, $page, $perPage);
        }
    }

    // ── Tab: Login Sessions ───────────────────────────────────────────────────

    private function handleSessions(
        ?int $userId, string $dari, string $sampai, int $page, int $perPage
    ): void {
        $query = DB::table('user_sessions AS s')
            ->join('users AS u', 'u.user_id', '=', 's.user_id')
            ->whereBetween(DB::raw('DATE(s.logged_in_at)'), [$dari, $sampai])
            ->selectRaw("
                s.session_id,
                s.user_id,
                u.username,
                u.user_type,
                s.ip_address,
                s.user_agent,
                s.logged_in_at,
                s.last_activity,
                s.logout_at,
                s.is_online
            ");

        if ($userId !== null) {
            $query->where('s.user_id', $userId);
        }

        $total  = $query->count();
        $offset = ($page - 1) * $perPage;

        $rows = $query
            ->orderByDesc('s.logged_in_at')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        // Summary: aktif sekarang & login hari ini
        $summaryQ = DB::table('user_sessions AS s')
            ->whereBetween(DB::raw('DATE(s.logged_in_at)'), [$dari, $sampai]);
        if ($userId !== null) $summaryQ->where('s.user_id', $userId);

        $summary = $summaryQ->selectRaw("
            COUNT(*) AS total_session,
            SUM(s.is_online = 1) AS sedang_online,
            SUM(DATE(s.logged_in_at) = CURDATE()) AS login_hari_ini,
            COUNT(DISTINCT s.user_id) AS unique_users
        ")->first();

        $data = $rows->map(function ($row) {
            // Durasi sesi dalam menit
            $start    = new \DateTime($row->logged_in_at);
            $end      = $row->logout_at ? new \DateTime($row->logout_at) : new \DateTime();
            $durMenit = (int) round(($end->getTimestamp() - $start->getTimestamp()) / 60);

            // Deteksi device kasar dari User-Agent
            $ua = $row->user_agent ?? '';
            $device = 'Desktop';
            if (preg_match('/Mobile|Android|iPhone/i', $ua)) $device = 'Mobile';
            elseif (preg_match('/Tablet|iPad/i', $ua)) $device = 'Tablet';

            return [
                'session_id'    => (int) $row->session_id,
                'user_id'       => (int) $row->user_id,
                'username'      => $row->username,
                'user_type'     => $row->user_type,
                'ip_address'    => $row->ip_address ?? '—',
                'device'        => $device,
                'logged_in_at'  => $row->logged_in_at,
                'last_activity' => $row->last_activity,
                'logout_at'     => $row->logout_at,
                'is_online'     => (bool) $row->is_online,
                'durasi_menit'  => $durMenit,
            ];
        })->values()->all();

        Response::success('Riwayat sesi login.', [
            'tab'  => 'sessions',
            'data' => $data,
            'meta' => [
                'tanggal_dari'   => $dari,
                'tanggal_sampai' => $sampai,
                'page'           => $page,
                'per_page'       => $perPage,
                'total'          => $total,
                'last_page'      => (int) ceil($total / $perPage),
            ],
            'summary' => [
                'total_session'  => (int) ($summary->total_session  ?? 0),
                'sedang_online'  => (int) ($summary->sedang_online  ?? 0),
                'login_hari_ini' => (int) ($summary->login_hari_ini ?? 0),
                'unique_users'   => (int) ($summary->unique_users   ?? 0),
            ],
        ]);
    }

    // ── Tab: User Activities ─────────────────────────────────────────────────

    private function handleActivities(
        ?int $userId, string $dari, string $sampai, int $page, int $perPage
    ): void {
        $query = DB::table('user_activities AS a')
            ->leftJoin('users AS u', 'u.user_id', '=', 'a.user_id')
            ->whereBetween(DB::raw('DATE(a.created_at)'), [$dari, $sampai])
            ->selectRaw("
                a.activity_id,
                a.user_id,
                u.username,
                u.user_type,
                a.activity_type,
                a.module_name,
                a.target_table,
                a.target_id,
                a.activity_description,
                a.ip_address,
                a.created_at
            ");

        if ($userId !== null) {
            $query->where('a.user_id', $userId);
        }

        $total  = $query->count();
        $offset = ($page - 1) * $perPage;

        $rows = $query
            ->orderByDesc('a.activity_id')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        // Summary
        $summaryQ = DB::table('user_activities AS a')
            ->whereBetween(DB::raw('DATE(a.created_at)'), [$dari, $sampai]);
        if ($userId !== null) $summaryQ->where('a.user_id', $userId);

        $summary = $summaryQ->selectRaw("
            COUNT(*) AS total_aktivitas,
            COUNT(DISTINCT a.user_id) AS unique_users,
            COUNT(DISTINCT a.module_name) AS module_count,
            SUM(DATE(a.created_at) = CURDATE()) AS aktivitas_hari_ini
        ")->first();

        $data = $rows->map(function ($row) {
            return [
                'activity_id'          => (int) $row->activity_id,
                'user_id'              => $row->user_id ? (int) $row->user_id : null,
                'username'             => $row->username ?? 'System',
                'user_type'            => $row->user_type ?? '—',
                'activity_type'        => $row->activity_type,
                'module_name'          => $row->module_name,
                'target_table'         => $row->target_table,
                'target_id'            => $row->target_id ? (int) $row->target_id : null,
                'activity_description' => $row->activity_description,
                'ip_address'           => $row->ip_address ?? '—',
                'created_at'           => $row->created_at,
            ];
        })->values()->all();

        Response::success('Log aktivitas pengguna.', [
            'tab'  => 'activities',
            'data' => $data,
            'meta' => [
                'tanggal_dari'   => $dari,
                'tanggal_sampai' => $sampai,
                'page'           => $page,
                'per_page'       => $perPage,
                'total'          => $total,
                'last_page'      => (int) ceil($total / $perPage),
            ],
            'summary' => [
                'total_aktivitas'    => (int) ($summary->total_aktivitas    ?? 0),
                'unique_users'       => (int) ($summary->unique_users       ?? 0),
                'module_count'       => (int) ($summary->module_count       ?? 0),
                'aktivitas_hari_ini' => (int) ($summary->aktivitas_hari_ini ?? 0),
            ],
        ]);
    }
}
