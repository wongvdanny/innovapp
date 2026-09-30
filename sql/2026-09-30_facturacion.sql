-- =============================================================================
-- Módulo de facturación (admin innovapp.es) — esquema inicial
-- Base de datos: innovapp_db
-- Aplicar con: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/2026-09-30_facturacion.sql
-- Después: npx prisma db pull && npx prisma generate
--
-- Principios:
--   * Importes en numeric (nunca float). Redondeo a 2 decimales por línea en código (decimal.js).
--   * Los borradores NO consumen número: numero / num_serie_factura se asignan al emitir.
--   * Una factura emitida es inmutable (trigger). Solo cambian los campos de cobro/entrega.
--     Se corrige con rectificativa; "anular" solo si no se entregó ni se cobró.
--   * fac_registros_verifactu y fac_eventos son append-only (trigger).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Ajustes (una sola fila)
-- -----------------------------------------------------------------------------
CREATE TABLE fac_ajustes (
  id                          integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  emisor_nombre               text          NOT NULL DEFAULT '',
  nombre_comercial            text          NOT NULL DEFAULT '',
  nif                         text          NOT NULL DEFAULT '',          -- obligatorio para emitir
  direccion                   text          NOT NULL DEFAULT '',
  cp                          text          NOT NULL DEFAULT '',
  municipio                   text          NOT NULL DEFAULT '',
  provincia                   text          NOT NULL DEFAULT '',
  pais                        char(2)       NOT NULL DEFAULT 'ES',
  email                       text          NOT NULL DEFAULT '',
  telefono                    text          NOT NULL DEFAULT '',
  iban                        text          NOT NULL DEFAULT '',
  iae                         text          NOT NULL DEFAULT '763',
  iva_defecto                 numeric(5,2)  NOT NULL DEFAULT 21,
  retencion_defecto           numeric(5,2)  NOT NULL DEFAULT 7,
  retencion_en_cobros_online  boolean       NOT NULL DEFAULT false,
  limite_simplificada         numeric(12,2) NOT NULL DEFAULT 400,        -- F2 hasta este total IVA incl.
  dias_vencimiento            integer       NOT NULL DEFAULT 15 CHECK (dias_vencimiento >= 0),
  recordatorios_activos       boolean       NOT NULL DEFAULT true,
  recordatorio_cada_dias      integer       NOT NULL DEFAULT 7 CHECK (recordatorio_cada_dias > 0),
  recordatorio_max            integer       NOT NULL DEFAULT 3 CHECK (recordatorio_max >= 0),
  texto_pie                   text          NOT NULL DEFAULT '',
  logo_path                   text,
  verifactu_activo            boolean       NOT NULL DEFAULT false,
  fecha_inicio_actividad      date          NOT NULL DEFAULT DATE '2026-10-01',
  updated_at                  timestamptz   NOT NULL DEFAULT now()
);

INSERT INTO fac_ajustes (id, emisor_nombre, nombre_comercial, direccion, cp, municipio, provincia, pais)
VALUES (1, 'Danny Gary Wong Vera', 'innovapp', 'Avenida Príncipe de Asturias 141', '33660', 'Oviedo', 'Asturias', 'ES');

