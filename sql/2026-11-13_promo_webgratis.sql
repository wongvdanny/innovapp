-- Promoción «4 webs gratis + IA» (/webgratis): inscripciones (innovapp_db, como innovapp_user).
-- Después: npx prisma generate (el modelo PromoEntry ya está en prisma/schema.prisma).
BEGIN;

CREATE TABLE "PromoEntry" (
  id                 text PRIMARY KEY,                       -- cuid() lo genera Prisma
  promo              text NOT NULL DEFAULT 'webgratis-2026',
  name               text NOT NULL,
  "businessName"     text NOT NULL,
  sector             text NOT NULL,
  city               text NOT NULL,
  province           text NOT NULL,
  email              text NOT NULL,
  phone              text NOT NULL,
  instagram          text NOT NULL,
  "currentWeb"       text,
  "contactChannel"   text NOT NULL,
  description        text NOT NULL,
  "acceptedTerms"    boolean NOT NULL,
  "marketingConsent" boolean NOT NULL DEFAULT false,
  "consentText"      text NOT NULL,                          -- texto exacto de las casillas aceptadas
  ip                 text,
  "userAgent"        text,
  "confirmToken"     text NOT NULL UNIQUE,
  "confirmedAt"      timestamp(3),
  "unsubscribedAt"   timestamp(3),
  "followsInstagram" boolean,                                -- lo marca el admin a mano
  status             text NOT NULL DEFAULT 'pending',        -- pending | shortlisted | selected | rejected
  "adminNotes"       text,
  "createdAt"        timestamp(3) NOT NULL DEFAULT now(),
  CONSTRAINT "PromoEntry_promo_email_key" UNIQUE (promo, email),
  CONSTRAINT "PromoEntry_status_check" CHECK (status IN ('pending', 'shortlisted', 'selected', 'rejected'))
);

COMMIT;
