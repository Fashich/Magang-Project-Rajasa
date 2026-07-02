<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * AnalitikExportController
 *
 * GET /api/analitik/export
 * Query params:
 *   jenis          = tren|distribusi|per_siswa|per_rombel  (default: tren)
 *   tanggal_dari   = Y-m-d
 *   tanggal_sampai = Y-m-d
 *   rombel_id      = int (optional, untuk per_siswa)
 *
 * Response: Excel file download
 */
final class AnalitikExportController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if (!in_array($user->user_type, ['admin', 'guru'], true)) {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        $jenis         = $_GET['jenis']          ?? 'tren';
        $dari          = $_GET['tanggal_dari']   ?? Carbon::now()->subDays(29)->toDateString();
        $sampai        = $_GET['tanggal_sampai'] ?? Carbon::now()->toDateString();
        $rombelId      = !empty($_GET['rombel_id']) ? (int) $_GET['rombel_id'] : null;

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dari))   $dari   = Carbon::now()->subDays(29)->toDateString();
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sampai)) $sampai = Carbon::now()->toDateString();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('Presensi Siswa Rajasa')
            ->setTitle("Analitik Kehadiran — {$jenis}")
            ->setDescription("Diekspor pada " . date('d/m/Y H:i'));

        match ($jenis) {
            'distribusi' => $this->sheetDistribusi($spreadsheet, $dari, $sampai),
            'per_siswa'  => $this->sheetPerSiswa($spreadsheet, $dari, $sampai, $rombelId),
            'per_rombel' => $this->sheetPerRombel($spreadsheet, $dari, $sampai),
            default      => $this->sheetTren($spreadsheet, $dari, $sampai),
        };

        $filename = "analitik_{$jenis}_{$dari}_sd_{$sampai}.xlsx";

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename=\"{$filename}\"");
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    // ── Sheet: Tren Harian ────────────────────────────────────────────────────

    private function sheetTren(Spreadsheet $sp, string $dari, string $sampai): void
    {
        $sheet = $sp->getActiveSheet();
        $sheet->setTitle('Tren Harian');

        // Header
        $this->setHeader($sheet, 1, "Laporan Tren Kehadiran Harian", "Periode: {$dari} s/d {$sampai}");

        $headers = ['Tanggal', 'Hadir', 'Terlambat', 'Alpha', 'Sakit', 'Izin', 'Total', 'Tingkat Kehadiran (%)'];
        $this->setRowHeaders($sheet, 4, $headers, 'A');

        $rows = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("tanggal, SUM(status='hadir') hadir, SUM(status='terlambat') terlambat, SUM(status='alpha') alpha, SUM(status='sakit') sakit, SUM(status='izin') izin, COUNT(*) total")
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        $row = 5;
        foreach ($rows as $r) {
            $hadir = (int)$r->hadir + (int)$r->terlambat;
            $total = (int)$r->total;
            $rate  = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;

            $sheet->setCellValue("A{$row}", $r->tanggal);
            $sheet->setCellValue("B{$row}", (int)$r->hadir);
            $sheet->setCellValue("C{$row}", (int)$r->terlambat);
            $sheet->setCellValue("D{$row}", (int)$r->alpha);
            $sheet->setCellValue("E{$row}", (int)$r->sakit);
            $sheet->setCellValue("F{$row}", (int)$r->izin);
            $sheet->setCellValue("G{$row}", $total);
            $sheet->setCellValue("H{$row}", $rate . '%');
            $row++;
        }

        $this->autoWidth($sheet, range('A', 'H'));
    }

    // ── Sheet: Distribusi Status ───────────────────────────────────────────────

    private function sheetDistribusi(Spreadsheet $sp, string $dari, string $sampai): void
    {
        $sheet = $sp->getActiveSheet();
        $sheet->setTitle('Distribusi Status');

        $this->setHeader($sheet, 1, "Distribusi Status Kehadiran", "Periode: {$dari} s/d {$sampai}");

        $headers = ['Status', 'Jumlah', 'Persentase (%)'];
        $this->setRowHeaders($sheet, 4, $headers, 'A');

        $global = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("COUNT(*) total, SUM(status='hadir') hadir, SUM(status='terlambat') terlambat, SUM(status='alpha') alpha, SUM(status='sakit') sakit, SUM(status='izin') izin")
            ->first();

        $total = (int)($global->total ?? 0);
        $data  = [
            ['Hadir',     (int)($global->hadir     ?? 0)],
            ['Terlambat', (int)($global->terlambat ?? 0)],
            ['Alpha',     (int)($global->alpha     ?? 0)],
            ['Sakit',     (int)($global->sakit     ?? 0)],
            ['Izin',      (int)($global->izin      ?? 0)],
        ];

        $row = 5;
        foreach ($data as [$label, $jumlah]) {
            $pct = $total > 0 ? round(($jumlah / $total) * 100, 1) : 0;
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $jumlah);
            $sheet->setCellValue("C{$row}", $pct . '%');
            $row++;
        }
        $sheet->setCellValue("A{$row}", 'TOTAL');
        $sheet->setCellValue("B{$row}", $total);
        $sheet->setCellValue("C{$row}", '100%');

        $this->autoWidth($sheet, ['A', 'B', 'C']);
    }

    // ── Sheet: Per Siswa ──────────────────────────────────────────────────────

    private function sheetPerSiswa(Spreadsheet $sp, string $dari, string $sampai, ?int $rombelId): void
    {
        $sheet = $sp->getActiveSheet();
        $sheet->setTitle('Per Siswa');

        $rombelLabel = $rombelId
            ? (DB::table('rombel')->where('rombel_id', $rombelId)->value('label_rombel') ?? 'Semua')
            : 'Semua Rombel';

        $this->setHeader($sheet, 1, "Rekap Kehadiran Per Siswa", "Periode: {$dari} s/d {$sampai} | Rombel: {$rombelLabel}");

        $headers = ['NIS', 'Nama Siswa', 'Rombel', 'Hadir', 'Terlambat', 'Alpha', 'Sakit', 'Izin', 'Total', 'Tingkat (%)'];
        $this->setRowHeaders($sheet, 4, $headers, 'A');

        $query = DB::table('presensi_jam_siswa AS pjs')
            ->join('siswa AS s', 's.siswa_id', '=', 'pjs.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 'pjs.rombel_id_snapshot')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->selectRaw("s.nis, s.nama_lengkap, r.label_rombel, SUM(pjs.status='hadir') hadir, SUM(pjs.status='terlambat') terlambat, SUM(pjs.status='alpha') alpha, SUM(pjs.status='sakit') sakit, SUM(pjs.status='izin') izin, COUNT(*) total")
            ->groupBy('pjs.siswa_id', 's.nis', 's.nama_lengkap', 'r.label_rombel')
            ->orderBy('r.label_rombel')
            ->orderBy('s.nama_lengkap');

        if ($rombelId) {
            $query->where('pjs.rombel_id_snapshot', $rombelId);
        }

        $rows = $query->get();

        $row = 5;
        foreach ($rows as $r) {
            $hadir = (int)$r->hadir + (int)$r->terlambat;
            $total = (int)$r->total;
            $rate  = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;

            $sheet->setCellValue("A{$row}", $r->nis);
            $sheet->setCellValue("B{$row}", $r->nama_lengkap);
            $sheet->setCellValue("C{$row}", $r->label_rombel ?? '-');
            $sheet->setCellValue("D{$row}", (int)$r->hadir);
            $sheet->setCellValue("E{$row}", (int)$r->terlambat);
            $sheet->setCellValue("F{$row}", (int)$r->alpha);
            $sheet->setCellValue("G{$row}", (int)$r->sakit);
            $sheet->setCellValue("H{$row}", (int)$r->izin);
            $sheet->setCellValue("I{$row}", $total);
            $sheet->setCellValue("J{$row}", $rate . '%');
            $row++;
        }

        $this->autoWidth($sheet, range('A', 'J'));
    }

    // ── Sheet: Per Rombel ─────────────────────────────────────────────────────

    private function sheetPerRombel(Spreadsheet $sp, string $dari, string $sampai): void
    {
        $sheet = $sp->getActiveSheet();
        $sheet->setTitle('Per Rombel');

        $this->setHeader($sheet, 1, "Rekap Kehadiran Per Rombel", "Periode: {$dari} s/d {$sampai}");

        $headers = ['Rombel', 'Tingkatan', 'Hadir', 'Terlambat', 'Alpha', 'Sakit', 'Izin', 'Total', 'Tingkat (%)'];
        $this->setRowHeaders($sheet, 4, $headers, 'A');

        $rows = DB::table('presensi_jam_siswa AS pjs')
            ->join('rombel AS r', 'r.rombel_id', '=', 'pjs.rombel_id_snapshot')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->selectRaw("r.label_rombel, r.tingkatan, SUM(pjs.status='hadir') hadir, SUM(pjs.status='terlambat') terlambat, SUM(pjs.status='alpha') alpha, SUM(pjs.status='sakit') sakit, SUM(pjs.status='izin') izin, COUNT(*) total")
            ->groupBy('pjs.rombel_id_snapshot', 'r.label_rombel', 'r.tingkatan', 'r.tingkat_angka')
            ->orderBy('r.tingkat_angka')
            ->orderBy('r.label_rombel')
            ->get();

        $row = 5;
        foreach ($rows as $r) {
            $hadir = (int)$r->hadir + (int)$r->terlambat;
            $total = (int)$r->total;
            $rate  = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;

            $sheet->setCellValue("A{$row}", $r->label_rombel);
            $sheet->setCellValue("B{$row}", $r->tingkatan);
            $sheet->setCellValue("C{$row}", (int)$r->hadir);
            $sheet->setCellValue("D{$row}", (int)$r->terlambat);
            $sheet->setCellValue("E{$row}", (int)$r->alpha);
            $sheet->setCellValue("F{$row}", (int)$r->sakit);
            $sheet->setCellValue("G{$row}", (int)$r->izin);
            $sheet->setCellValue("H{$row}", $total);
            $sheet->setCellValue("I{$row}", $rate . '%');
            $row++;
        }

        $this->autoWidth($sheet, range('A', 'I'));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function setHeader(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, int $row, string $title, string $subtitle): void
    {
        $sheet->setCellValue("A{$row}", $title);
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(14);
        $sheet->setCellValue('A' . ($row + 1), $subtitle);
        $sheet->getStyle('A' . ($row + 1))->getFont()->setItalic(true)->setSize(10);
    }

    private function setRowHeaders(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, int $row, array $headers, string $startCol): void
    {
        $col = $startCol;
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}{$row}", $header);
            $sheet->getStyle("{$col}{$row}")->applyFromArray([
                'font'    => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1e3a5f']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $col++;
        }
    }

    private function autoWidth(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, array $cols): void
    {
        foreach ($cols as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }
}
