# Pendientes

## Migrar /agentes-ia-restaurantes a la plantilla de sectores

Las landings de peluquerías, clínicas y talleres usan `components/sector/SectorLanding.tsx` con los
datos de `data/sectores.ts`. La de restaurantes (`pages/agentes-ia-restaurantes.tsx`) sigue siendo una
página propia: ya comparte el formulario (`components/sector/LeadForm.tsx`, `source="restaurantes"`)
y la API (`/api/lead`), pero no la plantilla.

Para migrarla, la plantilla necesita bloques opcionales para lo que solo tiene restaurantes:

- registro de jornada (sección propia con el marco legal del art. 34.9 ET, sin fechas ni
  obligatoriedad del registro digital);
- menú del día y alérgenos;
- sección «Propuesta a medida tras una visita de 15 minutos» (sin precios);
- su JSON-LD LocalBusiness (Oviedo), además del Service;
- su conversación de ejemplo (reserva para 4 el sábado), sus pasos («Así empezamos») y su FAQ.

Al migrar: mantener la URL, el canonical, el FAQPage, el `data-cta="demo-restaurante"` del CTA de
demo y el evento `generate_lead` con `lead_source: 'restaurantes'`. Comprobar después que el HTML
servido conserva un solo h1 y las mismas preguntas del FAQPage.

## Copia de seguridad de los leads

`storage/leads/*.jsonl` (leads con la prueba del consentimiento) no entra en
`scripts/backup-innovapp.sh`, que solo copia la BD y `storage/facturacion`.
