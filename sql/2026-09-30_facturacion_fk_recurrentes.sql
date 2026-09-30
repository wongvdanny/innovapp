-- fac_facturas.recurrente_id: SET NULL → RESTRICT.
-- Con SET NULL, borrar una recurrente con facturas emitidas choca con el trigger de
-- inmutabilidad. Las recurrentes nunca se borran: se desactivan (activo = false).
BEGIN;
ALTER TABLE fac_facturas DROP CONSTRAINT fac_facturas_recurrente_id_fkey;
ALTER TABLE fac_facturas ADD CONSTRAINT fac_facturas_recurrente_id_fkey
  FOREIGN KEY (recurrente_id) REFERENCES fac_recurrentes(id) ON DELETE RESTRICT;
COMMIT;
