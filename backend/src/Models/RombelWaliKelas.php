<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Models;

use Illuminate\Database\Eloquent\Model;

final class RombelWaliKelas extends Model
{
    protected $table = 'rombel_wali_kelas';
    protected $primaryKey = 'wali_kelas_id';
    public $timestamps = true;
    protected $guarded = [];
}
