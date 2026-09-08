#!/usr/bin/env bash
set -euo pipefail
# Run from repository root. Archives contain customer data; store encrypted off-host.
backup_dir="${1:?Usage: bash scripts/staging-backup.sh /secure/backup-directory}"
umask 077
mkdir -p "$backup_dir"
archive="$backup_dir/yespizz-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml exec -T mongo mongodump --db yespizz_staging --archive --gzip > "$archive"
test -s "$archive"
