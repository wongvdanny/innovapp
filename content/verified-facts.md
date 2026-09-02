# content/verified-facts.md — Fuente única de verdad para el generador de blog

## Qué es el servicio
- Innovapp ofrece agentes de IA por WhatsApp como servicio gestionado
  (agente + mantenimiento mensual), NO como plataforma self-service.
- Cada agente se conecta a un número de WhatsApp Business dedicado
  (vía WhatsApp Business Cloud API), separado del número personal/de
  atención humana del negocio.

## Qué puede hacer el agente (negocios locales: peluquerías, clínicas
estéticas, gimnasios, talleres, veterinarias, inmobiliarias)
- Responde por WhatsApp 24/7 con información real del negocio
  (horarios, servicios, precios configurados).
- Agenda citas, con sistema anti-doble-reserva.
- Escala a atención humana cuando el caso lo requiere.
- NO ENVÍA recordatorios automáticos de citas todavía (24h/2h antes) —
  está en el roadmap, no implementado. NO mencionar esta función
  como existente.
- NO tiene integración con Google Calendar todavía — está planeada,
  no implementada.

## Qué puede hacer el agente (e-commerce: PrestaShop y WooCommerce)
- Consulta el catálogo real en tiempo real: stock, precio, variantes,
  estado de pedido.
- Ayuda a elegir producto y resuelve dudas en la conversación.
- Puede generar un enlace de checkout con auto-login para completar
  la compra.
- NO detecta ni recupera carritos abandonados de forma automática/
  proactiva todavía — solo ayuda si el cliente vuelve a escribir.
  NO mencionar recuperación automática de carritos como función
  existente.
- Compatible con Stripe y Redsys para pagos.

## Precios (a fecha de esta config; verificar si cambian)
- Negocios locales: 89€/149€/229€ al mes, según tier (setup 300€/450€/600€)
- E-commerce: 119€/199€/299€ al mes, según tier (setup 450€/700€/950€+)

## Landings/páginas de servicio (para enlazar desde el blog)
- /agentes-ia → genérica, negocios locales de cualquier sector
- /agentes-ia-prestashop → específica para tiendas PrestaShop
- /agentes-ia-woocommerce → específica para tiendas WooCommerce

## Instagram, integraciones futuras, etc.
- Instagram Messaging aún no está implementado (solo arquitectura
  planeada). NO mencionar como función existente.
