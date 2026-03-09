#!/bin/sh
set -eu

SEED_PATH="/seed/safira"
DB_NAME="${MONGO_INITDB_DATABASE:-safira}"

if [ ! -d "$SEED_PATH" ] || [ -z "$(ls -A "$SEED_PATH" 2>/dev/null)" ]; then
  echo "[mongo-init] Nenhum seed encontrado em $SEED_PATH."
  exit 0
fi

echo "[mongo-init] Restaurando seed de $SEED_PATH para o banco $DB_NAME..."
mongorestore --drop --db "$DB_NAME" "$SEED_PATH"
echo "[mongo-init] Seed restaurado com sucesso."
