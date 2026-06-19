#!/usr/bin/env bash
set -euo pipefail

FILE_PATH="${1:-backend/database/data/siswa_scan_readiness.csv}"

if [ ! -f "$FILE_PATH" ]; then
  echo "ERROR: File tidak ditemukan: $FILE_PATH"
  exit 1
fi

CONTAINER_PATH="$FILE_PATH"

if [[ "$FILE_PATH" == backend/* ]]; then
  CONTAINER_PATH="/var/www/${FILE_PATH#backend/}"
fi

echo "--- Login admin demo ---"

TOKEN="$(
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin.demo","password":"Rajasa@123"}' \
  | docker compose exec -T backend php -r '$j=json_decode(stream_get_contents(STDIN), true); echo $j["data"]["token"] ?? "";'
)"

if [ -z "$TOKEN" ]; then
  echo "ERROR: Token kosong. Pastikan backend hidup dan admin.demo bisa login."
  exit 1
fi

echo "--- Import scan readiness ---"
echo "Host file      : $FILE_PATH"
echo "Container file : $CONTAINER_PATH"

curl -i -X POST http://localhost:8080/api/import/scan-readiness \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"file_path\":\"$CONTAINER_PATH\"}"