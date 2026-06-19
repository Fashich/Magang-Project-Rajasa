<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PresensiJamSiswa Model
 *
 * Represents a single per-jam attendance record in `presensi_jam_siswa`.
 *
 * Status values: alpha | hadir | terlambat | izin | sakit
 *
 * @property int    $presensi_id
 * @property string $tanggal
 * @property int    $siswa_id
 * @property int    $jam_id
 * @property string $status
 * @property string $mode_presensi
 * @property string $keterangan
 *
 * @author fashich/dashboard-siswa-page
 */
final class PresensiJamSiswa extends Model
{
    protected $table      = 'presensi_jam_siswa';
    protected $primaryKey = 'presensi_id';
    public    $timestamps = true;
    protected $guarded    = [];

    /**
     * The student this record belongs to.
     */
    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'siswa_id', 'siswa_id');
    }

    /**
     * The presensi session this record belongs to (nullable).
     */
    public function sesi(): BelongsTo
    {
        return $this->belongsTo(PresensiSesi::class, 'presensi_sesi_id', 'presensi_sesi_id');
    }
}
