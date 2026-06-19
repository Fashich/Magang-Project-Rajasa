#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/db-env.sh"

DB_NAME="$(get_env DB_DATABASE sistem_presensi_siswa_qr)"
DB_USER="$(get_env DB_USERNAME root)"
DB_PASS="$(get_env DB_PASSWORD '')"
SCHEMA_FILE="backend/database/schema/prototype-db-3.9.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "ERROR: Schema file tidak ditemukan: $SCHEMA_FILE"
  exit 1
fi

MYSQL_PASSWORD_ARG=()
if [ -n "$DB_PASS" ]; then
  MYSQL_PASSWORD_ARG=(-p"$DB_PASS")
fi

echo "--- Reset database: $DB_NAME ---"

docker compose exec -T db mysql -u"$DB_USER" "${MYSQL_PASSWORD_ARG[@]}" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "--- Import schema ---"

docker compose exec -T db mysql -u"$DB_USER" "${MYSQL_PASSWORD_ARG[@]}" "$DB_NAME" < "$SCHEMA_FILE"

echo "--- Selesai import schema ---"