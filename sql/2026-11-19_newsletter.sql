-- =============================================================================
-- Newsletter con consentimiento documentado, doble opt-in y baja con un clic
-- Base de datos: innovapp_db (como innovapp_user). Después: prisma db pull + generate.
--
-- Principios:
--   * Solo reciben campañas los suscriptores «confirmado». Alta pública = doble opt-in.
--   * Todo alta guarda la prueba del consentimiento: texto, fecha, IP (si la hay) y medio.
--   * La baja es inmediata y definitiva salvo que la persona vuelva a suscribirse.
--   * Cada cambio relevante queda en newsletter_historial (solo se inserta: rendición de cuentas RGPD).
--   * Un suscriptor recibe cada campaña como mucho una vez (UNIQUE campana + suscriptor).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Suscriptores
-- -----------------------------------------------------------------------------
CREATE TABLE newsletter_suscriptores (
  id                       text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email                    text        NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND email LIKE '%_@_%._%'),
  nombre                   text,
  empresa                  text,
  sector                   text        NOT NULL DEFAULT 'otro'
                           CHECK (sector IN ('inmobiliaria', 'restaurante', 'ecommerce', 'otro')),
  estado                   text        NOT NULL DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente', 'confirmado', 'baja', 'rebotado')),
  origen                   text        NOT NULL
                           CHECK (origen IN ('formulario_web', 'alta_manual', 'importacion')),
  -- Prueba del consentimiento
  consentimiento_texto     text        NOT NULL CHECK (length(btrim(consentimiento_texto)) > 0),
  consentimiento_fecha     timestamptz NOT NULL,
  consentimiento_ip        text,
  -- Alta manual: cómo se obtuvo (obligatorio) y nota libre
  consentimiento_medio     text        CHECK (consentimiento_medio IN ('llamada', 'visita', 'reunion', 'respuesta_correo', 'otro')),
  consentimiento_nota      text,
  -- Doble opt-in: solo el hash (sha256) del token de confirmación
  token_confirmacion_hash  text        UNIQUE,
  confirmacion_enviada_at  timestamptz,
  confirmado_at            timestamptz,
  -- Baja: token propio de cada suscriptor (va en el enlace de cada correo)
  token_baja               text        NOT NULL UNIQUE,         -- lo genera la aplicación (crypto.randomBytes)
  baja_at                  timestamptz,
  baja_motivo              text        CHECK (baja_motivo IN ('enlace', 'one_click', 'queja', 'admin')),
  rebotado_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_suscriptores_medio_ck CHECK (origen <> 'alta_manual' OR consentimiento_medio IS NOT NULL),
  CONSTRAINT newsletter_suscriptores_confirmado_ck CHECK (estado <> 'confirmado' OR confirmado_at IS NOT NULL)
);
CREATE INDEX newsletter_suscriptores_estado_idx ON newsletter_suscriptores (estado, sector);

-- -----------------------------------------------------------------------------
-- 2. Historial (append-only): altas, confirmaciones, bajas, rebotes, quejas, cambios del admin
-- -----------------------------------------------------------------------------
CREATE TABLE newsletter_historial (
  id             bigserial   PRIMARY KEY,
  suscriptor_id  text        NOT NULL REFERENCES newsletter_suscriptores(id) ON DELETE RESTRICT,
  accion         text        NOT NULL,       -- alta, confirmacion, baja, rebote, queja, reactivacion, edicion…
  detalle        jsonb,
  ip             text,
  usuario        text,                       -- admin que lo hizo, o NULL si fue el propio suscriptor / un webhook
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX newsletter_historial_suscriptor_idx ON newsletter_historial (suscriptor_id, created_at);

CREATE FUNCTION newsletter_historial_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'newsletter_historial solo admite inserciones';
END $$;
CREATE TRIGGER newsletter_historial_inmutable_trg BEFORE UPDATE OR DELETE ON newsletter_historial
  FOR EACH ROW EXECUTE FUNCTION newsletter_historial_inmutable();

-- -----------------------------------------------------------------------------
-- 3. Campañas
-- -----------------------------------------------------------------------------
CREATE TABLE newsletter_campanas (
  id                text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  asunto            text        NOT NULL CHECK (length(btrim(asunto)) > 0),
  cuerpo_md         text        NOT NULL DEFAULT '',
  sectores          text[]      NOT NULL DEFAULT '{}'   -- vacío = todos los sectores
                    CHECK (sectores <@ ARRAY['inmobiliaria', 'restaurante', 'ecommerce', 'otro']::text[]),
  estado            text        NOT NULL DEFAULT 'borrador'
                    CHECK (estado IN ('borrador', 'programada', 'enviando', 'enviada', 'cancelada')),
  programada_para   timestamptz,
  iniciada_at       timestamptz,
  terminada_at      timestamptz,
  -- Si el plan de Resend tiene límite diario, el envío se pausa y el cron lo reanuda después
  pausada_hasta     timestamptz,
  ultimo_error      text,
  created_by        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_campanas_programada_ck CHECK (estado <> 'programada' OR programada_para IS NOT NULL)
);
CREATE INDEX newsletter_campanas_estado_idx ON newsletter_campanas (estado, programada_para);

-- -----------------------------------------------------------------------------
-- 4. Envíos (uno por campaña y suscriptor): estado según la API y los webhooks de Resend
-- -----------------------------------------------------------------------------
CREATE TABLE newsletter_envios (
  id             text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campana_id     text        NOT NULL REFERENCES newsletter_campanas(id) ON DELETE RESTRICT,
  suscriptor_id  text        NOT NULL REFERENCES newsletter_suscriptores(id) ON DELETE RESTRICT,
  email          text        NOT NULL,       -- copia en el momento del envío
  estado         text        NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'enviado', 'entregado', 'rebotado', 'queja', 'error', 'omitido')),
  resend_id      text        UNIQUE,
  error          text,
  enviado_at     timestamptz,
  entregado_at   timestamptz,
  rebotado_at    timestamptz,
  queja_at       timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campana_id, suscriptor_id)
);
CREATE INDEX newsletter_envios_campana_estado_idx ON newsletter_envios (campana_id, estado);
CREATE INDEX newsletter_envios_enviado_idx ON newsletter_envios (enviado_at) WHERE enviado_at IS NOT NULL;

COMMIT;
