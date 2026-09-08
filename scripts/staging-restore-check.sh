#!/usr/bin/env bash
set -euo pipefail
# Restore into a separate verification database; never drops staging data.
archive="${1:?Usage: bash scripts/staging-restore-check.sh /secure/backup.archive.gz}"
test -s "$archive"
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml exec -T mongo mongorestore --archive --gzip --nsFrom='yespizz_staging.*' --nsTo='yespizz_restore_check.*' < "$archive"
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml exec -T mongo mongosh yespizz_restore_check --quiet --eval 'printjson(db.getCollectionNames().map(name => ({name, count: db.getCollection(name).countDocuments()})))'
