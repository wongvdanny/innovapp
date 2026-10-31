// Formulario de /agentes-ia-restaurantes: datos compartidos por la página y por
// pages/api/lead-restaurante.ts. Sin imports de servidor (se usa en el render).

/** Mensaje prerrellenado de la demo (WhatsApp comercial): en la página y en la respuesta automática. */
export const MENSAJE_DEMO_RESTAURANTE = 'Hola, quiero ver una demo del agente para restaurantes'

/** Texto exacto de la casilla. Se guarda tal cual con cada envío como prueba del consentimiento. */
export const CONSENTIMIENTO_RESTAURANTE =
  'Acepto que Innovapp me contacte sobre este servicio por teléfono, WhatsApp o email.'

export type LeadRestaurante = {
  nombre: string
  restaurante: string
  telefono: string
  email: string
  localidad: string
  mensaje: string
}

export const LIMITES_LEAD: Record<keyof LeadRestaurante, number> = {
  nombre: 120,
  restaurante: 160,
  telefono: 30,
  email: 200,
  localidad: 120,
  mensaje: 3000,
}

/** Ocho cifras como mínimo (con o sin prefijo, espacios, guiones o paréntesis). */
export const TELEFONO_RE = /^\+?[\d\s().-]{8,30}$/
