-- Datos iniciales de la newsletter. Se aplica AL DESPLEGAR, después de 2026-11-19_newsletter.sql.
-- Todos entran como «pendiente»: al desplegar se les envía el correo de confirmación (doble opt-in)
-- y, si no confirman, no reciben nada. La tabla antigua "NewsletterSubscriber" no se toca.
BEGIN;

-- 1. Inscritos de /webgratis que marcaron la casilla de novedades y no se han dado de baja.
--    Texto aceptado: solo la frase de la casilla de marketing. No confirmaron su email en la promo.
INSERT INTO newsletter_suscriptores (email, nombre, origen, estado, consentimiento_texto, consentimiento_fecha, consentimiento_ip, token_baja)
SELECT lower(btrim(p.email)), p.name, 'importacion', 'pendiente',
       'Quiero recibir por email novedades y ofertas de Innovapp sobre webs, aplicaciones y automatización con IA para negocios. Puedo darme de baja en cualquier momento. (Casilla de la promoción /webgratis)',
       p."createdAt", p.ip, md5(random()::text || clock_timestamp()::text || p.id) || md5(random()::text || p.email)
FROM "PromoEntry" p
WHERE p."marketingConsent" AND p."unsubscribedAt" IS NULL
  AND position('Quiero recibir por email novedades y ofertas de Innovapp' IN p."consentText") > 0
ON CONFLICT (email) DO NOTHING;

-- 2. Suscriptores del formulario antiguo de la home (sin texto de consentimiento registrado).
--    Va después de la promo: si un email está en ambos, se queda el consentimiento documentado.
INSERT INTO newsletter_suscriptores (email, origen, estado, consentimiento_texto, consentimiento_fecha, token_baja)
SELECT lower(btrim(s.email)), 'formulario_web', 'pendiente',
       'Alta en el formulario de newsletter de la home (anterior al 2026-11-19, sin texto de consentimiento registrado). Pendiente de confirmar por doble opt-in.',
       s."createdAt", md5(random()::text || clock_timestamp()::text || s.id) || md5(random()::text || s.email)
FROM "NewsletterSubscriber" s
WHERE s.active
ON CONFLICT (email) DO NOTHING;

INSERT INTO newsletter_historial (suscriptor_id, accion, detalle)
SELECT id, 'alta', jsonb_build_object('via', 'migracion inicial', 'origen', origen) FROM newsletter_suscriptores;

COMMIT;
