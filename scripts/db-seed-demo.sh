#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/db-env.sh"

DB_NAME="$(get_env DB_DATABASE sistem_presensi_siswa_qr)"
DB_USER="$(get_env DB_USERNAME root)"
DB_PASS="$(get_env DB_PASSWORD '')"
SEED_FILE="backend/database/seeds/seed_akun_demo_mvp_presensi_qr.sql"

if [ ! -f "$SEED_FILE" ]; then
  echo "ERROR: Seed file tidak ditemukan: $SEED_FILE"
  exit 1
fi

MYSQL_PASSWORD_ARG=()
if [ -n "$DB_PASS" ]; then
  MYSQL_PASSWORD_ARG=(-p"$DB_PASS")
fi

echo "--- Seed akun demo ---"

docker compose exec -T db mysql -u"$DB_USER" "${MYSQL_PASSWORD_ARG[@]}" "$DB_NAME" < "$SEED_FILE"

echo "--- Selesai seed akun demo ---"