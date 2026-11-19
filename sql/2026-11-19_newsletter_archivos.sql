-- Archivo opcional de una campaña (un PDF de hasta 5 MB) y registro de sus descargas.
-- Se aplica DESPUÉS de 2026-11-19_newsletter.sql (como innovapp_user). Después: prisma db pull + generate.
-- El PDF no viaja adjunto (la API batch de Resend no admite adjuntos): el correo lleva un botón
-- «Descargar» con un enlace propio de cada envío, y cada descarga queda registrada.
BEGIN;

CREATE TABLE newsletter_archivos (
  id          text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campana_id  text        NOT NULL UNIQUE REFERENCES newsletter_campanas(id) ON DELETE CASCADE,  -- uno por campaña
  nombre      text        NOT NULL CHECK (length(btrim(nombre)) > 0),   -- nombre original del archivo
  ruta        text        NOT NULL UNIQUE,                               -- relativa a la carpeta de archivos
  bytes       integer     NOT NULL CHECK (bytes > 0 AND bytes <= 5242880),
  mime        text        NOT NULL CHECK (mime = 'application/pdf'),
  sha256      text        NOT NULL,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_descargas (
  id          bigserial   PRIMARY KEY,
  archivo_id  text        NOT NULL REFERENCES newsletter_archivos(id) ON DELETE CASCADE,
  envio_id    text        REFERENCES newsletter_envios(id) ON DELETE SET NULL,  -- NULL: desde una prueba o la vista previa
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX newsletter_descargas_archivo_idx ON newsletter_descargas (archivo_id, created_at);
CREATE INDEX newsletter_descargas_envio_idx ON newsletter_descargas (envio_id);

COMMIT;
