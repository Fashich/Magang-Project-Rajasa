#!/usr/bin/env bash
set -euo pipefail

echo "--- Reset database karena import tidak sesuai ---"
echo "--- Semua data kembali ke schema + seed demo ---"

./scripts/db-reset-demo.sh

echo "--- Reset import selesai ---"
