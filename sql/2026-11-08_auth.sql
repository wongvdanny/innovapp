-- Recuperación de contraseña y cierre de sesiones al cambiarla (innovapp_db, como innovapp_user).
-- Después: npx prisma db pull && npx prisma generate
BEGIN;

-- Solo se guarda el hash (sha256) del token; el token en claro viaja únicamente en el email.
CREATE TABLE "PasswordResetToken" (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "tokenHash" text NOT NULL UNIQUE,
  "expiresAt" timestamp(3) NOT NULL,          -- 1 hora
  "usedAt"    timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT now()
);
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- Las sesiones (JWT) iniciadas antes de este instante dejan de valer.
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" timestamp(3);

COMMIT;
