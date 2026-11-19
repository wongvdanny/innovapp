-- Campaña borrador «Agente IA para inmobiliarias» (sector inmobiliaria, sin PDF). Se aplica al desplegar,
-- después de 2026-11-19_newsletter_datos.sql. Se revisa y se envía desde el panel.
BEGIN;
INSERT INTO newsletter_campanas (asunto, cuerpo_md, sectores, estado, created_by)
SELECT 'Prueba cómo atendería un agente de IA a los clientes de tu inmobiliaria',
$md$Hola, {{nombre}}:

Te escribo porque en Innovapp hemos creado un agente de IA pensado para inmobiliarias como {{empresa|la tuya}}. Atiende por WhatsApp y por teléfono como lo haría un comercial: pregunta qué busca el cliente, le propone inmuebles de la cartera y deja la visita en la agenda. Responde al momento, también por la noche y en fin de semana.

La mejor forma de verlo es probarlo como si fueras un cliente:

- Por WhatsApp: [escríbele a la inmobiliaria demo](https://wa.me/34617940994?text=Hola%2C%20busco%20un%20piso%20de%203%20habitaciones%20en%20Oviedo)
- Por teléfono: [984 27 62 59](tel:+34984276259)

Pídele un piso, pregúntale por una visita o dile que quieres vender el tuyo. Es una inmobiliaria de ejemplo con inmuebles ficticios.

Si te interesa, te llamo el día y a la hora que mejor te venga para contarte cómo funcionaría en tu inmobiliaria y resolver tus dudas. Solo tienes que responder a este correo con el momento que prefieras.

Un saludo,$md$,
       ARRAY['inmobiliaria'], 'borrador', 'migracion inicial'
WHERE NOT EXISTS (SELECT 1 FROM newsletter_campanas WHERE asunto = 'Prueba cómo atendería un agente de IA a los clientes de tu inmobiliaria');
COMMIT;
