<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Siswa Model
 *
 * Represents a student record in the `siswa` table.
 *
 * @property int    $siswa_id
 * @property string $nisn
 * @property string $nis
 * @property string $nama_lengkap
 * @property string $kelas_aktif
 * @property string $status
 *
 * @author fashich/dashboard-siswa-page
 */
final class Siswa extends Model
{
    protected $table      = 'siswa';
    protected $primaryKey = 'siswa_id';
    public    $timestamps = true;
    protected $guarded    = [];

    /**
     * Attendance records for this student.
     */
    public function presensi(): HasMany
    {
        return $this->hasMany(PresensiJamSiswa::class, 'siswa_id', 'siswa_id');
    }
}
