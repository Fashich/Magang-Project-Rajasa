#!/usr/bin/env bash
set -euo pipefail

./scripts/db-fresh.sh
./scripts/db-seed-permissions.sh
./scripts/db-seed-demo.sh

echo "--- Database demo siap ---"