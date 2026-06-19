#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ditemukan."
  echo "Salin .env.example ke .env lalu isi nilainya."
  exit 1
fi

HOST_UID="$(id -u)"
HOST_GID="$(id -g)"

ENV_UID="$(grep '^UID=' .env | cut -d '=' -f2 || true)"
ENV_GID="$(grep '^GID=' .env | cut -d '=' -f2 || true)"

if [ -n "${ENV_UID}" ] && [ -n "${ENV_GID}" ]; then
  if [ "${ENV_UID}" != "${HOST_UID}" ] || [ "${ENV_GID}" != "${HOST_GID}" ]; then
    echo "WARNING: UID/GID di .env tidak sama dengan user host."
    echo "Host UID:GID = ${HOST_UID}:${HOST_GID}"
    echo ".env UID:GID = ${ENV_UID}:${ENV_GID}"
    echo "Update .env jika file hasil container bermasalah permission."
  fi
fi

echo "--- [1/4] Validasi docker compose config ---"
docker compose config > /dev/null

echo "--- [2/4] Menghentikan container ---"
docker compose down

echo "--- [3/4] Membersihkan dangling image ---"
docker image prune -f

echo "--- [4/4] Build ulang dan jalankan container ---"
docker compose up -d --build --remove-orphans

echo "--- Selesai ---"
docker compose ps