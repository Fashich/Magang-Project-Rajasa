<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;

final class PresensiSessionService
{
    private array $columnsCache = [];

    public function create(array $input, int $userId): array
    {
        $mode = strtolower((string) ($input['mode_presensi'] ?? ''));
        $rombelId = $input['rombel_id'] ?? null;
        $jamIds = $this->normalizeJamIds($input['jam_ids'] ?? []);
        $tanggal = date('Y-m-d');

        if (!in_array($mode, ['rombel', 'piket'], true)) {
            throw new HttpException('Mode presensi tidak valid.', 422);
        }

        $this->validateJamIds($jamIds);

        $tahunAjaran = $this->activeTahunAjaran();

        $rombel = null;

        if ($mode === 'rombel') {
            if (!$rombelId) {
                throw new HttpException('Rombel wajib dipilih.', 422);
            }

            $rombel = DB::table('rombel')->where('rombel_id', (int) $rombelId)->first();

            if (!$rombel) {
                throw new HttpException('Rombel tidak ditemukan.', 404);
            }

            $this->ensureRombelSessionAvailable($tanggal, (int) $rombel->rombel_id, $jamIds);
        }

        if ($mode === 'piket' && $rombelId) {
            throw new HttpException('Mode piket tidak boleh memilih rombel.', 422);
        }

        $room = $this->resolveRoom($mode, $input['ruang_pilihan'] ?? null, $rombel);

        if ($mode === 'rombel' && str_starts_with($room['ruang_pilihan'], 'lab-')) {
            $this->ensureLabAvailable($tanggal, $jamIds, $room['ruang_pilihan']);
        }

        return DB::connection()->transaction(function () use ($mode, $rombel, $jamIds, $tanggal, $tahunAjaran, $room, $userId): array {
            $semester = $tahunAjaran->semester_aktif ?? 'ganjil';

            $payload = [
                'session_uuid' => $this->uuidV4(),
                'tanggal' => $tanggal,
                'mode_presensi' => $mode,
                'rombel_id' => $rombel?->rombel_id,
                'tahun_ajaran_id' => $rombel?->tahun_ajaran_id ?: $tahunAjaran->tahun_ajaran_id,
                'semester' => $semester,
                'ruang_pilihan' => $room['ruang_pilihan'],
                'ruang_label_snapshot' => $room['ruang_label_snapshot'],
                'status_sesi' => 'aktif',
                'status' => 'aktif',
                'created_by_user_id' => $userId,
                'opened_by_user_id' => $userId,
                'started_by_user_id' => $userId,
                'started_at' => date('Y-m-d H:i:s'),
                'opened_at' => date('Y-m-d H:i:s'),
            ];

            $sessionId = (int) DB::table('presensi_sesi')->insertGetId(
                $this->filterPayload('presensi_sesi', $payload)
            );

            $this->insertSessionJams($sessionId, $jamIds);

            if ($mode === 'rombel' && $rombel) {
                $this->initAlphaRows($sessionId, (int) $rombel->rombel_id, $jamIds, $tanggal, (int) ($rombel->tahun_ajaran_id ?: $tahunAjaran->tahun_ajaran_id), (string) $semester, $userId);
            }

            return $this->detail($sessionId);
        });
    }

    public function activeForUser(int $userId): array
    {
        $statusColumn = $this->sessionStatusColumn();

        $query = DB::table('presensi_sesi')
            ->whereIn($statusColumn, ['aktif', 'suspended'])
            ->orderByDesc('presensi_sesi_id');

        foreach (['created_by_user_id', 'opened_by_user_id', 'started_by_user_id'] as $column) {
            if ($this->hasColumn('presensi_sesi', $column)) {
                $query->where($column, $userId);
                break;
            }
        }

        return $query->get()->map(fn ($row) => (array) $row)->all();
    }

    public function pause(int $sessionId, int $userId): array
    {
        $this->updateStatus($sessionId, 'suspended', $userId);

        return $this->detail($sessionId);
    }

