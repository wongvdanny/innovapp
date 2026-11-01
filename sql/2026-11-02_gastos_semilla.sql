-- Gastos recurrentes semilla (desde 2026-10-01). Se aplica DESPUÉS de 2026-11-02_contabilidad.sql.
-- Suposición PROVISIONAL acordada (2026-11-01): importes = totales con IVA incluido, IVA 21 %, sin
-- inversión del sujeto pasivo. Generan gastos «previstos» (no entran en libros ni 303/130 hasta
-- registrarlos con la factura real); importes, IVA y proveedor se editan en Contabilidad → Gastos.
-- precio_unitario = base: total / 1,21 redondeado (10 € y 100 € quedan en 9,99 € y 99,99 € con IVA).
-- Si resulta que hay alta en el ROI: aplicar 2026-11-02_isp.sql y pasar los extranjeros a IVA 0 + ISP.
BEGIN;
INSERT INTO fac_recurrentes (tipo, periodicidad, descripcion, proveedor, proveedor_pais, categoria, lineas, dia_mes, proxima_fecha, emitir_auto, enviar_email) VALUES
  ('gasto', 'mensual', 'Servidor VPS',       'Contabo GmbH',               'DE', 'hosting',    '[{"descripcion":"Contabo VPS {mes} {año}","cantidad":"1","precio_unitario":"8.26","descuento_pct":"0","tipo_iva":"21"}]',   1, '2026-10-01', false, false),
  ('gasto', 'anual',   'Dominios',           'Pendiente',                  'ES', 'hosting',    '[{"descripcion":"Renovación de dominios {año}","cantidad":"1","precio_unitario":"8.26","descuento_pct":"0","tipo_iva":"21"}]', 1, '2026-10-01', false, false),
  ('gasto', 'mensual', 'Claude (Anthropic)', 'Anthropic, PBC',             'US', 'software',   '[{"descripcion":"Claude {mes} {año}","cantidad":"1","precio_unitario":"16.53","descuento_pct":"0","tipo_iva":"21"}]',     1, '2026-10-01', false, false),
  ('gasto', 'mensual', 'Meta Ads',           'Meta Platforms Ireland Ltd', 'IE', 'publicidad', '[{"descripcion":"Meta Ads {mes} {año}","cantidad":"1","precio_unitario":"49.59","descuento_pct":"0","tipo_iva":"21"}]',   1, '2026-10-01', false, false),
  ('gasto', 'mensual', 'Google Ads',         'Google Ireland Ltd',         'IE', 'publicidad', '[{"descripcion":"Google Ads {mes} {año}","cantidad":"1","precio_unitario":"82.64","descuento_pct":"0","tipo_iva":"21"}]', 1, '2026-10-01', false, false);
COMMIT;
