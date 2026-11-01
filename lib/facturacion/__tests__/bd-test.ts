// Interruptor y guardián de los tests de BD (FAC_DB_TESTS=1): solo contra una BD aislada cuyo
// nombre acabe en _test (la crea scripts/test-db.sh). Sin DATABASE_URL, Prisma leería el .env
// y los tests irían contra innovapp_db: eso se impide aquí.
export const DB = process.env.FAC_DB_TESTS === '1'

if (DB) {
  const nombre = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.slice(1) : ''
  if (!nombre.endsWith('_test')) {
    throw new Error(`Tests de BD solo contra una BD *_test (ahora: «${nombre || 'la del .env'}»). Usa scripts/test-db.sh`)
  }
}
