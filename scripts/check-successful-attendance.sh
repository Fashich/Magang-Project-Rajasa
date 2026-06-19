#!/usr/bin/env bash
set -euo pipefail

DB_NAME="$(grep '^DB_DATABASE=' .env | cut -d '=' -f2-)"
DB_PASS="$(grep '^DB_PASSWORD=' .env | cut -d '=' -f2-)"

echo "=== Successful Attendance Audit ==="
echo "Database: ${DB_NAME}"
echo

echo "1) Check presensi_scan_log berhasil/warning"
SCAN_SUCCESS_COUNT="$(
docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" -N -B <<'SQL'
SELECT COUNT(*)
FROM presensi_scan_log
WHERE status_scan = 'berhasil';
SQL
)"

SCAN_WARNING_COUNT="$(
docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" -N -B <<'SQL'
SELECT COUNT(*)
FROM presensi_scan_log
WHERE status_scan = 'warning';
SQL
)"

echo "presensi_scan_log berhasil: ${SCAN_SUCCESS_COUNT}"
echo "presensi_scan_log warning : ${SCAN_WARNING_COUNT}"

echo
echo "2) Check presensi_jam_siswa with scan_log_id"
ATTENDANCE_SCAN_COUNT="$(
docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" -N -B <<'SQL'
SELECT COUNT(*)
FROM presensi_jam_siswa
WHERE scan_log_id IS NOT NULL;
SQL
)"

echo "presensi_jam_siswa with scan_log_id: ${ATTENDANCE_SCAN_COUNT}"

echo
echo "3) Check presensi_jam_siswa hadir/terlambat from scan"
ATTENDANCE_SUCCESS_COUNT="$(
docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" -N -B <<'SQL'
SELECT COUNT(*)
FROM presensi_jam_siswa
WHERE scan_log_id IS NOT NULL
  AND status IN ('hadir', 'terlambat');
SQL
)"

echo "presensi_jam_siswa scanned hadir/terlambat: ${ATTENDANCE_SUCCESS_COUNT}"

echo
echo "4) Detail if exists"
docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$DB_NAME" <<'SQL'
SELECT
  l.scan_log_id,
  l.presensi_sesi_id,
  l.status_scan,
  l.payload_nama,
  l.payload_nisn,
  l.siswa_id,
  l.selected_rombel_id,
  l.actual_rombel_id,
  l.created_at
FROM presensi_scan_log l
WHERE l.status_scan IN ('berhasil', 'warning')
ORDER BY l.scan_log_id DESC
LIMIT 20;

SELECT
  p.presensi_id,
  p.presensi_sesi_id,
  p.scan_log_id,
  p.siswa_id,
  s.nisn,
  s.nama_lengkap,
  s.kelas_aktif,
  p.tanggal,
  p.jam_id,
  p.status,
  p.mode_presensi,
  p.scanned_at
FROM presensi_jam_siswa p
LEFT JOIN siswa s ON s.siswa_id = p.siswa_id
WHERE p.scan_log_id IS NOT NULL
ORDER BY p.presensi_id DESC
LIMIT 20;
SQL

if [[ "$SCAN_SUCCESS_COUNT" != "0" || "$SCAN_WARNING_COUNT" != "0" || "$ATTENDANCE_SCAN_COUNT" != "0" || "$ATTENDANCE_SUCCESS_COUNT" != "0" ]]; then  echo
  echo "RESULT: FAILED"
  echo "Ada scan berhasil/warning atau presensi hasil scan di database."
  echo "Jika ini dijalankan setelah fresh import murni, berarti ada scan/test yang sudah berjalan setelah import."
  exit 1
fi

echo
echo "RESULT: PASSED"
echo "Tidak ada scan berhasil/warning dan tidak ada presensi hasil scan."