    public function resume(int $sessionId, int $userId): array
    {
        $this->updateStatus($sessionId, 'aktif', $userId);

        return $this->detail($sessionId);
    }

    public function finish(int $sessionId, int $userId): array
    {
        $payload = [
            $this->sessionStatusColumn() => 'selesai',
            'closed_by_user_id' => $userId,
            'closed_at' => date('Y-m-d H:i:s'),
            'finished_at' => date('Y-m-d H:i:s'),
        ];

        DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->update($this->filterPayload('presensi_sesi', $payload));

        return $this->detail($sessionId);
    }

    public function detail(int $sessionId): array
    {
        $session = DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->first();

        if (!$session) {
            throw new HttpException('Sesi presensi tidak ditemukan.', 404);
        }

        $jams = DB::table('presensi_sesi_jam')
            ->where('presensi_sesi_id', $sessionId)
            ->pluck('jam_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        return [
            'session' => (array) $session,
            'jam_ids' => $jams,
        ];
    }

    private function updateStatus(int $sessionId, string $status, int $userId): void
    {
        $this->detail($sessionId);

        $payload = [
            $this->sessionStatusColumn() => $status,
            'updated_by_user_id' => $userId,
        ];

        DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->update($this->filterPayload('presensi_sesi', $payload));
    }

    private function normalizeJamIds(mixed $value): array
    {
        if (!is_array($value)) {
            throw new HttpException('Jam pelajaran wajib dipilih.', 422);
        }

        $ids = array_values(array_unique(array_map('intval', $value)));
        sort($ids);

        return array_filter($ids, fn ($id) => $id > 0);
    }

    private function validateJamIds(array $jamIds): void
    {
        if ($jamIds === []) {
            throw new HttpException('Jam pelajaran wajib dipilih.', 422);
        }

        if (count($jamIds) > 3) {
            throw new HttpException('Jam pelajaran maksimal 3 jam.', 422);
        }

        for ($i = 1; $i < count($jamIds); $i++) {
            if ($jamIds[$i] !== $jamIds[$i - 1] + 1) {
                throw new HttpException('Jam pelajaran harus berurutan.', 422);
            }
        }

        $exists = DB::table('jam_pembelajaran')
            ->whereIn('jam_id', $jamIds)
            ->count();

        if ($exists !== count($jamIds)) {
            throw new HttpException('Jam pelajaran tidak valid.', 422);
        }
    }

    private function activeTahunAjaran(): object
    {
        $tahunAjaran = DB::table('tahun_ajaran')
            ->where('is_aktif', 1)
            ->first();

        if (!$tahunAjaran) {
            throw new HttpException('Tahun ajaran aktif belum tersedia.', 422);
        }

        return $tahunAjaran;
    }

    private function resolveRoom(string $mode, mixed $roomInput, ?object $rombel): array
    {
        if ($mode === 'piket') {
            return [
                'ruang_pilihan' => 'piket',
                'ruang_label_snapshot' => 'Piket',
            ];
        }

        $room = strtolower(trim((string) ($roomInput ?: 'kelas')));

        $allowed = ['kelas', 'lab-tkj-1', 'lab-tkj-2', 'lab-tkj-3', 'lab-tkj-4'];

        if (!in_array($room, $allowed, true)) {
            throw new HttpException('Pilihan ruangan tidak valid.', 422);
        }

        if ($room === 'kelas') {
            $label = $rombel?->label_rombel ?: $rombel?->label_rombel_raw ?: ('Rombel ' . $rombel?->rombel_id);

            return [
                'ruang_pilihan' => 'kelas',
                'ruang_label_snapshot' => 'Kelas ' . $label,
            ];
        }

        return [
            'ruang_pilihan' => $room,
            'ruang_label_snapshot' => strtoupper($room),
        ];
    }

