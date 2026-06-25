<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * TiketController
 *
 * GET    /api/tiket              — daftar tiket (role-aware)
 * POST   /api/tiket              — buat tiket baru
 * GET    /api/tiket/{id}         — detail tiket + semua balasan
 * PATCH  /api/tiket/{id}         — update status/prioritas (guru/admin)
 * DELETE /api/tiket/{id}         — hapus tiket (admin/pemilik+open)
 *
 * POST   /api/tiket/{id}/balas   — kirim balasan
 *
 * @author feature/communication-hub
 */
final class TiketController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(?int $id = null, string $sub = ''): void
    {
        $user   = $this->auth->user();
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        // Route dispatch
        if ($id && $sub === 'balas') {
            $this->handleBalas($user, $id); return;
        }

        match (true) {
            $method === 'GET'    && !$id => $this->handleIndex($user),
            $method === 'POST'   && !$id => $this->handleCreate($user),
            $method === 'GET'    && !!$id => $this->handleDetail($user, $id),
            $method === 'PATCH'  && !!$id => $this->handleUpdate($user, $id),
            $method === 'DELETE' && !!$id => $this->handleDelete($user, $id),
            default => Response::error('Route tidak ditemukan.', [], 404),
        };
    }

    // ── GET /api/tiket ────────────────────────────────────────────────────────

    private function handleIndex(object $user): void
    {
        $type    = $user->user_type;
        $page    = max(1, (int) ($_GET['page']     ?? 1));
        $perPage = min(50, max(1, (int) ($_GET['per_page'] ?? 20)));
        $status  = $_GET['status']   ?? '';
        $kat     = $_GET['kategori'] ?? '';

        $query = DB::table('tiket AS t')
            ->join('users AS u_dari', 'u_dari.user_id', '=', 't.dari_user_id')
            ->leftJoin('users AS u_kepada', 'u_kepada.user_id', '=', 't.kepada_user_id')
            ->selectRaw("
                t.tiket_id, t.dari_user_id, t.kepada_user_id,
                t.kategori, t.prioritas, t.judul, t.status,
                t.reply_count, t.last_reply_at, t.created_at, t.updated_at,
                u_dari.username   AS username_dari,
                u_dari.user_type  AS usertype_dari,
                u_kepada.username AS username_kepada
            ");

        // Role-based visibility
        if ($type === 'siswa') {
            $query->where('t.dari_user_id', (int) $user->user_id);
        } elseif (in_array($type, ['guru'], true)) {
            // Guru lihat tiket yang ditujukan ke dia + tiket dari siswanya
            $query->where(function ($q) use ($user) {
                $q->where('t.kepada_user_id', (int) $user->user_id)
                  ->orWhereNull('t.kepada_user_id');
            });
        }
        // admin lihat semua

        // Filter
        if ($status && in_array($status, ['open','in_progress','waiting','resolved','closed'], true)) {
            $query->where('t.status', $status);
        }
        if ($kat) $query->where('t.kategori', $kat);
        if (!empty($_GET['search'])) {
            $query->where('t.judul', 'like', '%' . $_GET['search'] . '%');
        }

        $total = (clone $query)->count();
        $rows  = $query->orderByDesc('t.last_reply_at')
                       ->orderByDesc('t.created_at')
                       ->offset(($page - 1) * $perPage)
                       ->limit($perPage)
                       ->get();

        // Summary counts (untuk badge di sidebar)
        $summary = $this->buildSummary($user, $type);

        Response::success('Daftar tiket.', [
            'items'   => $rows->map(fn ($r) => $this->formatTiket($r))->values()->all(),
            'summary' => $summary,
            'meta'    => [
                'total'    => $total,
                'page'     => $page,
                'per_page' => $perPage,
                'pages'    => $perPage > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    // ── POST /api/tiket ───────────────────────────────────────────────────────

    private function handleCreate(object $user): void
    {
        $body   = $this->request->body();
        $errors = [];

        $judul    = trim($body['judul']    ?? '');
        $pesan    = trim($body['pesan']    ?? '');
        $kategori = $body['kategori']      ?? 'pertanyaan';
        $prioritas= $body['prioritas']     ?? 'normal';
        $kepadaId = !empty($body['kepada_user_id']) ? (int) $body['kepada_user_id'] : null;

        if (mb_strlen($judul) < 5)  $errors['judul'] = 'Judul minimal 5 karakter.';
        if (mb_strlen($pesan) < 10) $errors['pesan'] = 'Pesan minimal 10 karakter.';
        if (!in_array($kategori, ['pertanyaan','keluhan','izin_khusus','konsultasi','laporan_masalah','lainnya'], true)) {
            $errors['kategori'] = 'Kategori tidak valid.';
        }

        if (!empty($errors)) { Response::error('Data tidak valid.', $errors, 422); return; }

        $now  = Carbon::now()->toDateTimeString();
        $id   = DB::table('tiket')->insertGetId([
            'dari_user_id'   => (int) $user->user_id,
            'kepada_user_id' => $kepadaId,
            'kategori'       => $kategori,
            'prioritas'      => in_array($prioritas, ['rendah','normal','tinggi','urgent'], true) ? $prioritas : 'normal',
            'judul'          => $judul,
            'pesan'          => $pesan,
            'status'         => 'open',
            'last_reply_at'  => $now,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        // Notifikasi ke penerima atau ke semua admin
        $this->notifikasiPenerima($id, $judul, $user, $kepadaId);

        $tiket = $this->fetchTiket($id, $user);
        Response::success('Tiket berhasil dibuat.', ['tiket' => $tiket], 201);
    }

    // ── GET /api/tiket/{id} ───────────────────────────────────────────────────

    private function handleDetail(object $user, int $id): void
    {
        $tiket = $this->fetchTiket($id, $user);
        if (!$tiket) { Response::error('Tiket tidak ditemukan.', [], 404); return; }

        // Ambil semua balasan
        $isSiswa  = $user->user_type === 'siswa';
        $balasanQ = DB::table('tiket_balasan AS tb')
            ->join('users AS u', 'u.user_id', '=', 'tb.dari_user_id')
            ->where('tb.tiket_id', $id)
            ->selectRaw("
                tb.balasan_id, tb.tiket_id, tb.dari_user_id,
                tb.pesan, tb.is_internal, tb.created_at,
                u.username, u.user_type
            ");

        // Siswa tidak melihat catatan internal
        if ($isSiswa) $balasanQ->where('tb.is_internal', 0);

        $balasan = $balasanQ->orderBy('tb.created_at')->get()
            ->map(fn ($r) => [
                'balasan_id'   => (int)    $r->balasan_id,
                'tiket_id'     => (int)    $r->tiket_id,
                'dari_user_id' => (int)    $r->dari_user_id,
                'pesan'        =>           $r->pesan,
                'is_internal'  => (bool)   $r->is_internal,
                'is_own'       => (int) $user->user_id === (int) $r->dari_user_id,
                'username'     =>           $r->username,
                'user_type'    =>           $r->user_type,
                'created_at'   =>           $r->created_at,
            ])->values()->all();

        Response::success('Detail tiket.', [
            'tiket'   => $tiket,
            'balasan' => $balasan,
        ]);
    }

    // ── PATCH /api/tiket/{id} ─────────────────────────────────────────────────

    private function handleUpdate(object $user, int $id): void
    {
        $type  = $user->user_type;
        $body  = $this->request->body();
        $tiket = DB::table('tiket')->where('tiket_id', $id)->first();

        if (!$tiket) { Response::error('Tiket tidak ditemukan.', [], 404); return; }

        // Siswa hanya bisa close tiket miliknya sendiri
        if ($type === 'siswa') {
            if ((int) $tiket->dari_user_id !== (int) $user->user_id) {
                Response::error('Bukan tiket milik Anda.', [], 403); return;
            }
            if (isset($body['status']) && $body['status'] !== 'closed') {
                Response::error('Siswa hanya dapat menutup tiket.', [], 403); return;
            }
        }

        $update = ['updated_at' => Carbon::now()->toDateTimeString()];

        if (isset($body['status']) && in_array($body['status'],
            ['open','in_progress','waiting','resolved','closed'], true)) {
            $update['status'] = $body['status'];
            if (in_array($body['status'], ['resolved','closed'], true)) {
                $update['ditutup_by'] = (int) $user->user_id;
                $update['ditutup_at'] = Carbon::now()->toDateTimeString();
            }
        }

        if (isset($body['prioritas']) && in_array($body['prioritas'],
            ['rendah','normal','tinggi','urgent'], true) &&
            in_array($type, ['guru','admin'], true)) {
            $update['prioritas'] = $body['prioritas'];
        }

        if (isset($body['kepada_user_id']) && in_array($type, ['admin'], true)) {
            $update['kepada_user_id'] = $body['kepada_user_id'] ? (int) $body['kepada_user_id'] : null;
        }

        DB::table('tiket')->where('tiket_id', $id)->update($update);

        $tiketResult = $this->fetchTiket($id, $user);
        Response::success('Tiket diperbarui.', ['tiket' => $tiketResult]);
    }

    // ── DELETE /api/tiket/{id} ────────────────────────────────────────────────

    private function handleDelete(object $user, int $id): void
    {
        $type  = $user->user_type;
        $tiket = DB::table('tiket')->where('tiket_id', $id)->first();

        if (!$tiket) { Response::error('Tiket tidak ditemukan.', [], 404); return; }

        // Siswa hanya bisa hapus tiket open miliknya
        if ($type === 'siswa') {
            if ((int) $tiket->dari_user_id !== (int) $user->user_id) {
                Response::error('Bukan tiket milik Anda.', [], 403); return;
            }
            if ($tiket->status !== 'open') {
                Response::error('Hanya tiket open yang dapat dihapus.', [], 409); return;
            }
        } elseif (!in_array($type, ['admin'], true)) {
            Response::error('Akses ditolak.', [], 403); return;
        }

        DB::table('tiket')->where('tiket_id', $id)->delete();
        Response::success('Tiket berhasil dihapus.', []);
    }

    // ── POST /api/tiket/{id}/balas ────────────────────────────────────────────

    private function handleBalas(object $user, int $id): void
    {
        $tiket = DB::table('tiket')->where('tiket_id', $id)->first();
        if (!$tiket) { Response::error('Tiket tidak ditemukan.', [], 404); return; }

        if (in_array($tiket->status, ['resolved','closed'], true)) {
            Response::error('Tidak dapat membalas tiket yang sudah ditutup.', [], 409); return;
        }

        $body  = $this->request->body();
        $pesan = trim($body['pesan'] ?? '');

        if (mb_strlen($pesan) < 1) {
            Response::error('Pesan tidak boleh kosong.', ['pesan' => 'Wajib diisi.'], 422); return;
        }

        $isInternal = !empty($body['is_internal']) &&
                      in_array($user->user_type, ['guru','admin'], true)
                      ? 1 : 0;

        $now = Carbon::now()->toDateTimeString();

        DB::table('tiket_balasan')->insert([
            'tiket_id'     => $id,
            'dari_user_id' => (int) $user->user_id,
            'pesan'        => $pesan,
            'is_internal'  => $isInternal,
            'created_at'   => $now,
        ]);

        // Update tiket: reply_count, last_reply_at, status
        $newStatus = $tiket->status;
        if (in_array($user->user_type, ['guru','admin'], true)) {
            $newStatus = 'in_progress';
        } elseif ($tiket->status === 'resolved') {
            $newStatus = 'waiting'; // Siswa balas setelah resolved → reopen
        }

        DB::table('tiket')->where('tiket_id', $id)->update([
            'reply_count'   => DB::raw('reply_count + 1'),
            'last_reply_at' => $now,
            'status'        => $newStatus,
            'updated_at'    => $now,
        ]);

        // Notifikasi ke pihak lain
        $this->notifikasiBalasan($id, $tiket, $user, $isInternal);

        Response::success('Balasan terkirim.', []);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function fetchTiket(int $id, object $user): ?array
    {
        $r = DB::table('tiket AS t')
            ->join('users AS u_dari',    'u_dari.user_id',    '=', 't.dari_user_id')
            ->leftJoin('users AS u_kepada', 'u_kepada.user_id', '=', 't.kepada_user_id')
            ->where('t.tiket_id', $id)
            ->selectRaw("
                t.*, u_dari.username AS username_dari, u_dari.user_type AS usertype_dari,
                u_kepada.username AS username_kepada
            ")
            ->first();

        return $r ? $this->formatTiket($r, $user) : null;
    }

    private function formatTiket(object $r, ?object $user = null): array
    {
        return [
            'tiket_id'        => (int)  $r->tiket_id,
            'dari_user_id'    => (int)  $r->dari_user_id,
            'kepada_user_id'  => $r->kepada_user_id ? (int) $r->kepada_user_id : null,
            'kategori'        =>        $r->kategori,
            'prioritas'       =>        $r->prioritas,
            'judul'           =>        $r->judul,
            'pesan'           =>        $r->pesan ?? '',
            'status'          =>        $r->status,
            'reply_count'     => (int)  $r->reply_count,
            'last_reply_at'   =>        $r->last_reply_at,
            'created_at'      =>        $r->created_at,
            'updated_at'      =>        $r->updated_at,
            'username_dari'   =>        $r->username_dari  ?? '',
            'usertype_dari'   =>        $r->usertype_dari  ?? '',
            'username_kepada' =>        $r->username_kepada ?? '',
            'is_own'          => $user ? (int) $user->user_id === (int) $r->dari_user_id : false,
        ];
    }

    private function buildSummary(object $user, string $type): array
    {
        $q = DB::table('tiket AS t');
        if ($type === 'siswa') {
            $q->where('t.dari_user_id', (int) $user->user_id);
        } elseif (in_array($type, ['guru'], true)) {
            $q->where(function ($qb) use ($user) {
                $qb->where('t.kepada_user_id', (int) $user->user_id)
                   ->orWhereNull('t.kepada_user_id');
            });
        }

        $counts = $q->selectRaw("
            COUNT(*) AS total,
            SUM(status = 'open') AS open,
            SUM(status = 'in_progress') AS in_progress,
            SUM(status = 'waiting') AS waiting,
            SUM(status IN ('resolved','closed')) AS selesai
        ")->first();

        return [
            'total'       => (int) ($counts->total       ?? 0),
            'open'        => (int) ($counts->open        ?? 0),
            'in_progress' => (int) ($counts->in_progress ?? 0),
            'waiting'     => (int) ($counts->waiting     ?? 0),
            'selesai'     => (int) ($counts->selesai     ?? 0),
        ];
    }

    private function notifikasiPenerima(int $tiketId, string $judul, object $user, ?int $kepadaId): void
    {
        $now = Carbon::now()->toDateTimeString();

        if ($kepadaId) {
            // Notif ke user tertentu
            DB::table('notifikasi_user')->insert([
                'user_id'       => $kepadaId,
                'tipe'          => 'info',
                'judul'         => 'Tiket Baru',
                'pesan'         => "{$user->username} mengirim tiket: {$judul}",
                'related_table' => 'tiket',
                'related_id'    => $tiketId,
                'popup_until'   => Carbon::now()->addHours(24)->toDateTimeString(),
                'is_read'       => 0,
                'created_at'    => $now,
            ]);
        } else {
            // Broadcast ke semua admin aktif
            $admins = DB::table('users')
                ->whereIn('user_type', ['admin'])
                ->where('status', 'aktif')
                ->pluck('user_id');

            $inserts = $admins->map(fn ($uid) => [
                'user_id'       => $uid,
                'tipe'          => 'info',
                'judul'         => 'Tiket Baru',
                'pesan'         => "{$user->username} mengirim tiket: {$judul}",
                'related_table' => 'tiket',
                'related_id'    => $tiketId,
                'popup_until'   => Carbon::now()->addHours(24)->toDateTimeString(),
                'is_read'       => 0,
                'created_at'    => $now,
            ])->toArray();

            if (!empty($inserts)) DB::table('notifikasi_user')->insert($inserts);
        }
    }

    private function notifikasiBalasan(int $tiketId, object $tiket, object $user, int $isInternal): void
    {
        if ($isInternal) return; // Catatan internal tidak notif siapapun

        $now        = Carbon::now()->toDateTimeString();
        $targetId   = (int) $user->user_id === (int) $tiket->dari_user_id
            ? $tiket->kepada_user_id  // Pemilik balas → notif ke penerima
            : $tiket->dari_user_id;   // Penerima balas → notif ke pemilik

        if (!$targetId) return;

        DB::table('notifikasi_user')->insert([
            'user_id'       => $targetId,
            'tipe'          => 'info',
            'judul'         => 'Balasan Tiket',
            'pesan'         => "{$user->username} membalas tiket: {$tiket->judul}",
            'related_table' => 'tiket',
            'related_id'    => $tiketId,
            'popup_until'   => Carbon::now()->addHours(12)->toDateTimeString(),
            'is_read'       => 0,
            'created_at'    => $now,
        ]);
    }
}
