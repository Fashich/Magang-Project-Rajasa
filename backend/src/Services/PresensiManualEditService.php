<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;

final class PresensiManualEditService
{
    private const VALID_STATUSES = [
        'alpha',
        'hadir',
        'terlambat',
        'izin',
        'sakit',
    ];

    private const REASONS = [
        'siswa_sakit' => [
            'code' => 'siswa_sakit',
            'label' => 'Siswa sakit',
            'requires_text' => false,
        ],
        'siswa_izin' => [
            'code' => 'siswa_izin',
            'label' => 'Siswa izin',
            'requires_text' => false,
        ],
        'siswa_tidak_bawa_kartu' => [
            'code' => 'siswa_tidak_bawa_kartu',
            'label' => 'Siswa tidak bawa kartu pelajar',
            'requires_text' => false,
        ],
        'siswa_memakai_kartu_teman' => [
            'code' => 'siswa_memakai_kartu_teman',
            'label' => 'Siswa memakai kartu teman',
            'requires_text' => false,
        ],
        'koreksi_input' => [
            'code' => 'koreksi_input',
            'label' => 'Koreksi input presensi',
            'requires_text' => false,
        ],
        'lainnya' => [
            'code' => 'lainnya',
            'label' => 'Lainnya',
            'requires_text' => true,
        ],
    ];

    public function reasons(): array
    {
        return array_values(self::REASONS);
    }

    public function updateStatus(int $presensiId, array $payload, int $userId): array
    {
        $status = trim((string) ($payload['status'] ?? ''));
        $reasonCode = trim((string) ($payload['reason_code'] ?? ''));
        $reasonText = trim((string) ($payload['reason_text'] ?? ''));

        $this->validateStatus($status);
        $reason = $this->validateReason($reasonCode, $reasonText);

        $presensi = DB::table('presensi_jam_siswa')
            ->where('presensi_id', $presensiId)
            ->first();

        if (!$presensi) {
            throw new HttpException('Data presensi tidak ditemukan.', 404);
        }

        $oldStatus = (string) $presensi->status;

        if ($oldStatus === $status) {
            throw new HttpException('Status presensi tidak berubah.', 422, [
                'status' => 'Status baru sama dengan status lama.',
            ]);
        }

        $finalReason = $this->formatReason($reason, $reasonText);
        $now = date('Y-m-d H:i:s');

        return DB::connection()->transaction(function () use (
            $presensi,
            $presensiId,
            $oldStatus,
            $status,
            $finalReason,
            $userId,
            $now
        ): array {
            DB::table('presensi_jam_siswa')
                ->where('presensi_id', $presensiId)
                ->update([
                    'status' => $status,
                    'mode_presensi' => 'manual',
                    'edited_by_user_id' => $userId,
                    'edited_at' => $now,
                    'keterangan' => $finalReason,
                    'updated_at' => $now,
                ]);

            $editLogId = (int) DB::table('presensi_edit_log')->insertGetId([
                'presensi_id' => $presensiId,
                'field_name' => 'status',
                'old_value' => $oldStatus,
                'new_value' => $status,
                'edited_by_user_id' => $userId,
                'edited_at' => $now,
                'alasan_edit' => $finalReason,
            ]);

            $updated = DB::table('presensi_jam_siswa')
                ->where('presensi_id', $presensiId)
                ->first();

            return [
                'edit_log_id' => $editLogId,
                'presensi' => $this->formatPresensi($updated),
                'audit' => [
                    'field_name' => 'status',
                    'old_value' => $oldStatus,
                    'new_value' => $status,
                    'alasan_edit' => $finalReason,
                    'edited_by_user_id' => $userId,
                    'edited_at' => $now,
                ],
            ];
        });
    }

    private function validateStatus(string $status): void
    {
        if (!in_array($status, self::VALID_STATUSES, true)) {
            throw new HttpException('Status presensi tidak valid.', 422, [
                'status' => 'Status harus salah satu dari: ' . implode(', ', self::VALID_STATUSES),
            ]);
        }
    }

    private function validateReason(string $reasonCode, string $reasonText): array
    {
        if ($reasonCode === '' || !isset(self::REASONS[$reasonCode])) {
            throw new HttpException('Alasan edit tidak valid.', 422, [
                'reason_code' => 'Pilih alasan edit yang tersedia.',
            ]);
        }

        $reason = self::REASONS[$reasonCode];

        if ($reason['requires_text'] && $reasonText === '') {
            throw new HttpException('Alasan tambahan wajib diisi.', 422, [
                'reason_text' => 'Wajib diisi jika memilih alasan lainnya.',
            ]);
        }

        return $reason;
    }

    private function formatReason(array $reason, string $reasonText): string
    {
        if ($reasonText === '') {
            return (string) $reason['label'];
        }

        return $reason['label'] . ': ' . $reasonText;
    }

    private function formatPresensi(object $row): array
    {
        return [
            'presensi_id' => (int) $row->presensi_id,
            'tanggal' => $row->tanggal,
            'siswa_id' => (int) $row->siswa_id,
            'rombel_id_snapshot' => $row->rombel_id_snapshot !== null ? (int) $row->rombel_id_snapshot : null,
            'jam_id' => (int) $row->jam_id,
            'status' => $row->status,
            'mode_presensi' => $row->mode_presensi,
            'presensi_sesi_id' => $row->presensi_sesi_id !== null ? (int) $row->presensi_sesi_id : null,
            'scan_log_id' => $row->scan_log_id !== null ? (int) $row->scan_log_id : null,
            'edited_by_user_id' => $row->edited_by_user_id !== null ? (int) $row->edited_by_user_id : null,
            'edited_at' => $row->edited_at,
            'keterangan' => $row->keterangan,
        ];
    }
}