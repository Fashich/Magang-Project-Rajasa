<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\RombelWaliKelas;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * EIzinIndexController
 * GET /api/e-izin — daftar pengajuan izin
 *
 * Role:
 *   admin      → semua izin + filter bebas
 *   guru       → izin siswa di rombel yang dia jadi wali kelas
 *   siswa      → izin milik sendiri
 *
 * Query params:
 *   status=pending|disetujui_wali|ditolak_wali|disetujui|ditolak|semua
 *   jenis=sakit|izin|dispensasi|semua
 *   page=1
 *
 * @author feature/e-izin
 */
final class EIzinIndexController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user     = $this->auth->user();
        $type     = $user->user_type;
        $status   = $_GET['status'] ?? 'semua';
        $jenis    = $_GET['jenis']  ?? 'semua';
        $page     = max(1, (int) ($_GET['page'] ?? 1));
        $perPage  = 20;

        $validStatuses = ['pending','disetujui_wali','ditolak_wali','disetujui','ditolak'];
        $validJenis    = ['sakit','izin','dispensasi'];

        $query = DB::table('e_izin AS ei')
            ->join('siswa AS s', 's.siswa_id', '=', 'ei.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->leftJoin('users AS uwali',  'uwali.user_id',  '=', 'ei.wali_approved_by')
            ->leftJoin('users AS ufinal', 'ufinal.user_id', '=', 'ei.final_approved_by')
            ->selectRaw("
                ei.izin_id,
                ei.siswa_id,
                s.nama_lengkap,
                r.label_rombel,
                ei.tanggal_mulai,
                ei.tanggal_selesai,
                DATEDIFF(ei.tanggal_selesai, ei.tanggal_mulai) + 1 AS jumlah_hari,
                ei.jenis,
                ei.alasan,
                ei.status,
                ei.wali_catatan,
                ei.final_catatan,
                ei.wali_approved_at,
                ei.final_approved_at,
                ei.submitted_at,
                uwali.username  AS wali_username,
                ufinal.username AS final_username
            ");

        // Scope per role
        if ($type === 'siswa') {
            $query->where('ei.siswa_id', (int) $user->siswa_id);
        } elseif (in_array($type, ['guru', 'staff'], true) && !empty($user->guru_id)) {
            $rombelIds = RombelWaliKelas::where('guru_id', (int) $user->guru_id)
                ->where('status', 'aktif')->pluck('rombel_id')->toArray();
            if (empty($rombelIds)) {
                Response::success('Daftar izin.', ['data'=>[], 'meta'=>['total'=>0,'last_page'=>1,'page'=>1]]);
                return;
            }
            $query->whereIn('s.rombel_id_aktif', $rombelIds);
        } elseif (!in_array($type, ['admin','super_admin'], true)) {
            Response::error('Akses ditolak.', [], 403); return;
        }

        // Filter
        if ($status !== 'semua' && in_array($status, $validStatuses, true)) {
            $query->where('ei.status', $status);
        }
        if ($jenis !== 'semua' && in_array($jenis, $validJenis, true)) {
            $query->where('ei.jenis', $jenis);
        }

        $total = $query->count();
        $rows  = $query->orderByDesc('ei.izin_id')
            ->limit($perPage)->offset(($page-1)*$perPage)->get();

        // Summary counts
        $summaryQ = DB::table('e_izin AS ei')
            ->join('siswa AS s', 's.siswa_id', '=', 'ei.siswa_id');
        if ($type === 'siswa') {
            $summaryQ->where('ei.siswa_id', (int) $user->siswa_id);
        } elseif (in_array($type, ['guru','staff'], true) && !empty($user->guru_id)) {
            $rombelIds = RombelWaliKelas::where('guru_id', (int)$user->guru_id)
                ->where('status','aktif')->pluck('rombel_id')->toArray();
            if (!empty($rombelIds)) $summaryQ->whereIn('s.rombel_id_aktif', $rombelIds);
        }
        $summary = $summaryQ->selectRaw("
            COUNT(*) AS total,
            SUM(ei.status = 'pending') AS pending,
            SUM(ei.status = 'disetujui_wali') AS menunggu_final,
            SUM(ei.status = 'disetujui') AS disetujui,
            SUM(ei.status IN ('ditolak','ditolak_wali')) AS ditolak
        ")->first();

        Response::success('Daftar izin.', [
            'data' => $rows->map(fn($r) => (array) $r)->values()->all(),
            'meta' => [
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => (int) ceil($total / $perPage),
            ],
            'summary' => [
                'total'          => (int)($summary->total         ?? 0),
                'pending'        => (int)($summary->pending        ?? 0),
                'menunggu_final' => (int)($summary->menunggu_final ?? 0),
                'disetujui'      => (int)($summary->disetujui      ?? 0),
                'ditolak'        => (int)($summary->ditolak        ?? 0),
            ],
        ]);
    }
}
