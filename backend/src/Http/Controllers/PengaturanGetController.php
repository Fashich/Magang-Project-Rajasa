<?php
declare(strict_types=1);
namespace Rajasa\PresensiSiswa\Http\Controllers;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * PengaturanGetController  GET /api/admin/pengaturan
 */
final class PengaturanGetController
{
    private const DEFAULT_CONFIGS = [
        ['kunci'=>'nama_sekolah',         'nilai'=>'SMK Rajasa Surabaya',   'tipe_nilai'=>'string', 'keterangan'=>'Nama sekolah ditampilkan di laporan dan header'],
        ['kunci'=>'alamat_sekolah',       'nilai'=>'',                       'tipe_nilai'=>'string', 'keterangan'=>'Alamat lengkap sekolah'],
        ['kunci'=>'npsn',                 'nilai'=>'',                       'tipe_nilai'=>'string', 'keterangan'=>'Nomor Pokok Sekolah Nasional'],
        ['kunci'=>'kepala_sekolah',       'nilai'=>'',                       'tipe_nilai'=>'string', 'keterangan'=>'Nama kepala sekolah aktif'],
        ['kunci'=>'telp_sekolah',         'nilai'=>'',                       'tipe_nilai'=>'string', 'keterangan'=>'Nomor telepon sekolah'],
        ['kunci'=>'email_sekolah',        'nilai'=>'',                       'tipe_nilai'=>'string', 'keterangan'=>'Email resmi sekolah'],
        ['kunci'=>'batas_terlambat_menit','nilai'=>'15',                     'tipe_nilai'=>'number', 'keterangan'=>'Toleransi keterlambatan (menit) sebelum dianggap alpha'],
        ['kunci'=>'sesi_timeout_menit',   'nilai'=>'120',                    'tipe_nilai'=>'number', 'keterangan'=>'Durasi maksimal sesi presensi aktif sebelum expired'],
        ['kunci'=>'max_login_attempts',   'nilai'=>'5',                      'tipe_nilai'=>'number', 'keterangan'=>'Maksimal percobaan login gagal sebelum akun terkunci'],
        ['kunci'=>'logo_url',             'nilai'=>'/images/RajasaLogo.png', 'tipe_nilai'=>'string', 'keterangan'=>'Path logo sekolah (relatif dari public)'],
        ['kunci'=>'maintenance_mode',     'nilai'=>'false',                  'tipe_nilai'=>'boolean','keterangan'=>'Aktifkan maintenance mode (nonaktifkan login non-admin)'],
        ['kunci'=>'notif_alpha_threshold','nilai'=>'3',                      'tipe_nilai'=>'number', 'keterangan'=>'Jumlah alpha berturut-turut sebelum notifikasi Early Warning'],
    ];

    public function __construct(private readonly AuthMiddleware $auth) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();
        if ($user->user_type !== 'admin') { Response::error('Akses ditolak.', [], 403); return; }

        $tahunAjaran = DB::table('tahun_ajaran')->orderByDesc('is_aktif')->orderByDesc('tahun_ajaran_id')->get()
            ->map(fn($r) => ['tahun_ajaran_id'=>(int)$r->tahun_ajaran_id,'nama_tahun_ajaran'=>$r->nama_tahun_ajaran,
                'semester_aktif'=>$r->semester_aktif,'tanggal_mulai'=>$r->tanggal_mulai,
                'tanggal_selesai'=>$r->tanggal_selesai,'is_aktif'=>(bool)$r->is_aktif])->values()->all();

        $jurusan = DB::table('jurusan')->orderBy('kode_jurusan')->get()
            ->map(fn($r) => ['jurusan_id'=>(int)$r->jurusan_id,'kode_jurusan'=>$r->kode_jurusan,
                'nama_jurusan'=>$r->nama_jurusan,'ketua_jurusan'=>$r->ketua_jurusan,
                'deskripsi_jurusan'=>$r->deskripsi_jurusan,'status'=>$r->status])->values()->all();

        if (DB::table('konfigurasi')->count() === 0) {
            foreach (self::DEFAULT_CONFIGS as $cfg) { DB::table('konfigurasi')->insert($cfg); }
        }

        $konfigurasi = DB::table('konfigurasi')->orderBy('konfigurasi_id')->get()
            ->map(fn($r) => ['konfigurasi_id'=>(int)$r->konfigurasi_id,'kunci'=>$r->kunci,
                'nilai'=>$r->nilai,'tipe_nilai'=>$r->tipe_nilai,'keterangan'=>$r->keterangan])->values()->all();

        Response::success('Data pengaturan sistem.', [
            'tahun_ajaran' => $tahunAjaran,
            'jurusan'      => $jurusan,
            'konfigurasi'  => $konfigurasi,
        ]);
    }
}
