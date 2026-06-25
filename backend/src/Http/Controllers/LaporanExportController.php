<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

// PhpSpreadsheet
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;

// dompdf
use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * LaporanExportController
 *
 * GET /api/admin/laporan/export
 * Query params:
 *   format=excel|pdf             (default: excel)
 *   jenis=rekap_rombel|rekap_siswa|rekap_harian
 *   tanggal_dari=Y-m-d
 *   tanggal_sampai=Y-m-d
 *   rombel_id=                   (opsional — rekap_siswa)
 *
 * Output: File download (XLSX atau PDF)
 * Format: Kemdikbud / SNQA sekolah menengah kejuruan
 *
 * @author feature/prd-4-report
 */
final class LaporanExportController
{
    private const SEKOLAH = [
        'npsn'     => '20532429',
        'nama'     => 'SMK SWASTA RAJASA SURABAYA',
        'alamat'   => 'Jl. Rajasa, Surabaya, Jawa Timur',
        'kota'     => 'Surabaya',
        'provinsi' => 'Jawa Timur',
        'telp'     => '-',
    ];

    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();
        if ($user->user_type !== 'admin') {
            http_response_code(403);
            echo json_encode(['message' => 'Akses ditolak.']);
            return;
        }

        $format        = strtolower($_GET['format']       ?? 'excel');
        $jenis         = $_GET['jenis']                   ?? 'rekap_rombel';
        $tanggalDari   = $_GET['tanggal_dari']            ?? Carbon::now()->startOfMonth()->toDateString();
        $tanggalSampai = $_GET['tanggal_sampai']          ?? Carbon::now()->toDateString();
        $rombelId      = isset($_GET['rombel_id']) && $_GET['rombel_id'] !== ''
                            ? (int) $_GET['rombel_id'] : null;

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalDari)) {
            $tanggalDari = Carbon::now()->startOfMonth()->toDateString();
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalSampai)) {
            $tanggalSampai = Carbon::now()->toDateString();
        }

        $data = $this->getData($jenis, $rombelId, $tanggalDari, $tanggalSampai);

        match ($format) {
            'pdf'   => $this->exportPdf($jenis, $data, $tanggalDari, $tanggalSampai),
            default => $this->exportExcel($jenis, $data, $tanggalDari, $tanggalSampai),
        };
    }

    // ── Data Queries ─────────────────────────────────────────────────────────

    private function getData(string $jenis, ?int $rombelId, string $dari, string $sampai): array
    {
        return match ($jenis) {
            'rekap_siswa'  => $this->queryRekapSiswa($rombelId, $dari, $sampai),
            'rekap_harian' => $this->queryRekapHarian($dari, $sampai),
            default        => $this->queryRekapRombel($dari, $sampai),
        };
    }

    private function queryRekapRombel(string $dari, string $sampai): array
    {
        $rows = DB::table('rombel AS r')
            ->leftJoin('presensi_jam_siswa AS pjs', function ($j) use ($dari, $sampai) {
                $j->on('pjs.rombel_id_snapshot', '=', 'r.rombel_id')
                  ->whereBetween('pjs.tanggal', [$dari, $sampai]);
            })
            ->leftJoin('siswa AS s', function ($j) {
                $j->on('s.rombel_id_aktif', '=', 'r.rombel_id')->where('s.status', 'aktif');
            })
            ->where('r.status', 'aktif')
            ->selectRaw("
                r.label_rombel, r.tingkatan,
                COUNT(DISTINCT s.siswa_id)                                 AS total_siswa,
                SUM(CASE WHEN pjs.status = 'hadir'     THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN pjs.status = 'terlambat' THEN 1 ELSE 0 END) AS terlambat,
                SUM(CASE WHEN pjs.status = 'alpha'     THEN 1 ELSE 0 END) AS alpha,
                SUM(CASE WHEN pjs.status = 'sakit'     THEN 1 ELSE 0 END) AS sakit,
                SUM(CASE WHEN pjs.status = 'izin'      THEN 1 ELSE 0 END) AS izin,
                COUNT(pjs.presensi_id)                                     AS total
            ")
            ->groupBy('r.rombel_id', 'r.label_rombel', 'r.tingkatan', 'r.tingkat_angka')
            ->orderBy('r.tingkat_angka')->orderBy('r.label_rombel')
            ->get();

        return $rows->map(function ($r) {
            $hadir = (int)$r->hadir + (int)$r->terlambat;
            $total = (int)$r->total;
            return [
                'rombel'      => $r->label_rombel,
                'tingkatan'   => $r->tingkatan,
                'total_siswa' => (int)$r->total_siswa,
                'hadir'       => (int)$r->hadir,
                'terlambat'   => (int)$r->terlambat,
                'alpha'       => (int)$r->alpha,
                'sakit'       => (int)$r->sakit,
                'izin'        => (int)$r->izin,
                'total'       => $total,
                'rate'        => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values()->all();
    }

    private function queryRekapSiswa(?int $rombelId, string $dari, string $sampai): array
    {
        $query = DB::table('siswa AS s')
            ->leftJoin('presensi_jam_siswa AS pjs', function ($j) use ($dari, $sampai) {
                $j->on('pjs.siswa_id', '=', 's.siswa_id')
                  ->whereBetween('pjs.tanggal', [$dari, $sampai]);
            })
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('s.status', 'aktif')
            ->selectRaw("
                s.nis, s.nisn, s.nama_lengkap, r.label_rombel,
                SUM(CASE WHEN pjs.status = 'hadir'     THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN pjs.status = 'terlambat' THEN 1 ELSE 0 END) AS terlambat,
                SUM(CASE WHEN pjs.status = 'alpha'     THEN 1 ELSE 0 END) AS alpha,
                SUM(CASE WHEN pjs.status = 'sakit'     THEN 1 ELSE 0 END) AS sakit,
                SUM(CASE WHEN pjs.status = 'izin'      THEN 1 ELSE 0 END) AS izin,
                COUNT(pjs.presensi_id)                                     AS total
            ")
            ->groupBy('s.siswa_id', 's.nis', 's.nisn', 's.nama_lengkap', 'r.label_rombel')
            ->orderBy('r.label_rombel')->orderBy('s.nama_lengkap');

        if ($rombelId !== null) $query->where('s.rombel_id_aktif', $rombelId);

        return $query->get()->map(function ($s) {
            $hadir = (int)$s->hadir + (int)$s->terlambat;
            $total = (int)$s->total;
            return [
                'nis'          => $s->nis,
                'nisn'         => $s->nisn,
                'nama'         => $s->nama_lengkap,
                'rombel'       => $s->label_rombel ?? '—',
                'hadir'        => (int)$s->hadir,
                'terlambat'    => (int)$s->terlambat,
                'alpha'        => (int)$s->alpha,
                'sakit'        => (int)$s->sakit,
                'izin'         => (int)$s->izin,
                'total'        => $total,
                'rate'         => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values()->all();
    }

    private function queryRekapHarian(string $dari, string $sampai): array
    {
        return DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                tanggal,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'alpha')     AS alpha,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                COUNT(*)                  AS total
            ")
            ->groupBy('tanggal')->orderBy('tanggal')
            ->get()->map(function ($r) {
                $hadir = (int)$r->hadir + (int)$r->terlambat;
                $total = (int)$r->total;
                return [
                    'tanggal'   => $r->tanggal,
                    'hadir'     => (int)$r->hadir,
                    'terlambat' => (int)$r->terlambat,
                    'alpha'     => (int)$r->alpha,
                    'sakit'     => (int)$r->sakit,
                    'izin'      => (int)$r->izin,
                    'total'     => $total,
                    'rate'      => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
                ];
            })->values()->all();
    }

    // ── Excel Export (PhpSpreadsheet) ────────────────────────────────────────

    private function exportExcel(string $jenis, array $data, string $dari, string $sampai): void
    {
        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Kehadiran');

        $judul     = $this->getJudul($jenis);
        $cols      = $this->getColumns($jenis);
        $lastCol   = $this->indexToCol(count($cols));
        $totalCols = count($cols);

        // ── Header Sekolah ───────────────────────────────────────────────────
        $sekolah = self::SEKOLAH;
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->mergeCells("A3:{$lastCol}3");
        $sheet->mergeCells("A4:{$lastCol}4");
        $sheet->mergeCells("A5:{$lastCol}5");

        $sheet->setCellValue('A1', strtoupper("SMKS RAJASA SURABAYA"));
        $sheet->setCellValue('A2', "NPSN: {$sekolah['npsn']} | {$sekolah['alamat']}");
        $sheet->setCellValue('A3', "─────────────────────────────────────────────────────");
        $sheet->setCellValue('A4', strtoupper($judul));
        $sheet->setCellValue('A5', "Periode: " . $this->fmtDate($dari) . " s/d " . $this->fmtDate($sampai)
            . "     Dicetak: " . $this->fmtDate(Carbon::now()->toDateString()));

        // Style header sekolah
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A4')->getFont()->setBold(true)->setSize(13);
        foreach (['A1','A2','A3','A4','A5'] as $cell) {
            $sheet->getStyle($cell)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
        $sheet->getStyle('A1:' . $lastCol . '5')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('1e3a5f');
        $sheet->getStyle('A1:' . $lastCol . '5')->getFont()
            ->getColor()->setRGB('FFFFFF');

        // ── Kolom Header ─────────────────────────────────────────────────────
        $headerRow = 7;
        $sheet->mergeCells("A6:{$lastCol}6"); // blank separator
        foreach ($cols as $i => $col) {
            $colLetter = $this->indexToCol($i + 1);
            $sheet->setCellValue("{$colLetter}{$headerRow}", $col['label']);
            $sheet->getColumnDimension($colLetter)->setWidth($col['width'] ?? 14);
        }

        $headerRange = "A{$headerRow}:{$lastCol}{$headerRow}";
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->setSize(10);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('1e40af');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension($headerRow)->setRowHeight(22);

        // ── Data Rows ────────────────────────────────────────────────────────
        $rowNum = $headerRow + 1;
        $noUrut = 1;
        foreach ($data as $item) {
            foreach ($cols as $i => $col) {
                $colLetter = $this->indexToCol($i + 1);
                $value = $col['key'] === 'no' ? $noUrut : ($item[$col['key']] ?? '');
                $sheet->setCellValue("{$colLetter}{$rowNum}", $value);
                if (isset($col['type']) && $col['type'] === 'number') {
                    $sheet->getStyle("{$colLetter}{$rowNum}")
                        ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
            }
            // Zebra stripe
            if ($noUrut % 2 === 0) {
                $sheet->getStyle("A{$rowNum}:{$lastCol}{$rowNum}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('EEF2FF');
            }
            $noUrut++;
            $rowNum++;
        }

        // ── Border seluruh tabel ─────────────────────────────────────────────
        $tableRange = "A{$headerRow}:{$lastCol}" . ($rowNum - 1);
        $borderStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CBD5E1'],
                ],
                'outline' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color' => ['rgb' => '1e40af'],
                ],
            ],
        ];
        $sheet->getStyle($tableRange)->applyFromArray($borderStyle);

        // ── Summary Row ──────────────────────────────────────────────────────
        $summaryRow = $rowNum + 1;
        $sheet->mergeCells("A{$summaryRow}:C{$summaryRow}");
        $sheet->setCellValue("A{$summaryRow}", "Total Data: " . count($data) . " baris");
        $sheet->getStyle("A{$summaryRow}")->getFont()->setBold(true)->setItalic(true);
        $sheet->getStyle("A{$summaryRow}")->getFont()->getColor()->setRGB('475569');

        // ── TTD Area ─────────────────────────────────────────────────────────
        $ttdRow = $summaryRow + 3;
        $ttdCol = $this->indexToCol($totalCols - 2);
        $sheet->setCellValue("A{$ttdRow}", "Mengetahui,");
        $sheet->setCellValue("{$ttdCol}{$ttdRow}", "Surabaya, " . $this->fmtDate(Carbon::now()->toDateString()));
        $sheet->setCellValue("A" . ($ttdRow + 1), "Kepala Sekolah SMKS Rajasa Surabaya");
        $sheet->setCellValue("{$ttdCol}" . ($ttdRow + 1), "Yang Membuat,");
        $sheet->setCellValue("A" . ($ttdRow + 5), "......................................");
        $sheet->setCellValue("{$ttdCol}" . ($ttdRow + 5), "......................................");
        $sheet->setCellValue("A" . ($ttdRow + 6), "NIP. .................................");

        // ── Output ───────────────────────────────────────────────────────────
        $filename = "Laporan_{$jenis}_" . str_replace('-', '', $dari) . "_" . str_replace('-', '', $sampai) . ".xlsx";

        if (ob_get_length()) ob_end_clean();
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    // ── PDF Export (dompdf) ──────────────────────────────────────────────────

    private function exportPdf(string $jenis, array $data, string $dari, string $sampai): void
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->buildPdfHtml($jenis, $data, $dari, $sampai));
        $dompdf->setPaper('A4', count($this->getColumns($jenis)) > 7 ? 'landscape' : 'portrait');
        $dompdf->render();

        $filename = "Laporan_{$jenis}_" . str_replace('-', '', $dari) . "_" . str_replace('-', '', $sampai) . ".pdf";

        if (ob_get_length()) ob_end_clean();
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo $dompdf->output();
        exit;
    }

    private function buildPdfHtml(string $jenis, array $data, string $dari, string $sampai): string
    {
        $judul   = $this->getJudul($jenis);
        $cols    = $this->getColumns($jenis);
        $sekolah = self::SEKOLAH;
        $now     = $this->fmtDate(Carbon::now()->toDateString());

        // Thead
        $thead = '<tr>' . implode('', array_map(
            fn($c) => "<th>{$c['label']}</th>", $cols
        )) . '</tr>';

        // Tbody
        $tbody = '';
        $no = 1;
        foreach ($data as $item) {
            $cells = '';
            foreach ($cols as $c) {
                $val = $c['key'] === 'no' ? $no : htmlspecialchars((string)($item[$c['key']] ?? ''));
                $align = isset($c['type']) && $c['type'] === 'number' ? 'center' : 'left';
                $cells .= "<td style=\"text-align:{$align}\">{$val}</td>";
            }
            $bg = $no % 2 === 0 ? 'background:#EEF2FF;' : '';
            $tbody .= "<tr style=\"{$bg}\">{$cells}</tr>";
            $no++;
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family: DejaVu Sans, Arial, sans-serif; }
  body { font-size: 9pt; color: #1e293b; }
  .header { background: #1e3a5f; color: white; padding: 12px 16px; text-align: center; margin-bottom: 0; }
  .header h1 { font-size: 13pt; font-weight: bold; margin-bottom: 3px; }
  .header p  { font-size: 8pt; opacity: 0.85; }
  .title-bar { background: #1e40af; color: white; padding: 7px 16px; text-align: center; }
  .title-bar h2 { font-size: 11pt; font-weight: bold; }
  .title-bar p  { font-size: 8pt; }
  .content { padding: 12px 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #1e40af; color: white; padding: 6px 8px; text-align: center;
       border: 1px solid #1e3a5f; font-weight: bold; }
  td { padding: 5px 8px; border: 1px solid #CBD5E1; }
  .footer { margin-top: 20px; display: flex; justify-content: space-between; }
  .sign-block { font-size: 8.5pt; }
  .sign-block p { margin-bottom: 2px; }
  .sign-line { margin-top: 48px; border-top: 1px solid #475569; padding-top: 4px; width: 180px; }
  .summary { margin-top: 8px; font-size: 8pt; color: #475569; font-style: italic; }
</style>
</head>
<body>
<div class="header">
  <h1>SMKS RAJASA SURABAYA</h1>
  <p>NPSN: {$sekolah['npsn']} &nbsp;|&nbsp; {$sekolah['alamat']}</p>
</div>
<div class="title-bar">
  <h2>{$judul}</h2>
  <p>Periode: {$this->fmtDate($dari)} s/d {$this->fmtDate($sampai)}</p>
</div>
<div class="content">
  <table>
    <thead>{$thead}</thead>
    <tbody>{$tbody}</tbody>
  </table>
  <div class="summary">Total data: {$no} baris &nbsp;|&nbsp; Dicetak: {$now}</div>
  <div class="footer">
    <div class="sign-block">
      <p>Mengetahui,</p>
      <p><strong>Kepala Sekolah SMKS Rajasa Surabaya</strong></p>
      <div class="sign-line">
        <p>NIP. ................................</p>
      </div>
    </div>
    <div class="sign-block" style="text-align:right">
      <p>Surabaya, {$now}</p>
      <p>Yang Membuat,</p>
      <div class="sign-line" style="margin-left:auto">
        <p>Administrator</p>
      </div>
    </div>
  </div>
</div>
</body>
</html>
HTML;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function getJudul(string $jenis): string
    {
        return match ($jenis) {
            'rekap_siswa'  => 'REKAPITULASI KEHADIRAN SISWA PER INDIVIDU',
            'rekap_harian' => 'REKAPITULASI KEHADIRAN SISWA HARIAN',
            default        => 'REKAPITULASI KEHADIRAN SISWA PER KELAS',
        };
    }

    private function getColumns(string $jenis): array
    {
        return match ($jenis) {
            'rekap_siswa' => [
                ['key' => 'no',        'label' => 'No.',          'width' => 5,  'type' => 'number'],
                ['key' => 'nis',       'label' => 'NIS',          'width' => 13],
                ['key' => 'nisn',      'label' => 'NISN',         'width' => 16],
                ['key' => 'nama',      'label' => 'Nama Siswa',   'width' => 28],
                ['key' => 'rombel',    'label' => 'Kelas',        'width' => 12],
                ['key' => 'hadir',     'label' => 'Hadir (H)',    'width' => 10, 'type' => 'number'],
                ['key' => 'terlambat', 'label' => 'Terlambat (T)','width' => 12, 'type' => 'number'],
                ['key' => 'sakit',     'label' => 'Sakit (S)',    'width' => 10, 'type' => 'number'],
                ['key' => 'izin',      'label' => 'Izin (I)',     'width' => 10, 'type' => 'number'],
                ['key' => 'alpha',     'label' => 'Alpha (A)',    'width' => 10, 'type' => 'number'],
                ['key' => 'total',     'label' => 'Jml Hari',    'width' => 10, 'type' => 'number'],
                ['key' => 'rate',      'label' => '% Hadir',      'width' => 10, 'type' => 'number'],
            ],
            'rekap_harian' => [
                ['key' => 'no',        'label' => 'No.',          'width' => 5,  'type' => 'number'],
                ['key' => 'tanggal',   'label' => 'Tanggal',      'width' => 16],
                ['key' => 'hadir',     'label' => 'Hadir',        'width' => 10, 'type' => 'number'],
                ['key' => 'terlambat', 'label' => 'Terlambat',    'width' => 12, 'type' => 'number'],
                ['key' => 'sakit',     'label' => 'Sakit (S)',    'width' => 10, 'type' => 'number'],
                ['key' => 'izin',      'label' => 'Izin (I)',     'width' => 10, 'type' => 'number'],
                ['key' => 'alpha',     'label' => 'Alpha (A)',    'width' => 10, 'type' => 'number'],
                ['key' => 'total',     'label' => 'Total',        'width' => 10, 'type' => 'number'],
                ['key' => 'rate',      'label' => '% Hadir',      'width' => 10, 'type' => 'number'],
            ],
            default => [   // rekap_rombel
                ['key' => 'no',          'label' => 'No.',          'width' => 5,  'type' => 'number'],
                ['key' => 'rombel',      'label' => 'Kelas',        'width' => 18],
                ['key' => 'tingkatan',   'label' => 'Tingkat',      'width' => 10],
                ['key' => 'total_siswa', 'label' => 'Jml Siswa',   'width' => 12, 'type' => 'number'],
                ['key' => 'hadir',       'label' => 'Hadir (H)',   'width' => 10, 'type' => 'number'],
                ['key' => 'terlambat',   'label' => 'Terlambat (T)','width' => 13,'type' => 'number'],
                ['key' => 'sakit',       'label' => 'Sakit (S)',   'width' => 10, 'type' => 'number'],
                ['key' => 'izin',        'label' => 'Izin (I)',    'width' => 10, 'type' => 'number'],
                ['key' => 'alpha',       'label' => 'Alpha (A)',   'width' => 10, 'type' => 'number'],
                ['key' => 'total',       'label' => 'Jml Record',  'width' => 12, 'type' => 'number'],
                ['key' => 'rate',        'label' => '% Hadir',     'width' => 10, 'type' => 'number'],
            ],
        };
    }

    /** Convert column index (1-based) to Excel letter (A, B, ..., Z, AA, ...) */
    private function indexToCol(int $index): string
    {
        $col = '';
        while ($index > 0) {
            $index--;
            $col = chr(65 + ($index % 26)) . $col;
            $index = intdiv($index, 26);
        }
        return $col;
    }

    private function fmtDate(string $date): string
    {
        try {
            $months = ['','Januari','Februari','Maret','April','Mei','Juni',
                       'Juli','Agustus','September','Oktober','November','Desember'];
            [$y, $m, $d] = explode('-', $date);
            return "{$d} {$months[(int)$m]} {$y}";
        } catch (\Throwable) {
            return $date;
        }
    }
}
