#!/bin/bash
# Tests de BD de facturación contra una BD AISLADA (innovapp_test), nunca contra innovapp_db.
#   scripts/test-db.sh                 recrea innovapp_test y lanza todos los tests
#   scripts/test-db.sh lib/facturacion/__tests__/db.test.ts   (los argumentos van a vitest)
#
# innovapp_test = esquema actual de innovapp_db (tablas, triggers, funciones) + datos mínimos de
# referencia: productos, planes, ajustes (con NIF/IBAN/email de prueba), dudas de la gestoría y
# pasarelas ficticias sin secretos. Ni clientes, ni facturas, ni cobros, ni eventos reales.
# Cada test sigue además dentro de una transacción revertida. Necesita root (sudo -u postgres).
set -euo pipefail
cd "$(dirname "$0")/.."
ORIGEN=innovapp_db
TEST_DB=innovapp_test
pg() { sudo -u postgres psql -q -v ON_ERROR_STOP=1 "$@"; }

sudo -u postgres dropdb --if-exists "$TEST_DB"
sudo -u postgres createdb -O innovapp_user "$TEST_DB"
sudo -u postgres pg_dump --schema-only "$ORIGEN" | pg -d "$TEST_DB" >/dev/null
sudo -u postgres pg_dump --data-only --disable-triggers -t '"Product"' -t '"Plan"' -t fac_ajustes -t fac_dudas_gestor "$ORIGEN" | pg -d "$TEST_DB" >/dev/null
pg -d "$TEST_DB" <<'SQL'
UPDATE fac_ajustes SET nif = '00000000T', iban = '', email = 'yo@innovapp.es', logo_path = NULL;
UPDATE fac_dudas_gestor SET estado = 'abierta', respuesta = NULL;
INSERT INTO "StripeConfig" ("publishableKey", "secretKey", "webhookSecret", environment, enabled) VALUES ('', '', '', 'production', true);
INSERT INTO "RedsysConfig" (id, "merchantCode", "secretKey", terminal, environment, enabled) VALUES ('test', '999008881', '', '001', 'production', true);
SQL

URL=$(node --env-file=.env -e "const u = new URL(process.env.DATABASE_URL); u.pathname = '/$TEST_DB'; console.log(u.toString())")
DATABASE_URL="$URL" FAC_DB_TESTS=1 npx vitest run "$@"
