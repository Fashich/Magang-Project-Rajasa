<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Models;

use Illuminate\Database\Eloquent\Model;

final class User extends Model
{
    protected $table = 'users';

    protected $primaryKey = 'user_id';

    public $timestamps = true;

    protected $guarded = [];
}