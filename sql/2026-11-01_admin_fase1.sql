-- Fase 1 del panel /admin (innovapp_db). Se ejecuta como innovapp_user; después: prisma db pull + generate.
BEGIN;

-- Borrado lógico de suscripciones: «Borrar» ya no elimina la fila ni sus Invoice.
ALTER TABLE "Subscription" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Pruebas/demos: fuera de Contabilidad, KPIs y MRR (se siguen viendo en el panel, marcadas).
ALTER TABLE "Invoice"      ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;

-- Cobros Redsys hechos con Redsys en modo test
UPDATE "Invoice" SET "isTest" = true
WHERE provider = 'redsys' AND id IN (
  'cmolz3y5e0004hye6cpizk7rm',  -- 30/04/2026  990 €  servix Anual
  'cmp4l38xj00048vs7yrv881dh',  -- 13/05/2026   99 €  servix Mensual
  'cmsm4nxi70003j4fx0uo6xvx0',  -- 09/08/2026   49 €  gymstack Mensual
  'cmsm53g900003g2rczc954x5p',  -- 09/08/2026   49 €  gymstack Mensual
  'cmspvq33a00035mecdwnxyk5o',  -- 12/08/2026    1 €  news
  'cmspzyxia000cf3nbfha4esaj'   -- 12/08/2026    1 €  news
);

-- Suscripciones de prueba/demo (todas con tenant vivo: no se cancelan, solo se marcan)
UPDATE "Subscription" SET "isTest" = true
WHERE id IN (
  'cmolz3y590002hye655mtxq0i',  -- servix Anual   tenant restaurante-cmohqqezp…
  'cmp4l38xa00028vs7ftv3lg70',  -- servix Mensual       tenant restaurant-test-mp4l41u2
  'cmsm4nxi30001j4fxjxa100hz',  -- gymstack Mensual  tenant hunter-gym
  'cmsm53g8t0001g2rccd0xqj1g',  -- gymstack Mensual   tenant hunter
  'cmsm4aszz0002f3ggpojiz65l',  -- gymstack Anual      tenant mi-gimnasio (sin cobro)
  'cmspvq32o00015mecal9kdc0w',  -- news Suscripción
  'cmsoqzbwd0001dlcrmardxy8i',  -- news Gratis   (sin cobro)
  'cmspzyxi5000af3nby63iqutl'   -- news Suscripción
);

-- Productos nuevos (panel genérico). dbUrlEnvVar = variable de entorno de innovapp con su BD.
INSERT INTO "Product" (slug, name, "dbUrlEnvVar") VALUES
  ('agentes',  'Agentes IA', 'AGENTES_DB_URL'),
  ('iglesias', 'Iglesias',   'LAVID_DB_URL')
ON CONFLICT (slug) DO NOTHING;

-- Comprobación: 6 cobros y 8 suscripciones marcados; si no, se revierte todo.
DO $$ BEGIN
  IF (SELECT count(*) FROM "Invoice" WHERE "isTest") <> 6 OR (SELECT count(*) FROM "Subscription" WHERE "isTest") <> 8 THEN
    RAISE EXCEPTION 'Recuento inesperado de isTest';
  END IF;
END $$;

COMMIT;
