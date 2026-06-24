<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * LogbookIndexController
 * GET /api/logbook
 *
 * Query params:
 *   siswa_id  — filter per siswa (guru/admin only)
 *   status    — filter status: draft|menunggu_review|disetujui|ditolak
 *   bulan     — YYYY-MM, default bulan ini
 *   page      — pagination (default 1)
 *   per_page  — default 20
 *
 * Role:
 *   siswa      → hanya logbook milik sendiri
 *   guru       → logbook siswa yang di-assign ke guru ini
 *   admin      → semua logbook, bisa filter siswa_id
 */
final class LogbookIndexController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user     = $this->auth->user();
        $type     = $user->user_type;
        $page     = max(1, (int) ($_GET['page']     ?? 1));
        $perPage  = max(1, min(100, (int) ($_GET['per_page'] ?? 20)));
        $status   = $_GET['status'] ?? '';
        $bulan    = $_GET['bulan']  ?? '';

        $query = DB::table('logbook_praktik AS lb')
            ->join('siswa AS s', 's.siswa_id', '=', 'lb.siswa_id')
            ->leftJoin('guru_staff AS g', 'g.guru_id', '=', 'lb.guru_id')
            ->leftJoin('users AS ur', 'ur.user_id', '=', 'lb.reviewed_by')
            ->selectRaw("
                lb.logbook_id,
                lb.siswa_id,
                lb.guru_id,
                lb.tanggal,
                lb.jam_mulai,
                lb.jam_selesai,
                lb.lokasi,
                lb.deskripsi,
                lb.foto_path,
                lb.status,
                lb.reviewed_by,
                lb.reviewed_at,
                lb.catatan_guru,
                lb.created_at,
                lb.updated_at,
                s.nama_lengkap   AS nama_siswa,
                s.nis,
                g.nama_lengkap   AS nama_guru
            ");

        // ── Filter berdasarkan role ────────────────────────────────────────────
        if ($type === 'siswa') {
            if (empty($user->siswa_id)) {
                Response::error('Data siswa tidak ditemukan.', [], 403);
                return;
            }
            $query->where('lb.siswa_id', (int) $user->siswa_id);

        } elseif (in_array($type, ['guru', 'staff'], true)) {
            if (empty($user->guru_id)) {
                Response::error('Data guru tidak ditemukan.', [], 403);
                return;
            }
            $query->where('lb.guru_id', (int) $user->guru_id);

            // Guru juga boleh lihat logbook siswa yg belum di-assign (menunggu_review)
            // dengan OR condition
            $guruId = (int) $user->guru_id;
            $query = DB::table('logbook_praktik AS lb')
                ->join('siswa AS s', 's.siswa_id', '=', 'lb.siswa_id')
                ->leftJoin('guru_staff AS g', 'g.guru_id', '=', 'lb.guru_id')
                ->leftJoin('users AS ur', 'ur.user_id', '=', 'lb.reviewed_by')
                ->selectRaw("
                    lb.logbook_id, lb.siswa_id, lb.guru_id, lb.tanggal,
                    lb.jam_mulai, lb.jam_selesai, lb.lokasi, lb.deskripsi,
                    lb.foto_path, lb.status, lb.reviewed_by, lb.reviewed_at,
                    lb.catatan_guru, lb.created_at, lb.updated_at,
                    s.nama_lengkap AS nama_siswa, s.nis,
                    g.nama_lengkap AS nama_guru
                ")
                ->where(function ($q) use ($guruId) {
                    $q->where('lb.guru_id', $guruId)
                      ->orWhere('lb.status', 'menunggu_review');
                });

        } elseif (!in_array($type, ['admin', 'super_admin'], true)) {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        // ── Filter opsional ───────────────────────────────────────────────────
        if (!empty($_GET['siswa_id']) && in_array($type, ['guru', 'staff', 'admin', 'super_admin'], true)) {
            $query->where('lb.siswa_id', (int) $_GET['siswa_id']);
        }

        if ($status && in_array($status, ['draft', 'menunggu_review', 'disetujui', 'ditolak'], true)) {
            $query->where('lb.status', $status);
        }

        if ($bulan && preg_match('/^\d{4}-\d{2}$/', $bulan)) {
            $query->whereRaw("DATE_FORMAT(lb.tanggal, '%Y-%m') = ?", [$bulan]);
        }

        // ── Pagination ────────────────────────────────────────────────────────
        $total  = (clone $query)->count();
        $rows   = $query->orderByDesc('lb.tanggal')
                        ->orderByDesc('lb.logbook_id')
                        ->offset(($page - 1) * $perPage)
                        ->limit($perPage)
                        ->get();

        $items = $rows->map(fn ($r) => $this->format($r))->values()->all();

        // ── Summary counts ────────────────────────────────────────────────────
        $summary = $this->buildSummary($user, $type);

        Response::success('Daftar logbook.', [
            'items'   => $items,
            'summary' => $summary,
            'meta'    => [
                'total'    => $total,
                'page'     => $page,
                'per_page' => $perPage,
                'pages'    => $perPage > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    private function format(object $r): array
    {
        return [
            'logbook_id'   => (int)    $r->logbook_id,
            'siswa_id'     => (int)    $r->siswa_id,
            'guru_id'      => $r->guru_id ? (int) $r->guru_id : null,
            'tanggal'      =>           $r->tanggal,
            'jam_mulai'    =>           $r->jam_mulai,
            'jam_selesai'  =>           $r->jam_selesai,
            'lokasi'       =>           $r->lokasi ?? '',
            'deskripsi'    =>           $r->deskripsi,
            'foto_path'    =>           $r->foto_path ?? null,
            'status'       =>           $r->status,
            'reviewed_by'  => $r->reviewed_by ? (int) $r->reviewed_by : null,
            'reviewed_at'  =>           $r->reviewed_at,
            'catatan_guru' =>           $r->catatan_guru ?? '',
            'created_at'   =>           $r->created_at,
            'updated_at'   =>           $r->updated_at,
            'nama_siswa'   =>           $r->nama_siswa ?? '',
            'nis'          =>           $r->nis ?? '',
            'nama_guru'    =>           $r->nama_guru ?? '',
        ];
    }

    private function buildSummary(object $user, string $type): array
    {
        $q = DB::table('logbook_praktik AS lb');

        if ($type === 'siswa') {
            $q->where('lb.siswa_id', (int) $user->siswa_id);
        } elseif (in_array($type, ['guru', 'staff'], true)) {
            $q->where('lb.guru_id', (int) $user->guru_id);
        }

        $counts = $q->selectRaw("
            COUNT(*) AS total,
            SUM(status = 'draft') AS draft,
            SUM(status = 'menunggu_review') AS menunggu,
            SUM(status = 'disetujui') AS disetujui,
            SUM(status = 'ditolak') AS ditolak
        ")->first();

        return [
            'total'     => (int) ($counts->total     ?? 0),
            'draft'     => (int) ($counts->draft      ?? 0),
            'menunggu'  => (int) ($counts->menunggu   ?? 0),
            'disetujui' => (int) ($counts->disetujui  ?? 0),
            'ditolak'   => (int) ($counts->ditolak    ?? 0),
        ];
    }
}
