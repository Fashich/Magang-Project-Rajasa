#!/usr/bin/env bash

get_env() {
  local key="$1"
  local default="${2:-}"

  if [ ! -f .env ]; then
    echo "$default"
    return
  fi

  local value
  value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d '=' -f2- || true)"

  if [ -z "$value" ]; then
    echo "$default"
  else
    echo "$value"
  fi
}