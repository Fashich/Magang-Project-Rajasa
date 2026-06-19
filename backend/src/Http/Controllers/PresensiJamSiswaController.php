<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;

final class PresensiJamSiswaController
{
    private const VALID_STATUSES = [
        'alpha',
        'hadir',
        'terlambat',
        'izin',
        'sakit',
    ];

    public function __construct(
        private readonly Request $request,
        private readonly PermissionMiddleware $permission
    ) {
    }

    public function __invoke(): void
    {
        $this->permission->require('attendance.manual.read');

        $tanggal = trim((string) $this->request->input('tanggal', date('Y-m-d')));
        $rombelId = trim((string) $this->request->input('rombel_id', ''));
        $jamId = trim((string) $this->request->input('jam_id', ''));
        $status = trim((string) $this->request->input('status', ''));
        $q = trim((string) $this->request->input('q', ''));

        $this->validateDate($tanggal);

        if ($status !== '' && !in_array($status, self::VALID_STATUSES, true)) {
            throw new HttpException('Status filter tidak valid.', 422, [
                'status' => 'Status harus salah satu dari: ' . implode(', ', self::VALID_STATUSES),
            ]);
        }

        $query = DB::table('presensi_jam_siswa as p')
            ->join('siswa as s', 's.siswa_id', '=', 'p.siswa_id')
            ->leftJoin('rombel as r', 'r.rombel_id', '=', 'p.rombel_id_snapshot')
            ->leftJoin('jam_pembelajaran as j', 'j.jam_id', '=', 'p.jam_id')
            ->leftJoin('users as input_user', 'input_user.user_id', '=', 'p.input_by_user_id')
            ->leftJoin('users as edit_user', 'edit_user.user_id', '=', 'p.edited_by_user_id')
            ->where('p.tanggal', $tanggal);

        if ($rombelId !== '') {
            $query->where('p.rombel_id_snapshot', (int) $rombelId);
        }

        if ($jamId !== '') {
            $query->where('p.jam_id', (int) $jamId);
        }

        if ($status !== '') {
            $query->where('p.status', $status);
        }

        if ($q !== '') {
            $query->where(function ($query) use ($q): void {
                $query
                    ->where('s.nama_lengkap', 'like', '%' . $q . '%')
                    ->orWhere('s.nisn', 'like', '%' . $q . '%');
            });
        }

        $rows = $query
            ->orderBy('r.tingkat_angka')
            ->orderBy('r.label_rombel')
            ->orderBy('j.jam_ke')
            ->orderBy('s.nama_lengkap')
            ->limit(300)
            ->get([
                'p.presensi_id',
                'p.tanggal',
                'p.siswa_id',
                's.nisn',
                's.nama_lengkap',
                's.kelas_aktif',
                'p.rombel_id_snapshot',
                'r.label_rombel',
                'p.jam_id',
                'j.jam_ke',
                'j.label_jam',
                'p.status',
                'p.mode_presensi',
                'p.presensi_sesi_id',
                'p.scan_log_id',
                'p.input_by_user_id',
                'input_user.username as input_by_username',
                'p.scanned_at',
                'p.edited_by_user_id',
                'edit_user.username as edited_by_username',
                'p.edited_at',
                'p.keterangan',
            ])
            ->map(fn (object $row): array => $this->formatRow($row))
            ->values()
            ->all();

        Response::success('Daftar presensi siswa.', [
            'filters' => [
                'tanggal' => $tanggal,
                'rombel_id' => $rombelId !== '' ? (int) $rombelId : null,
                'jam_id' => $jamId !== '' ? (int) $jamId : null,
                'status' => $status !== '' ? $status : null,
                'q' => $q !== '' ? $q : null,
            ],
            'total' => count($rows),
            'items' => $rows,
        ]);
    }

    private function validateDate(string $tanggal): void
    {
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $tanggal);

        if (!$date || $date->format('Y-m-d') !== $tanggal) {
            throw new HttpException('Tanggal tidak valid.', 422, [
                'tanggal' => 'Format tanggal harus YYYY-MM-DD.',
            ]);
        }
    }

    private function formatRow(object $row): array
    {
        return [
            'presensi_id' => (int) $row->presensi_id,
            'tanggal' => $row->tanggal,
            'siswa' => [
                'siswa_id' => (int) $row->siswa_id,
                'nisn' => $row->nisn,
                'nama_lengkap' => $row->nama_lengkap,
                'kelas_aktif' => $row->kelas_aktif,
            ],
            'rombel' => [
                'rombel_id' => $row->rombel_id_snapshot !== null ? (int) $row->rombel_id_snapshot : null,
                'label_rombel' => $row->label_rombel,
            ],
            'jam' => [
                'jam_id' => (int) $row->jam_id,
                'jam_ke' => $row->jam_ke !== null ? (int) $row->jam_ke : null,
                'label_jam' => $row->label_jam,
            ],
            'status' => $row->status,
            'mode_presensi' => $row->mode_presensi,
            'presensi_sesi_id' => $row->presensi_sesi_id !== null ? (int) $row->presensi_sesi_id : null,
            'scan_log_id' => $row->scan_log_id !== null ? (int) $row->scan_log_id : null,
            'input_by_user_id' => $row->input_by_user_id !== null ? (int) $row->input_by_user_id : null,
            'input_by_username' => $row->input_by_username,
            'scanned_at' => $row->scanned_at,
            'edited_by_user_id' => $row->edited_by_user_id !== null ? (int) $row->edited_by_user_id : null,
            'edited_by_username' => $row->edited_by_username,
            'edited_at' => $row->edited_at,
            'keterangan' => $row->keterangan,
        ];
    }
}