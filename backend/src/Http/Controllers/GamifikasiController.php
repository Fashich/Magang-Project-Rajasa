<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * GamifikasiController
 *
 * GET  /api/gamifikasi/profil          — profil poin + badge siswa (siswa: milik sendiri)
 * GET  /api/gamifikasi/leaderboard     — ranking poin per rombel/global
 * GET  /api/gamifikasi/badge           — daftar semua badge master
 * POST /api/gamifikasi/hitung          — hitung ulang poin & badge (admin/cron)
 * POST /api/gamifikasi/poin            — tambah poin manual (admin)
 *
 * @author feature/gamifikasi
 */
final class GamifikasiController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(): void
    {
        $user   = $this->auth->user();
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $path   = $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '';

        // Resolve sub-route dari path: /api/gamifikasi/profil → 'profil'
        $parts = explode('/', trim($path, '/'));
        $sub   = end($parts); // ambil segment terakhir

        match ($sub) {
            'profil'      => $this->profil($user),
            'leaderboard' => $this->leaderboard($user),
            'badge'       => $this->allBadge(),
            'hitung'      => $method === 'POST' ? $this->hitung($user) : Response::error('Method not allowed.', [], 405),
            'poin'        => $method === 'POST'  ? $this->tambahPoin($user) : Response::error('Method not allowed.', [], 405),
            default       => Response::error('Sub-route tidak ditemukan.', [], 404),
        };
    }

    // ── GET /api/gamifikasi/profil ────────────────────────────────────────────

    private function profil(object $user): void
    {
        $type = $user->user_type;

        // Resolve siswa_id
        if ($type === 'siswa') {
            $siswaId = (int) $user->siswa_id;
        } elseif (!empty($_GET['siswa_id'])) {
            $siswaId = (int) $_GET['siswa_id'];
        } elseif (in_array($type, ['admin', 'guru', 'staff'], true)) {
            // Admin/guru tanpa siswa_id → tampilkan ringkasan statistik global
            $this->profilGlobal();
            return;
        } else {
            Response::error('siswa_id diperlukan untuk role ini.', [], 422);
            return;
        }

        $siswa = DB::table('siswa AS s')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('s.siswa_id', $siswaId)
            ->selectRaw("s.siswa_id, s.nama_lengkap, s.nis, r.label_rombel")
            ->first();

        if (!$siswa) { Response::error('Siswa tidak ditemukan.', [], 404); return; }

        // Total poin
        $totalPoin = DB::table('gamifikasi_poin')
            ->where('siswa_id', $siswaId)
            ->sum('poin');

        // Poin bulan ini
        $bulanIni = Carbon::now()->format('Y-m');
        $poinBulanIni = DB::table('gamifikasi_poin')
            ->where('siswa_id', $siswaId)
            ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulanIni])
            ->sum('poin');

        // Ranking di rombel
        $ranking = $this->getRankingRombel($siswaId, $siswa->label_rombel);

        // Riwayat poin (20 terakhir)
        $riwayat = DB::table('gamifikasi_poin')
            ->where('siswa_id', $siswaId)
            ->orderByDesc('tanggal')->orderByDesc('poin_id')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'poin_id'    => (int) $r->poin_id,
                'tipe'       => $r->tipe,
                'poin'       => (int) $r->poin,
                'keterangan' => $r->keterangan ?? '',
                'tanggal'    => $r->tanggal,
            ])->values()->all();

        // Badge yang dimiliki
        $badge = DB::table('gamifikasi_badge_siswa AS bs')
            ->join('gamifikasi_badge AS b', 'b.badge_id', '=', 'bs.badge_id')
            ->where('bs.siswa_id', $siswaId)
            ->selectRaw("b.kode, b.nama, b.deskripsi, b.icon, b.warna, b.kategori, bs.diraih_at, bs.periode")
            ->orderByDesc('bs.diraih_at')
            ->get()
            ->map(fn ($r) => [
                'kode'       => $r->kode,
                'nama'       => $r->nama,
                'deskripsi'  => $r->deskripsi,
                'icon'       => $r->icon,
                'warna'      => $r->warna,
                'kategori'   => $r->kategori,
                'diraih_at'  => $r->diraih_at,
                'periode'    => $r->periode,
            ])->values()->all();

        // Streak saat ini
        $streak = $this->hitungStreakSaatIni($siswaId);

        Response::success('Profil gamifikasi.', [
            'siswa'        => [
                'siswa_id'    => (int) $siswa->siswa_id,
                'nama'        => $siswa->nama_lengkap,
                'nis'         => $siswa->nis,
                'rombel'      => $siswa->label_rombel ?? '—',
            ],
            'total_poin'       => (int) $totalPoin,
            'poin_bulan_ini'   => (int) $poinBulanIni,
            'ranking_rombel'   => $ranking,
            'streak_saat_ini'  => $streak,
            'badge'            => $badge,
            'riwayat_poin'     => $riwayat,
        ]);
    }

    // ── GET /api/gamifikasi/leaderboard ───────────────────────────────────────

    private function leaderboard(object $user): void
    {
        $rombelId = !empty($_GET['rombel_id']) ? (int) $_GET['rombel_id'] : null;
        $bulan    = $_GET['bulan'] ?? Carbon::now()->format('Y-m');
        $limit    = min(50, max(5, (int) ($_GET['limit'] ?? 10)));

        // Leaderboard berdasarkan total poin bulan tertentu
        $query = DB::table('gamifikasi_poin AS gp')
            ->join('siswa AS s', 's.siswa_id', '=', 'gp.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('s.status', 'aktif')
            ->whereRaw("DATE_FORMAT(gp.tanggal, '%Y-%m') = ?", [$bulan])
            ->selectRaw("
                gp.siswa_id,
                s.nama_lengkap,
                s.nis,
                r.rombel_id,
                r.label_rombel,
                SUM(gp.poin) AS total_poin,
                COUNT(CASE WHEN gp.tipe = 'hadir_tepat_waktu' THEN 1 END) AS hari_hadir
            ")
            ->groupBy('gp.siswa_id', 's.nama_lengkap', 's.nis', 'r.rombel_id', 'r.label_rombel');

        if ($rombelId) {
            $query->where('s.rombel_id_aktif', $rombelId);
        }

        $rows = $query->orderByDesc(DB::raw('SUM(gp.poin)'))
                      ->limit($limit)
                      ->get();

        $data = $rows->map(fn ($r, $i) => [
            'rank'         => $i + 1,
            'siswa_id'     => (int) $r->siswa_id,
            'nama_siswa'   => $r->nama_lengkap,
            'nis'          => $r->nis,
            'rombel_id'    => $r->rombel_id ? (int) $r->rombel_id : null,
            'label_rombel' => $r->label_rombel ?? '—',
            'total_poin'   => (int) $r->total_poin,
            'hari_hadir'   => (int) $r->hari_hadir,
            'is_self'      => $user->user_type === 'siswa' && (int) $user->siswa_id === (int) $r->siswa_id,
        ])->values()->all();

        // Posisi siswa login jika tidak masuk top
        $selfRank = null;
        if ($user->user_type === 'siswa') {
            $selfInTop = collect($data)->firstWhere('is_self', true);
            if (!$selfInTop) {
                $selfPoin = DB::table('gamifikasi_poin')
                    ->where('siswa_id', (int) $user->siswa_id)
                    ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulan])
                    ->sum('poin');
                $selfRankPos = DB::table('gamifikasi_poin AS gp')
                    ->join('siswa AS s', 's.siswa_id', '=', 'gp.siswa_id')
                    ->where('s.status', 'aktif')
                    ->whereRaw("DATE_FORMAT(gp.tanggal, '%Y-%m') = ?", [$bulan])
                    ->when($rombelId, fn ($q) => $q->where('s.rombel_id_aktif', $rombelId))
                    ->groupBy('gp.siswa_id')
                    ->havingRaw('SUM(gp.poin) > ?', [$selfPoin])
                    ->selectRaw('COUNT(DISTINCT gp.siswa_id) + 1 AS rank_pos')
                    ->value('rank_pos');
                $selfRank = ['rank' => (int) ($selfRankPos ?? 0), 'poin' => (int) $selfPoin];
            }
        }

        Response::success('Leaderboard gamifikasi.', [
            'bulan'     => $bulan,
            'leaderboard' => $data,
            'self_rank' => $selfRank,
        ]);
    }

    // ── GET /api/gamifikasi/badge ─────────────────────────────────────────────

    private function allBadge(): void
    {
        $badge = DB::table('gamifikasi_badge')
            ->where('is_aktif', 1)
            ->orderBy('kategori')
            ->orderBy('badge_id')
            ->get()
            ->map(fn ($r) => [
                'badge_id'    => (int) $r->badge_id,
                'kode'        => $r->kode,
                'nama'        => $r->nama,
                'deskripsi'   => $r->deskripsi,
                'icon'        => $r->icon,
                'warna'       => $r->warna,
                'kategori'    => $r->kategori,
                'poin_reward' => (int) $r->poin_reward,
            ])->values()->all();

        Response::success('Daftar badge.', ['badge' => $badge]);
    }

    // ── POST /api/gamifikasi/hitung ───────────────────────────────────────────
    // Hitung ulang poin dan badge untuk bulan tertentu

    private function hitung(object $user): void
    {
        if (!in_array($user->user_type, ['admin'], true)) {
            Response::error('Hanya admin yang dapat menjalankan kalkulasi.', [], 403);
            return;
        }

        $body       = $this->request->body();
        $bulan      = $body['bulan'] ?? Carbon::now()->format('Y-m');
        $siswaIdFilter = !empty($body['siswa_id']) ? (int) $body['siswa_id'] : null;

        if (!preg_match('/^\d{4}-\d{2}$/', $bulan)) {
            Response::error('Format bulan tidak valid (YYYY-MM).', [], 422);
            return;
        }

        [$tahun, $bln] = explode('-', $bulan);
        $dari   = Carbon::createFromDate((int)$tahun, (int)$bln, 1)->startOfMonth()->toDateString();
        $sampai = Carbon::createFromDate((int)$tahun, (int)$bln, 1)->endOfMonth()->toDateString();

        // Ambil semua siswa aktif (atau 1 siswa jika filter)
        $siswaQuery = DB::table('siswa')->where('status', 'aktif');
        if ($siswaIdFilter) $siswaQuery->where('siswa_id', $siswaIdFilter);
        $siswas = $siswaQuery->get();

        $processed = 0;
        $totalPoinDiberi = 0;
        $badgeDiberi = 0;

        foreach ($siswas as $siswa) {
            $sid = (int) $siswa->siswa_id;

            // Hapus log poin bulan ini (recalculate)
            DB::table('gamifikasi_poin')
                ->where('siswa_id', $sid)
                ->whereBetween('tanggal', [$dari, $sampai])
                ->whereIn('tipe', [
                    'hadir_tepat_waktu', 'hadir_terlambat', 'izin_surat',
                    'streak_7', 'streak_30', 'perfect_month', 'early_bird',
                    'submit_logbook', 'logbook_approved',
                ])
                ->delete();

            // Hitung poin kehadiran harian
            $presensi = DB::table('presensi_jam_siswa')
                ->where('siswa_id', $sid)
                ->whereBetween('tanggal', [$dari, $sampai])
                ->selectRaw("tanggal, status, scanned_at")
                ->orderBy('tanggal')
                ->get();

            $poinBulanan = 0;
            $alphaCount  = 0;
            $tanggalHadir = [];

            foreach ($presensi as $p) {
                $poin = match ($p->status) {
                    'hadir'     => 10,
                    'terlambat' => 5,
                    'izin'      => 3,
                    'sakit'     => 3,
                    default     => 0, // alpha = 0
                };

                if ($p->status === 'alpha') $alphaCount++;

                if ($poin > 0) {
                    DB::table('gamifikasi_poin')->insert([
                        'siswa_id'   => $sid,
                        'tipe'       => $p->status === 'hadir' ? 'hadir_tepat_waktu'
                                       : ($p->status === 'terlambat' ? 'hadir_terlambat' : 'izin_surat'),
                        'poin'       => $poin,
                        'keterangan' => "Presensi {$p->tanggal}",
                        'tanggal'    => $p->tanggal,
                        'created_at' => Carbon::now()->toDateTimeString(),
                    ]);
                    $poinBulanan += $poin;
                }

                if (in_array($p->status, ['hadir', 'terlambat'], true)) {
                    $tanggalHadir[] = $p->tanggal;
                }
            }

            // Bonus Perfect Month
            if ($alphaCount === 0 && count($presensi) > 0) {
                DB::table('gamifikasi_poin')->insert([
                    'siswa_id'   => $sid,
                    'tipe'       => 'perfect_month',
                    'poin'       => 100,
                    'keterangan' => "Perfect Month {$bulan}",
                    'tanggal'    => $sampai,
                    'created_at' => Carbon::now()->toDateTimeString(),
                ]);
                $poinBulanan += 100;
            }

            // Bonus Streak 7 & 30
            $maxStreak = $this->hitungMaxStreak($tanggalHadir);
            if ($maxStreak >= 7) {
                $bonusPoin = $maxStreak >= 30 ? 200 : 50;
                $tipe      = $maxStreak >= 30 ? 'streak_30' : 'streak_7';
                DB::table('gamifikasi_poin')->insert([
                    'siswa_id'   => $sid,
                    'tipe'       => $tipe,
                    'poin'       => $bonusPoin,
                    'keterangan' => "Streak {$maxStreak} hari berturut",
                    'tanggal'    => $sampai,
                    'created_at' => Carbon::now()->toDateTimeString(),
                ]);
                $poinBulanan += $bonusPoin;
            }

            // Poin logbook
            $logbookApproved = DB::table('logbook_praktik')
                ->where('siswa_id', $sid)
                ->where('status', 'disetujui')
                ->whereBetween('tanggal', [$dari, $sampai])
                ->count();

            if ($logbookApproved > 0) {
                DB::table('gamifikasi_poin')->insert([
                    'siswa_id'   => $sid,
                    'tipe'       => 'logbook_approved',
                    'poin'       => $logbookApproved * 10,
                    'keterangan' => "{$logbookApproved} logbook disetujui",
                    'tanggal'    => $sampai,
                    'related_table' => 'logbook_praktik',
                    'created_at' => Carbon::now()->toDateTimeString(),
                ]);
                $poinBulanan += $logbookApproved * 10;
            }

            // Hitung & berikan badge
            $badgeDiberi += $this->cekDanBeriBadge($sid, $bulan, $dari, $sampai, [
                'hadir_rate'    => count($presensi) > 0
                    ? round((count($tanggalHadir) / count($presensi)) * 100, 1)
                    : 0,
                'streak'        => $maxStreak,
                'perfect_month' => $alphaCount === 0 && count($presensi) > 0 ? 1 : 0,
                'logbook_count' => $logbookApproved,
            ]);

            $totalPoinDiberi += $poinBulanan;
            $processed++;
        }

        Response::success("Kalkulasi selesai: {$processed} siswa diproses.", [
            'processed'        => $processed,
            'total_poin'       => $totalPoinDiberi,
            'badge_diberikan'  => $badgeDiberi,
            'bulan'            => $bulan,
        ]);
    }

    // ── POST /api/gamifikasi/poin ─────────────────────────────────────────────

    private function tambahPoin(object $user): void
    {
        if (!in_array($user->user_type, ['admin'], true)) {
            Response::error('Hanya admin yang dapat menambah poin manual.', [], 403);
            return;
        }

        $body = $this->request->body();
        $siswaId  = (int) ($body['siswa_id'] ?? 0);
        $poin     = (int) ($body['poin']     ?? 0);
        $ket      = trim($body['keterangan'] ?? '');

        if (!$siswaId || $poin === 0) {
            Response::error('siswa_id dan poin wajib diisi.', [], 422);
            return;
        }

        DB::table('gamifikasi_poin')->insert([
            'siswa_id'   => $siswaId,
            'tipe'       => 'bonus_admin',
            'poin'       => $poin,
            'keterangan' => $ket ?: 'Bonus dari admin',
            'tanggal'    => Carbon::now()->toDateString(),
            'created_at' => Carbon::now()->toDateTimeString(),
        ]);

        Response::success('Poin berhasil ditambahkan.', [], 201);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function profilGlobal(): void
    {
        $bulan = Carbon::now()->format('Y-m');

        // Top 5 siswa bulan ini
        $top = DB::table('gamifikasi_poin AS gp')
            ->join('siswa AS s', 's.siswa_id', '=', 'gp.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('s.status', 'aktif')
            ->whereRaw("DATE_FORMAT(gp.tanggal, '%Y-%m') = ?", [$bulan])
            ->selectRaw("
                gp.siswa_id, s.nama_lengkap, s.nis, r.label_rombel,
                SUM(gp.poin) AS total_poin
            ")
            ->groupBy('gp.siswa_id', 's.nama_lengkap', 's.nis', 'r.label_rombel')
            ->orderByDesc(DB::raw('SUM(gp.poin)'))
            ->limit(5)
            ->get();

        // Total badge yang diraih bulan ini
        $totalBadge = DB::table('gamifikasi_badge_siswa')
            ->where('periode', $bulan)->count();

        // Total poin yang dibagikan bulan ini
        $totalPoin = DB::table('gamifikasi_poin')
            ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulan])
            ->sum('poin');

        // Total siswa yang sudah punya poin
        $totalSiswaAktif = DB::table('gamifikasi_poin')
            ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulan])
            ->distinct('siswa_id')->count('siswa_id');

        Response::success('Statistik gamifikasi global.', [
            'is_global'         => true,
            'bulan'             => $bulan,
            'total_poin_bulan'  => (int) $totalPoin,
            'total_badge_bulan' => (int) $totalBadge,
            'total_siswa_aktif' => (int) $totalSiswaAktif,
            'top_siswa'         => $top->map(fn ($r) => [
                'siswa_id'    => (int) $r->siswa_id,
                'nama_siswa'  => $r->nama_lengkap,
                'nis'         => $r->nis,
                'rombel'      => $r->label_rombel ?? '—',
                'total_poin'  => (int) $r->total_poin,
            ])->values()->all(),
        ]);
    }

    private function getRankingRombel(int $siswaId, ?string $rombel): array
    {
        $bulan = Carbon::now()->format('Y-m');

        $selfPoin = (int) DB::table('gamifikasi_poin')
            ->where('siswa_id', $siswaId)
            ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulan])
            ->sum('poin');

        // Hitung berapa siswa rombel yang poinnya lebih tinggi
        $lebihTinggi = DB::table('gamifikasi_poin AS gp')
            ->join('siswa AS s', 's.siswa_id', '=', 'gp.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('s.status', 'aktif')
            ->whereRaw("DATE_FORMAT(gp.tanggal, '%Y-%m') = ?", [$bulan])
            ->when($rombel, fn ($q) => $q->where('r.label_rombel', $rombel))
            ->groupBy('gp.siswa_id')
            ->havingRaw('SUM(gp.poin) > ?', [$selfPoin])
            ->selectRaw('gp.siswa_id')
            ->get()->count();

        return [
            'rank'       => $lebihTinggi + 1,
            'poin_bulan' => $selfPoin,
        ];
    }

    private function hitungMaxStreak(array $tanggals): int
    {
        if (empty($tanggals)) return 0;

        sort($tanggals);
        $maxStreak = 1;
        $current   = 1;

        for ($i = 1; $i < count($tanggals); $i++) {
            $prev = Carbon::parse($tanggals[$i - 1]);
            $curr = Carbon::parse($tanggals[$i]);

            if ($prev->addDay()->toDateString() === $curr->toDateString()) {
                $current++;
                $maxStreak = max($maxStreak, $current);
            } else {
                $current = 1;
            }
        }

        return $maxStreak;
    }

    private function hitungStreakSaatIni(int $siswaId): int
    {
        $today = Carbon::today()->toDateString();
        $streak = 0;
        $check  = Carbon::today();

        for ($i = 0; $i < 365; $i++) {
            $dateStr = $check->toDateString();
            $hadir = DB::table('presensi_jam_siswa')
                ->where('siswa_id', $siswaId)
                ->where('tanggal', $dateStr)
                ->whereIn('status', ['hadir', 'terlambat'])
                ->exists();

            if (!$hadir) break;
            $streak++;
            $check->subDay();
        }

        return $streak;
    }

    private function cekDanBeriBadge(
        int $siswaId, string $bulan, string $dari, string $sampai,
        array $stats
    ): int {
        $badges    = DB::table('gamifikasi_badge')->where('is_aktif', 1)->get();
        $diberi    = 0;
        $now       = Carbon::now()->toDateString();

        foreach ($badges as $badge) {
            $layak = match ($badge->kriteria_tipe) {
                'hadir_rate'    => $stats['hadir_rate']    >= (int) $badge->kriteria_nilai,
                'streak'        => $stats['streak']        >= (int) $badge->kriteria_nilai,
                'perfect_month' => $stats['perfect_month'] >= (int) $badge->kriteria_nilai,
                'logbook_count' => $stats['logbook_count'] >= (int) $badge->kriteria_nilai,
                'tiket_count'   => DB::table('tiket')
                                    ->where('dari_user_id', DB::table('users')
                                        ->where('siswa_id', $siswaId)->value('user_id'))
                                    ->where('status', 'closed')
                                    ->count() >= (int) $badge->kriteria_nilai,
                default         => false,
            };

            if (!$layak) continue;

            // Cek sudah dapat bulan ini
            $sudahAda = DB::table('gamifikasi_badge_siswa')
                ->where('siswa_id', $siswaId)
                ->where('badge_id', (int) $badge->badge_id)
                ->where('periode', $bulan)
                ->exists();

            if ($sudahAda) continue;

            // Berikan badge
            DB::table('gamifikasi_badge_siswa')->insert([
                'siswa_id'  => $siswaId,
                'badge_id'  => (int) $badge->badge_id,
                'diraih_at' => $now,
                'periode'   => $bulan,
                'created_at'=> Carbon::now()->toDateTimeString(),
            ]);

            // Berikan poin reward badge
            if ((int) $badge->poin_reward > 0) {
                DB::table('gamifikasi_poin')->insert([
                    'siswa_id'      => $siswaId,
                    'tipe'          => 'bonus_admin',
                    'poin'          => (int) $badge->poin_reward,
                    'keterangan'    => "Badge diraih: {$badge->nama}",
                    'related_table' => 'gamifikasi_badge',
                    'related_id'    => (int) $badge->badge_id,
                    'tanggal'       => $now,
                    'created_at'    => Carbon::now()->toDateTimeString(),
                ]);
            }

            // Notifikasi ke siswa
            $userId = DB::table('users')->where('siswa_id', $siswaId)->value('user_id');
            if ($userId) {
                DB::table('notifikasi_user')->insert([
                    'user_id'       => (int) $userId,
                    'tipe'          => 'success',
                    'judul'         => "Badge Baru: {$badge->icon} {$badge->nama}",
                    'pesan'         => $badge->deskripsi,
                    'related_table' => 'gamifikasi_badge',
                    'related_id'    => (int) $badge->badge_id,
                    'popup_until'   => Carbon::now()->addHours(72)->toDateTimeString(),
                    'is_read'       => 0,
                    'created_at'    => Carbon::now()->toDateTimeString(),
                ]);
            }

            $diberi++;
        }

        return $diberi;
    }
}
