-- =============================================================================
-- Fase 2 del panel /admin: Contabilidad y Proyectos — estructura (sin datos)
-- Base de datos: innovapp_db (como innovapp_user)
-- Después: npx prisma db pull && npx prisma generate
--
-- Principios:
--   * Una sola fuente de facturas: fac_facturas. Ingresos = facturas emitidas/pagadas
--     (+ cobros online sin factura, informativos y aparte; nunca se suman dos veces).
--   * Gastos en fac_gastos. Los generados por un recurrente nacen «previstos»: cuentan en
--     Contabilidad pero NO en los libros ni en 303/130 hasta que se registra la factura real.
--   * Recurrentes de gasto en fac_recurrentes (tipo = 'gasto'); nunca emiten facturas.
--   * Los gastos semilla van aparte: sql/2026-11-02_gastos_semilla.sql.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Proyectos a medida
-- -----------------------------------------------------------------------------
CREATE TABLE proyectos (
  id                 text          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cliente_id         text          REFERENCES fac_clientes(id) ON DELETE RESTRICT,
  nombre             text          NOT NULL,
  descripcion        text,
  presupuesto        numeric(12,2) CHECK (presupuesto IS NULL OR presupuesto >= 0),  -- base, sin IVA
  estado             text          NOT NULL DEFAULT 'propuesta'
                     CHECK (estado IN ('propuesta', 'aceptado', 'en_curso', 'entregado', 'cerrado', 'cancelado')),
  fecha_inicio       date,
  fecha_entrega      date,          -- prevista
  fecha_fin          date,          -- real
  producto_slug      text,          -- si el proyecto es de una línea (p. ej. una integración de Agentes IA)
  notas              text,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX proyectos_cliente_idx ON proyectos (cliente_id);
CREATE INDEX proyectos_estado_idx ON proyectos (estado);

-- -----------------------------------------------------------------------------
-- 2. Atribución de ingresos: producto y proyecto en las facturas
--    (las automáticas de cobros online se rellenan desde Invoice → Plan → Product)
-- -----------------------------------------------------------------------------
ALTER TABLE fac_facturas
  ADD COLUMN producto_slug text,
  ADD COLUMN proyecto_id   text REFERENCES proyectos(id) ON DELETE SET NULL;
CREATE INDEX fac_facturas_proyecto_idx ON fac_facturas (proyecto_id);

-- -----------------------------------------------------------------------------
-- 3. Recurrentes de gasto (reutiliza fac_recurrentes)
-- -----------------------------------------------------------------------------
ALTER TABLE fac_recurrentes
  ADD COLUMN tipo            text    NOT NULL DEFAULT 'factura' CHECK (tipo IN ('factura', 'gasto')),
  ADD COLUMN periodicidad    text    NOT NULL DEFAULT 'mensual' CHECK (periodicidad IN ('mensual', 'anual')),
  ADD COLUMN proveedor       text,
  ADD COLUMN proveedor_nif   text,
  ADD COLUMN proveedor_pais  char(2) NOT NULL DEFAULT 'ES',
  ADD COLUMN categoria       text,
  ADD COLUMN producto_slug   text,
  ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE fac_recurrentes ADD CONSTRAINT fac_recurrentes_tipo_ck CHECK (
  (tipo = 'factura' AND cliente_id IS NOT NULL) OR
  (tipo = 'gasto' AND proveedor IS NOT NULL AND emitir_auto = false AND enviar_email = false)
);
-- En las de gasto, lineas = [{ "descripcion", "cantidad", "precio_unitario" (base), "descuento_pct", "tipo_iva" }], como en las de factura.

-- -----------------------------------------------------------------------------
-- 4. Gastos: previstos, producto/proyecto y origen recurrente
-- -----------------------------------------------------------------------------
ALTER TABLE fac_gastos
  ADD COLUMN estado         text NOT NULL DEFAULT 'registrado' CHECK (estado IN ('previsto', 'registrado')),
  ADD COLUMN producto_slug  text,
  ADD COLUMN proyecto_id    text REFERENCES proyectos(id) ON DELETE SET NULL,
  ADD COLUMN recurrente_id  text REFERENCES fac_recurrentes(id) ON DELETE SET NULL;
-- Un recurrente no genera dos gastos para la misma fecha (el cron puede repetirse).
CREATE UNIQUE INDEX fac_gastos_recurrente_fecha_uq ON fac_gastos (recurrente_id, fecha) WHERE recurrente_id IS NOT NULL;
CREATE INDEX fac_gastos_estado_idx ON fac_gastos (estado);

-- -----------------------------------------------------------------------------
-- 5. Metas
-- -----------------------------------------------------------------------------
CREATE TABLE metas (
  id             text          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  metrica        text          NOT NULL CHECK (metrica IN ('mrr', 'ingresos', 'beneficio', 'clientes_activos', 'altas')),
  objetivo       numeric(12,2) NOT NULL CHECK (objetivo > 0),
  periodo        text          NOT NULL CHECK (periodo IN ('mes', 'trimestre', 'anio')),
  desde          date          NOT NULL,
  hasta          date          NOT NULL CHECK (hasta >= desde),
  producto_slug  text,         -- NULL = todo el negocio
  activa         boolean       NOT NULL DEFAULT true,
  notas          text,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. Cobros de Agentes IA facturados desde innovapp (botón «Facturar» de la cuota)
--    origen = 'agentes' y pago_ref = id de la CuotaPago en agentes_db.
-- -----------------------------------------------------------------------------
ALTER TABLE fac_facturas DROP CONSTRAINT fac_facturas_origen_check;
ALTER TABLE fac_facturas ADD CONSTRAINT fac_facturas_origen_check
  CHECK (origen IN ('manual', 'stripe', 'redsys', 'recurrente', 'agentes'));
-- Una cuota no se factura dos veces (salvo que la factura anterior se anule).
CREATE UNIQUE INDEX fac_facturas_agentes_cuota_uq ON fac_facturas (pago_ref)
  WHERE origen = 'agentes' AND estado <> 'anulada';

-- -----------------------------------------------------------------------------
-- 7. Producto y proyecto editables también en facturas emitidas (dato interno, no fiscal):
--    misma función de guarda, con dos campos más en la lista de permitidos.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fac_facturas_guard()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  permitidas text[] := ARRAY['estado','metodo_pago','fecha_pago','pdf_path','entregada_at','entregada_via',
                             'recordatorios_enviados','ultimo_recordatorio_at','updated_at',
                             'producto_slug','proyecto_id'];  -- atribución interna (no fiscal)
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.estado <> 'borrador' THEN
      RAISE EXCEPTION 'Factura % (%) no se puede borrar: solo se borran borradores', OLD.num_serie_factura, OLD.estado;
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.estado = 'borrador' THEN
    IF NEW.estado NOT IN ('borrador','emitida') THEN
      RAISE EXCEPTION 'Un borrador solo puede pasar a emitida (pedido: %)', NEW.estado;
    END IF;
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - permitidas) IS DISTINCT FROM (to_jsonb(OLD) - permitidas) THEN
    RAISE EXCEPTION 'Factura % emitida: datos inmutables. Corrígela con una rectificativa', OLD.num_serie_factura;
  END IF;

  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    IF NOT ( (OLD.estado = 'emitida' AND NEW.estado IN ('pagada','anulada'))
          OR (OLD.estado = 'pagada'  AND NEW.estado = 'emitida') ) THEN
      RAISE EXCEPTION 'Transición de estado no permitida: % → %', OLD.estado, NEW.estado;
    END IF;
    IF NEW.estado = 'anulada' AND (OLD.entregada_at IS NOT NULL OR OLD.fecha_pago IS NOT NULL OR OLD.pago_ref IS NOT NULL) THEN
      RAISE EXCEPTION 'Factura % entregada o cobrada: no se puede anular, emite una rectificativa', OLD.num_serie_factura;
    END IF;
    IF OLD.estado = 'pagada' AND NEW.estado = 'emitida' AND OLD.pago_ref IS NOT NULL THEN
      RAISE EXCEPTION 'Factura %: un cobro online confirmado no se puede deshacer', OLD.num_serie_factura;
    END IF;
  END IF;

  IF OLD.pdf_path IS NOT NULL AND NEW.pdf_path IS DISTINCT FROM OLD.pdf_path THEN
    RAISE EXCEPTION 'Factura %: el PDF ya generado no se puede sustituir', OLD.num_serie_factura;
  END IF;
  IF OLD.entregada_at IS NOT NULL AND NEW.entregada_at IS DISTINCT FROM OLD.entregada_at THEN
    RAISE EXCEPTION 'Factura %: la fecha de entrega no se puede modificar', OLD.num_serie_factura;
  END IF;

  RETURN NEW;
END $function$;

COMMIT;
