-- Promoción /webgratis: ganadores y suplentes (innovapp_db, como innovapp_user). Va después de
-- sql/2026-11-13_promo_webgratis.sql. Después: npx prisma generate.
BEGIN;

ALTER TABLE "PromoEntry"
  ADD COLUMN "substituteOrder" integer,         -- 1-4, solo para suplentes
  ADD COLUMN "notifiedAt"      timestamp(3),    -- fecha del aviso al seleccionado (plazo de 3 días para aceptar)
  ADD COLUMN "acceptedAt"      timestamp(3),    -- fecha de aceptación (plazo de 15 días para el material)
  ADD COLUMN "materialDeliveredAt" timestamp(3); -- material entregado (apaga el aviso de plazo)

ALTER TABLE "PromoEntry" DROP CONSTRAINT "PromoEntry_status_check";
ALTER TABLE "PromoEntry" ADD CONSTRAINT "PromoEntry_status_check"
  CHECK (status IN ('pending', 'shortlisted', 'selected', 'substitute', 'rejected'));

-- El orden solo existe para los suplentes, y entre 1 y 4
ALTER TABLE "PromoEntry" ADD CONSTRAINT "PromoEntry_substituteOrder_check"
  CHECK (("substituteOrder" IS NULL) = (status <> 'substitute') AND ("substituteOrder" IS NULL OR "substituteOrder" BETWEEN 1 AND 4));

COMMIT;
