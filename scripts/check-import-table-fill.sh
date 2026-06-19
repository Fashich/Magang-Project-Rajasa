#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-sistem_presensi_siswa_qr}"
DB_PASS="${DB_PASSWORD:-$(grep '^DB_PASSWORD=' .env | cut -d '=' -f2-)}"

TABLES=(
  import_jobs
  import_row_logs
  jurusan
  rombel
  siswa
  siswa_qr
  penempatan_siswa_rombel
)

mysql_exec() {
  docker compose exec -T -e MYSQL_PWD="$DB_PASS" db mysql -uroot "$@" </dev/null
}

mysql_value() {
  mysql_exec -N -B -e "$1" | tr -d '\r'
}

escape_sql_string() {
  printf "%s" "$1" | sed "s/'/''/g"
}

print_line() {
  printf '%*s\n' "${COLUMNS:-160}" '' | tr ' ' '-'
}

print_section() {
  echo
  print_line
  echo "$1"
  print_line
}

field_stats_query() {
  local table="$1"
  local column="$2"

  cat <<SQL
SELECT
  COALESCE(SUM(
    CASE
      WHEN \`$column\` IS NOT NULL
       AND TRIM(CAST(\`$column\` AS CHAR)) <> ''
      THEN 1 ELSE 0
    END
  ), 0) AS filled_rows,
  COALESCE(SUM(
    CASE
      WHEN \`$column\` IS NULL
      THEN 1 ELSE 0
    END
  ), 0) AS null_rows,
  COALESCE(SUM(
    CASE
      WHEN \`$column\` IS NOT NULL
       AND TRIM(CAST(\`$column\` AS CHAR)) = ''
      THEN 1 ELSE 0
    END
  ), 0) AS empty_rows
FROM \`$DB_NAME\`.\`$table\`;
SQL
}

sample_values_query() {
  local table="$1"
  local column="$2"

  cat <<SQL
SELECT COALESCE(GROUP_CONCAT(sample_value SEPARATOR ' || '), '-')
FROM (
  SELECT DISTINCT
    LEFT(
      REPLACE(
        REPLACE(
          CAST(\`$column\` AS CHAR),
          CHAR(10),
          ' '
        ),
        CHAR(13),
        ' '
      ),
      90
    ) AS sample_value
  FROM \`$DB_NAME\`.\`$table\`
  WHERE \`$column\` IS NOT NULL
    AND TRIM(CAST(\`$column\` AS CHAR)) <> ''
  LIMIT 5
) AS samples;
SQL
}

echo
echo "=== Import Table Fill Checker v2 ==="
echo "Database : $DB_NAME"
echo "Tables   : ${TABLES[*]}"
echo

for table in "${TABLES[@]}"; do
  safe_table="$(escape_sql_string "$table")"

  table_exists="$(
    mysql_value "
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = '$DB_NAME'
        AND TABLE_NAME = '$safe_table';
    "
  )"

  print_section "TABLE: $table"

  if [[ "$table_exists" != "1" ]]; then
    echo "STATUS: MISSING"
    echo "Catatan: tabel ini belum ada di schema database aktif."
    continue
  fi

  total_rows="$(
    mysql_value "
      SELECT COUNT(*)
      FROM \`$DB_NAME\`.\`$table\`;
    "
  )"

  echo "STATUS     : EXISTS"
  echo "TOTAL ROWS : $total_rows"
  echo

  mapfile -t columns < <(
    mysql_exec -N -B -e "
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = '$DB_NAME'
        AND TABLE_NAME = '$safe_table'
      ORDER BY ORDINAL_POSITION;
    " | tr -d '\r'
  )

  if [[ "${#columns[@]}" -eq 0 ]]; then
    echo "Tidak ada kolom terbaca."
    continue
  fi

  printf "%-32s | %-32s | %-8s | %-14s | %-10s | %-10s | %-10s | %s\n" \
    "FIELD" "TYPE" "NULLABLE" "DEFAULT" "FILLED" "NULL" "EMPTY" "SAMPLE_VALUES"
  print_line

  for column_line in "${columns[@]}"; do
    IFS=$'\t' read -r column column_type is_nullable column_default <<< "$column_line"

    stats="$(
      mysql_exec -N -B -e "$(field_stats_query "$table" "$column")" | tr -d '\r'
    )"

    IFS=$'\t' read -r filled_rows null_rows empty_rows <<< "$stats"

    sample_values="$(
      mysql_value "$(sample_values_query "$table" "$column")"
    )"

    if [[ -z "${column_default:-}" ]]; then
      column_default="NULL"
    fi

    printf "%-32s | %-32s | %-8s | %-14s | %-10s | %-10s | %-10s | %s\n" \
      "$column" "$column_type" "$is_nullable" "$column_default" "$filled_rows" "$null_rows" "$empty_rows" "$sample_values"
  done

  echo
done

print_section "ROMBEL LABEL MAPPING CHECK"

rombel_label_columns="$(
  mysql_value "
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '$DB_NAME'
      AND TABLE_NAME = 'rombel'
      AND COLUMN_NAME IN ('label_rombel', 'label_rombel_raw');
  "
)"

if [[ "$rombel_label_columns" -ge "2" ]]; then
  mysql_exec -t -e "
    USE \`$DB_NAME\`;

    SELECT
      r.rombel_id,
      r.tingkatan,
      r.tingkat_angka,
      r.jurusan_id,
      r.nomor_rombel,
      r.label_rombel,
      r.label_rombel_raw,
      r.display_mode,
      r.is_inferred_from_import,
      COUNT(s.siswa_id) AS jumlah_siswa
    FROM rombel r
    LEFT JOIN siswa s
      ON s.rombel_id_aktif = r.rombel_id
    GROUP BY
      r.rombel_id,
      r.tingkatan,
      r.tingkat_angka,
      r.jurusan_id,
      r.nomor_rombel,
      r.label_rombel,
      r.label_rombel_raw,
      r.display_mode,
      r.is_inferred_from_import
    ORDER BY r.rombel_id;
  "
else
  echo "SKIP: kolom label_rombel / label_rombel_raw tidak lengkap di tabel rombel."
fi

print_section "SISWA ACTIVE CLASS MAPPING CHECK"

mysql_exec -t -e "
  USE \`$DB_NAME\`;

  SELECT
    rombel_id_aktif,
    kelas_aktif,
    COUNT(*) AS jumlah_siswa
  FROM siswa
  WHERE rombel_id_aktif IS NOT NULL
  GROUP BY rombel_id_aktif, kelas_aktif
  ORDER BY rombel_id_aktif, kelas_aktif;
"

print_section "ROMBEL COLLAPSE CHECK"

mysql_exec -t -e "
  USE \`$DB_NAME\`;

  SELECT
    rombel_id_aktif,
    COUNT(DISTINCT kelas_aktif) AS jumlah_label_kelas,
    GROUP_CONCAT(DISTINCT kelas_aktif ORDER BY kelas_aktif SEPARATOR ' || ') AS label_kelas_tergabung,
    COUNT(*) AS jumlah_siswa
  FROM siswa
  WHERE rombel_id_aktif IS NOT NULL
  GROUP BY rombel_id_aktif
  HAVING COUNT(DISTINCT kelas_aktif) > 1
  ORDER BY rombel_id_aktif;
"

print_section "SISWA_QR READINESS CHECK"

mysql_exec -t -e "
  USE \`$DB_NAME\`;

  SELECT
    COUNT(*) AS total_qr,
    SUM(CASE WHEN payload_raw IS NULL OR TRIM(payload_raw) = '' THEN 1 ELSE 0 END) AS payload_raw_kosong,
    SUM(CASE WHEN payload_normalized IS NULL OR TRIM(payload_normalized) = '' THEN 1 ELSE 0 END) AS payload_normalized_kosong,
    SUM(CASE WHEN payload_nama IS NULL OR TRIM(payload_nama) = '' THEN 1 ELSE 0 END) AS payload_nama_kosong,
    SUM(CASE WHEN payload_nisn IS NULL OR TRIM(payload_nisn) = '' THEN 1 ELSE 0 END) AS payload_nisn_kosong
  FROM siswa_qr;
"

print_section "IMPORT SUMMARY CHECK"

mysql_exec -t -e "
  USE \`$DB_NAME\`;

  SELECT
    import_id,
    import_type,
    status,
    total_rows,
    valid_rows,
    error_rows,
    inserted_rows,
    updated_rows,
    skipped_rows,
    started_at,
    finished_at
  FROM import_jobs
  ORDER BY import_id DESC
  LIMIT 5;
"

print_line
echo "DONE"