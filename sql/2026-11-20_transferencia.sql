-- Transferencia bancaria como método de pago de las suscripciones (configurable en /admin/ajustes?tab=pagos).
-- Aplicar como innovapp_user. Después: npx prisma db pull && npx prisma generate.
BEGIN;

CREATE TABLE "TransferConfig" (
  id            text    PRIMARY KEY DEFAULT gen_random_uuid()::text,
  enabled       boolean NOT NULL DEFAULT false,
  titular       text    NOT NULL DEFAULT '',
  iban          text    NOT NULL DEFAULT '',
  bic           text    NOT NULL DEFAULT '',
  banco         text    NOT NULL DEFAULT '',
  instrucciones text    NOT NULL DEFAULT '',
  "diasPlazo"   integer NOT NULL DEFAULT 5 CHECK ("diasPlazo" BETWEEN 1 AND 60)
);

-- Las facturas de cobros confirmados por transferencia llevan origen 'transferencia'
ALTER TABLE fac_facturas DROP CONSTRAINT fac_facturas_origen_check;
ALTER TABLE fac_facturas ADD CONSTRAINT fac_facturas_origen_check
  CHECK (origen IN ('manual', 'stripe', 'redsys', 'recurrente', 'agentes', 'transferencia'));

COMMIT;