-- -----------------------------------------------------------------------------
-- 2. Series (una fila por código y año → reinicio anual automático)
-- -----------------------------------------------------------------------------
CREATE TABLE fac_series (
  id             text        PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  codigo         char(1)     NOT NULL CHECK (codigo IN ('F','S','R')),   -- F ordinaria, S simplificada, R rectificativa
  anio           integer     NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
  prefijo        text        NOT NULL,                                   -- p.ej. 'F2026-'
  ultimo_numero  integer     NOT NULL DEFAULT 0 CHECK (ultimo_numero >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (codigo, anio),
  UNIQUE (prefijo)
);

-- -----------------------------------------------------------------------------
-- 3. Clientes
-- -----------------------------------------------------------------------------
CREATE TABLE fac_clientes (
  id                text        PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  tipo              text        NOT NULL CHECK (tipo IN ('empresa','autonomo','particular')),
  razon_social      text        NOT NULL,
  nombre_comercial  text,
  nif               text,                                   -- NIF/NIE/CIF o NIF-IVA
  tipo_id           text        NOT NULL DEFAULT '01',      -- VeriFactu: 01 NIF, 02 NIF-IVA, 03 pasaporte, 04 doc. oficial país, 05 cert. residencia, 06 otro
  pais              char(2)     NOT NULL DEFAULT 'ES',
  direccion         text,
  cp                text,
  municipio         text,
  provincia         text,
  email             text,
  telefono          text,
  aplica_retencion  boolean     NOT NULL DEFAULT false,
  user_id           text        REFERENCES "User"(id) ON DELETE SET NULL,
  notas             text,
  activo            boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fac_clientes_nif_idx     ON fac_clientes (upper(nif));
CREATE INDEX fac_clientes_user_idx    ON fac_clientes (user_id);
CREATE INDEX fac_clientes_nombre_idx  ON fac_clientes (lower(razon_social));

-- -----------------------------------------------------------------------------
-- 4. Plantillas de conceptos frecuentes
-- -----------------------------------------------------------------------------
CREATE TABLE fac_conceptos (
  id               text          PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  descripcion      text          NOT NULL,
  precio_unitario  numeric(14,4) NOT NULL DEFAULT 0,
  tipo_iva         numeric(5,2)  NOT NULL DEFAULT 21,
  activo           boolean       NOT NULL DEFAULT true,
  usos             integer       NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. Facturas recurrentes (igualas mensuales)
-- -----------------------------------------------------------------------------
CREATE TABLE fac_recurrentes (
  id                 text        PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  cliente_id         text        NOT NULL REFERENCES fac_clientes(id) ON DELETE RESTRICT,
  descripcion        text        NOT NULL,
  lineas             jsonb       NOT NULL,                  -- [{descripcion,cantidad,precio_unitario,descuento_pct,tipo_iva}]
  dia_mes            integer     NOT NULL CHECK (dia_mes BETWEEN 1 AND 28),
  proxima_fecha      date        NOT NULL,
  emitir_auto        boolean     NOT NULL DEFAULT true,     -- false = dejar en borrador
  enviar_email       boolean     NOT NULL DEFAULT true,
  activo             boolean     NOT NULL DEFAULT true,
  ultima_factura_id  text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. Facturas emitidas
-- -----------------------------------------------------------------------------
CREATE TABLE fac_facturas (
  id                      text          PRIMARY KEY DEFAULT (gen_random_uuid())::text,

  -- Numeración (NULL mientras es borrador)
  serie_codigo            char(1)       NOT NULL CHECK (serie_codigo IN ('F','S','R')),
  serie_id                text          REFERENCES fac_series(id) ON DELETE RESTRICT,
  numero                  integer       CHECK (numero > 0),
  num_serie_factura       text          CHECK (char_length(num_serie_factura) <= 60),
  tipo_factura            text          NOT NULL CHECK (tipo_factura IN ('F1','F2','F3','R1','R2','R3','R4','R5')),

  fecha_expedicion        date,
  fecha_operacion         date,                                 -- solo si difiere de la expedición
  fecha_vencimiento       date,
  descripcion_operacion   text          NOT NULL DEFAULT '' CHECK (char_length(descripcion_operacion) <= 500),

  cliente_id              text          REFERENCES fac_clientes(id) ON DELETE RESTRICT,  -- NULL posible en F2
  emisor_snapshot         jsonb,
  cliente_snapshot        jsonb,

  -- Importes (ImporteTotal VeriFactu = base + cuota IVA; la retención NO forma parte)
  base_imponible          numeric(12,2) NOT NULL DEFAULT 0,
  cuota_iva               numeric(12,2) NOT NULL DEFAULT 0,
  importe_total           numeric(12,2) NOT NULL DEFAULT 0,
  tipo_retencion          numeric(5,2)  NOT NULL DEFAULT 0,
  cuota_retencion         numeric(12,2) NOT NULL DEFAULT 0,
  liquido_a_cobrar        numeric(12,2) NOT NULL DEFAULT 0,     -- importe_total - cuota_retencion

  estado                  text          NOT NULL DEFAULT 'borrador'
                                        CHECK (estado IN ('borrador','emitida','pagada','anulada')),
  metodo_pago             text          CHECK (metodo_pago IN ('transferencia','tarjeta','stripe','redsys','efectivo','domiciliacion','otro')),
  fecha_pago              date,

  origen                  text          NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual','stripe','redsys','recurrente')),
  pago_ref                text,                                 -- 'stripe:<session>' / 'redsys:<order>' (idempotencia)
  invoice_id              text,                                 -- "Invoice".id (sin FK: el admin puede borrar suscripciones)
  recurrente_id           text          REFERENCES fac_recurrentes(id) ON DELETE SET NULL,
  bloqueo_motivo          text,                                 -- por qué un borrador automático no se emitió

  -- Rectificativas
  rectificada_id          text          REFERENCES fac_facturas(id) ON DELETE RESTRICT,
  tipo_rectificacion      char(1)       CHECK (tipo_rectificacion IN ('S','I')),
  motivo_rectificacion    text,
  base_rectificada        numeric(12,2),                        -- solo tipo S
  cuota_rectificada       numeric(12,2),                        -- solo tipo S

  modo_verifactu          boolean       NOT NULL DEFAULT false, -- modo vigente al emitir (QR + leyenda en PDF)
  notas                   text,
  pdf_path                text,
  entregada_at            timestamptz,                          -- email enviado con éxito / "Marcar como entregada" (NO la descarga desde el admin)
  entregada_via           text,
  recordatorios_enviados  integer       NOT NULL DEFAULT 0,
  ultimo_recordatorio_at  timestamptz,

  emitida_at              timestamptz,
  created_by              text,
  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now(),

  -- Coherencia
  CONSTRAINT fac_facturas_emitida_completa CHECK (
    estado = 'borrador' OR (
      serie_id IS NOT NULL AND numero IS NOT NULL AND num_serie_factura IS NOT NULL
      AND fecha_expedicion IS NOT NULL AND emisor_snapshot IS NOT NULL
      AND cliente_snapshot IS NOT NULL AND emitida_at IS NOT NULL
    )
  ),
  CONSTRAINT fac_facturas_rectificativa CHECK (
    (tipo_factura LIKE 'R%') = (rectificada_id IS NOT NULL AND tipo_rectificacion IS NOT NULL)
  ),
  CONSTRAINT fac_facturas_f1_con_cliente CHECK (
    estado = 'borrador' OR tipo_factura IN ('F2','R5') OR cliente_id IS NOT NULL
  ),
  CONSTRAINT fac_facturas_totales CHECK (
    importe_total = base_imponible + cuota_iva AND liquido_a_cobrar = importe_total - cuota_retencion
  ),
  CONSTRAINT fac_facturas_pagada_fecha CHECK (estado <> 'pagada' OR fecha_pago IS NOT NULL)
);
CREATE UNIQUE INDEX fac_facturas_serie_numero_uq ON fac_facturas (serie_id, numero) WHERE numero IS NOT NULL;
CREATE UNIQUE INDEX fac_facturas_numserie_uq     ON fac_facturas (num_serie_factura) WHERE num_serie_factura IS NOT NULL;
CREATE UNIQUE INDEX fac_facturas_pago_ref_uq     ON fac_facturas (pago_ref)   WHERE pago_ref IS NOT NULL;
CREATE UNIQUE INDEX fac_facturas_invoice_uq      ON fac_facturas (invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX fac_facturas_estado_idx   ON fac_facturas (estado);
CREATE INDEX fac_facturas_fecha_idx    ON fac_facturas (fecha_expedicion);
CREATE INDEX fac_facturas_cliente_idx  ON fac_facturas (cliente_id);
CREATE INDEX fac_facturas_rectif_idx   ON fac_facturas (rectificada_id);

-- -----------------------------------------------------------------------------
-- 7. Líneas
-- -----------------------------------------------------------------------------
CREATE TABLE fac_lineas (
  id                 text          PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  factura_id         text          NOT NULL REFERENCES fac_facturas(id) ON DELETE CASCADE,
  orden              integer       NOT NULL DEFAULT 0,
  descripcion        text          NOT NULL,
  cantidad           numeric(14,4) NOT NULL DEFAULT 1,
  precio_unitario    numeric(14,4) NOT NULL DEFAULT 0,
  descuento_pct      numeric(5,2)  NOT NULL DEFAULT 0 CHECK (descuento_pct BETWEEN 0 AND 100),
  tipo_iva           numeric(5,2)  NOT NULL DEFAULT 21,
  clave_regimen      text          NOT NULL DEFAULT '01',     -- VeriFactu ClaveRegimen
  calificacion       text          NOT NULL DEFAULT 'S1'      -- S1/S2 sujeta, N1/N2 no sujeta
                                   CHECK (calificacion IN ('S1','S2','N1','N2')),
  operacion_exenta   text          CHECK (operacion_exenta IN ('E1','E2','E3','E4','E5','E6')),
  base               numeric(12,2) NOT NULL DEFAULT 0,        -- redondeada por línea
  cuota              numeric(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX fac_lineas_factura_idx ON fac_lineas (factura_id, orden);

-- -----------------------------------------------------------------------------
-- 8. Registros VeriFactu (append-only; encadenamiento por huella)
-- -----------------------------------------------------------------------------
CREATE TABLE fac_registros_verifactu (
  id                            bigserial     PRIMARY KEY,           -- orden de la cadena
  tipo_registro                 text          NOT NULL CHECK (tipo_registro IN ('alta','anulacion')),
  factura_id                    text          NOT NULL REFERENCES fac_facturas(id) ON DELETE RESTRICT,
  id_emisor_factura             text          NOT NULL,
  num_serie_factura             text          NOT NULL,
  fecha_expedicion_factura      text          NOT NULL,              -- dd-mm-aaaa, tal cual entra en la huella
  tipo_factura                  text,                                -- NULL en anulaciones
  cuota_total                   numeric(12,2),                       -- NULL en anulaciones
  importe_total                 numeric(12,2),                       -- NULL en anulaciones
  primer_registro               boolean       NOT NULL DEFAULT false,
  huella_anterior               text,                                -- NULL solo en el primer registro
  huella                        text          NOT NULL,              -- SHA-256 hex mayúsculas
  fecha_hora_huso_gen_registro  text          NOT NULL,              -- ISO 8601 con huso, tal cual entra en la huella
  cadena_huella                 text          NOT NULL,              -- texto exacto que se hasheó (auditoría)
  xml                           text,
  estado_envio                  text          NOT NULL DEFAULT 'pendiente'
                                              CHECK (estado_envio IN ('pendiente','enviado','aceptado','aceptado_con_errores','rechazado')),
  csv_aeat                      text,
  respuesta_aeat                jsonb,
  ultimo_error                  text,
  intentos                      integer       NOT NULL DEFAULT 0,
  enviado_at                    timestamptz,
  created_at                    timestamptz   NOT NULL DEFAULT now(),
  updated_at                    timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT fac_rv_primer CHECK (primer_registro = (huella_anterior IS NULL)),
  CONSTRAINT fac_rv_alta_importes CHECK (
    tipo_registro = 'anulacion' OR (tipo_factura IS NOT NULL AND cuota_total IS NOT NULL AND importe_total IS NOT NULL)
  )
);
CREATE UNIQUE INDEX fac_rv_huella_uq          ON fac_registros_verifactu (huella);
CREATE UNIQUE INDEX fac_rv_huella_anterior_uq ON fac_registros_verifactu (huella_anterior) WHERE huella_anterior IS NOT NULL; -- cadena lineal
CREATE UNIQUE INDEX fac_rv_primer_uq          ON fac_registros_verifactu (primer_registro) WHERE primer_registro;          -- un solo inicio
CREATE INDEX fac_rv_factura_idx ON fac_registros_verifactu (factura_id);
CREATE INDEX fac_rv_envio_idx   ON fac_registros_verifactu (estado_envio);

-- -----------------------------------------------------------------------------
-- 9. Eventos (log inalterable)
-- -----------------------------------------------------------------------------
CREATE TABLE fac_eventos (
  id           bigserial   PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  usuario_id   text,
  usuario      text,                  -- email o 'sistema' / 'cron' / 'webhook'
  accion       text        NOT NULL,  -- p.ej. factura.emitida, factura.pagada, ajustes.actualizados
  entidad      text        NOT NULL,
  entidad_id   text,
  ip           text,
  payload      jsonb
);
CREATE INDEX fac_eventos_entidad_idx ON fac_eventos (entidad, entidad_id);
CREATE INDEX fac_eventos_fecha_idx   ON fac_eventos (created_at);

-- -----------------------------------------------------------------------------
-- 10. Gastos (facturas recibidas)
-- -----------------------------------------------------------------------------
CREATE TABLE fac_gastos (
  id                text          PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  proveedor         text          NOT NULL,
  proveedor_nif     text,
  proveedor_pais    char(2)       NOT NULL DEFAULT 'ES',
  numero            text,
  fecha             date          NOT NULL,                  -- fecha de expedición
  fecha_registro    date          NOT NULL DEFAULT CURRENT_DATE,
  concepto          text,
  categoria         text          NOT NULL DEFAULT 'otros',
  base_imponible    numeric(12,2) NOT NULL DEFAULT 0,
  tipo_iva          numeric(5,2)  NOT NULL DEFAULT 21,
  cuota_iva         numeric(12,2) NOT NULL DEFAULT 0,
  tipo_retencion    numeric(5,2)  NOT NULL DEFAULT 0,
  cuota_retencion   numeric(12,2) NOT NULL DEFAULT 0,
  total             numeric(12,2) NOT NULL DEFAULT 0,
  deducible_pct     numeric(5,2)  NOT NULL DEFAULT 100 CHECK (deducible_pct BETWEEN 0 AND 100),
  iva_deducible     boolean       NOT NULL DEFAULT true,
  adjunto_path      text,
  adjunto_mime      text,
  notas             text,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX fac_gastos_fecha_idx ON fac_gastos (fecha);

-- =============================================================================
-- TRIGGERS DE INMUTABILIDAD
-- =============================================================================

-- Facturas: borrador libre; emitida → solo campos de cobro/entrega.
CREATE OR REPLACE FUNCTION fac_facturas_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  permitidas text[] := ARRAY['estado','metodo_pago','fecha_pago','pdf_path','entregada_at','entregada_via',
                             'recordatorios_enviados','ultimo_recordatorio_at','updated_at'];
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
END $$;

CREATE TRIGGER fac_facturas_guard_trg
  BEFORE UPDATE OR DELETE ON fac_facturas
  FOR EACH ROW EXECUTE FUNCTION fac_facturas_guard();

-- Cada cambio de estado deja un evento, lo haga quien lo haga (app, psql…).
-- La app identifica al usuario con: SELECT set_config('fac.usuario', '<email>', true) dentro de la transacción.
CREATE OR REPLACE FUNCTION fac_facturas_log_estado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO fac_eventos (usuario, accion, entidad, entidad_id, payload)
  VALUES (
    COALESCE(NULLIF(current_setting('fac.usuario', true), ''), 'db:' || current_user),
    'factura.estado', 'factura', NEW.id,
    jsonb_build_object('de', OLD.estado, 'a', NEW.estado, 'num_serie_factura', NEW.num_serie_factura,
                       'metodo_pago', NEW.metodo_pago, 'fecha_pago', NEW.fecha_pago)
  );
  RETURN NULL;
END $$;

CREATE TRIGGER fac_facturas_log_estado_trg
  AFTER UPDATE OF estado ON fac_facturas
  FOR EACH ROW WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION fac_facturas_log_estado();

-- Atomicidad VeriFactu: al hacer COMMIT, toda factura emitida debe tener su registro de alta
-- y toda anulada su registro de anulación, creados en la misma transacción.
CREATE OR REPLACE FUNCTION fac_facturas_exige_registro() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'emitida' AND OLD.estado = 'borrador' AND NOT EXISTS (
       SELECT 1 FROM fac_registros_verifactu WHERE factura_id = NEW.id AND tipo_registro = 'alta') THEN
    RAISE EXCEPTION 'Factura % emitida sin registro VeriFactu de alta', NEW.num_serie_factura;
  END IF;
  IF NEW.estado = 'anulada' AND NOT EXISTS (
       SELECT 1 FROM fac_registros_verifactu WHERE factura_id = NEW.id AND tipo_registro = 'anulacion') THEN
    RAISE EXCEPTION 'Factura % anulada sin registro VeriFactu de anulación', NEW.num_serie_factura;
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER fac_facturas_exige_registro_trg
  AFTER UPDATE OF estado ON fac_facturas
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW.estado IN ('emitida','anulada') AND OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION fac_facturas_exige_registro();

-- Líneas: solo modificables mientras la factura es borrador.
CREATE OR REPLACE FUNCTION fac_lineas_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE est text;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT estado INTO est FROM fac_facturas WHERE id = OLD.factura_id;
    IF est IS NOT NULL AND est <> 'borrador' THEN
      RAISE EXCEPTION 'Las líneas de una factura emitida son inmutables';
    END IF;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT estado INTO est FROM fac_facturas WHERE id = NEW.factura_id;
    IF est IS NOT NULL AND est <> 'borrador' THEN
      RAISE EXCEPTION 'No se pueden añadir líneas a una factura emitida';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER fac_lineas_guard_trg
  BEFORE INSERT OR UPDATE OR DELETE ON fac_lineas
  FOR EACH ROW EXECUTE FUNCTION fac_lineas_guard();

-- Registros VeriFactu: sin DELETE; UPDATE solo de campos de envío (y xml si aún era NULL).
CREATE OR REPLACE FUNCTION fac_registros_verifactu_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  permitidas text[] := ARRAY['xml','estado_envio','csv_aeat','respuesta_aeat','ultimo_error','intentos','enviado_at','updated_at'];
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'fac_registros_verifactu es append-only';
  END IF;
  IF (to_jsonb(NEW) - permitidas) IS DISTINCT FROM (to_jsonb(OLD) - permitidas) THEN
    RAISE EXCEPTION 'Registro VeriFactu %: datos inmutables', OLD.id;
  END IF;
  IF OLD.xml IS NOT NULL AND NEW.xml IS DISTINCT FROM OLD.xml THEN
    RAISE EXCEPTION 'Registro VeriFactu %: el XML ya generado no se puede sustituir', OLD.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER fac_registros_verifactu_guard_trg
  BEFORE UPDATE OR DELETE ON fac_registros_verifactu
  FOR EACH ROW EXECUTE FUNCTION fac_registros_verifactu_guard();

-- Eventos: inalterables.
CREATE OR REPLACE FUNCTION fac_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% es append-only (% no permitido)', TG_TABLE_NAME, TG_OP;
END $$;

CREATE TRIGGER fac_eventos_guard_trg
  BEFORE UPDATE OR DELETE ON fac_eventos
  FOR EACH ROW EXECUTE FUNCTION fac_append_only();

-- TRUNCATE salta los triggers por fila: bloquearlo explícitamente.
CREATE TRIGGER fac_facturas_no_truncate  BEFORE TRUNCATE ON fac_facturas            FOR EACH STATEMENT EXECUTE FUNCTION fac_append_only();
CREATE TRIGGER fac_lineas_no_truncate    BEFORE TRUNCATE ON fac_lineas              FOR EACH STATEMENT EXECUTE FUNCTION fac_append_only();
CREATE TRIGGER fac_rv_no_truncate        BEFORE TRUNCATE ON fac_registros_verifactu FOR EACH STATEMENT EXECUTE FUNCTION fac_append_only();
CREATE TRIGGER fac_eventos_no_truncate   BEFORE TRUNCATE ON fac_eventos             FOR EACH STATEMENT EXECUTE FUNCTION fac_append_only();

COMMIT;