    private function ensureRombelSessionAvailable(string $tanggal, int $rombelId, array $jamIds): void
    {
        $statusColumn = $this->sessionStatusColumn();

        $exists = DB::table('presensi_sesi as ps')
            ->join('presensi_sesi_jam as psj', 'psj.presensi_sesi_id', '=', 'ps.presensi_sesi_id')
            ->where('ps.tanggal', $tanggal)
            ->where('ps.rombel_id', $rombelId)
            ->whereIn('psj.jam_id', $jamIds)
            ->whereIn('ps.' . $statusColumn, ['aktif', 'suspended'])
            ->exists();

        if ($exists) {
            throw new HttpException('Rombel sudah memiliki sesi aktif pada jam yang dipilih.', 409);
        }
    }

    private function ensureLabAvailable(string $tanggal, array $jamIds, string $room): void
    {
        $statusColumn = $this->sessionStatusColumn();

        $exists = DB::table('presensi_sesi as ps')
            ->join('presensi_sesi_jam as psj', 'psj.presensi_sesi_id', '=', 'ps.presensi_sesi_id')
            ->where('ps.tanggal', $tanggal)
            ->where('ps.ruang_pilihan', $room)
            ->whereIn('psj.jam_id', $jamIds)
            ->whereIn('ps.' . $statusColumn, ['aktif', 'suspended'])
            ->exists();

        if ($exists) {
            throw new HttpException('Ruangan lab sedang digunakan pada jam yang dipilih.', 409);
        }
    }

    private function insertSessionJams(int $sessionId, array $jamIds): void
    {
        $rows = [];

        foreach (array_values($jamIds) as $index => $jamId) {
            $rows[] = $this->filterPayload('presensi_sesi_jam', [
                'presensi_sesi_id' => $sessionId,
                'jam_id' => $jamId,
                'urutan' => $index + 1,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        DB::table('presensi_sesi_jam')->insert($rows);
    }

    private function initAlphaRows(int $sessionId, int $rombelId, array $jamIds, string $tanggal, int $tahunAjaranId, string $semester, int $userId): void
    {
        $studentIds = DB::table('penempatan_siswa_rombel')
            ->where('rombel_id', $rombelId)
            ->where('is_aktif', 1)
            ->pluck('siswa_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($studentIds === []) {
            $studentIds = DB::table('siswa')
                ->where('rombel_id_aktif', $rombelId)
                ->where('status', 'aktif')
                ->pluck('siswa_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        $rows = [];

        foreach ($studentIds as $studentId) {
            foreach ($jamIds as $jamId) {
                $rows[] = $this->filterPayload('presensi_jam_siswa', [
                    'tanggal' => $tanggal,
                    'siswa_id' => $studentId,
                    'rombel_id_snapshot' => $rombelId,
                    'tahun_ajaran_id_snapshot' => $tahunAjaranId,
                    'semester_snapshot' => $semester,
                    'jam_id' => $jamId,
                    'status' => 'alpha',
                    'mode_presensi' => 'rombel',
                    'presensi_sesi_id' => $sessionId,
                    'input_by_user_id' => $userId,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
            }
        }

        if ($rows !== []) {
            DB::table('presensi_jam_siswa')->insertOrIgnore($rows);
        }
    }

    private function sessionStatusColumn(): string
    {
        if ($this->hasColumn('presensi_sesi', 'status_sesi')) {
            return 'status_sesi';
        }

        return 'status';
    }

    private function filterPayload(string $table, array $payload): array
    {
        $columns = $this->columns($table);

        return array_filter(
            $payload,
            fn ($key) => in_array($key, $columns, true),
            ARRAY_FILTER_USE_KEY
        );
    }

    private function hasColumn(string $table, string $column): bool
    {
        return in_array($column, $this->columns($table), true);
    }

    private function columns(string $table): array
    {
        if (!isset($this->columnsCache[$table])) {
            $this->columnsCache[$table] = DB::connection()
                ->getSchemaBuilder()
                ->getColumnListing($table);
        }

        return $this->columnsCache[$table];
    }

    private function uuidV4(): string
    {
        $data = random_bytes(16);

        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}