// Formulario de lead de las landings de Agentes IA (restaurantes y sectores): datos compartidos
// por components/sector/LeadForm.tsx y pages/api/lead.ts. Sin imports de servidor.

/** Texto exacto de la casilla. Se guarda tal cual con cada envío como prueba del consentimiento. */
export const CONSENTIMIENTO_LEAD =
  'Acepto que Innovapp me contacte sobre este servicio por teléfono, WhatsApp o email.'

export type Lead = {
  nombre: string
  /** Nombre del negocio (restaurante, peluquería, clínica, taller…). */
  negocio: string
  telefono: string
  email: string
  localidad: string
  mensaje: string
}

export const LIMITES_LEAD: Record<keyof Lead, number> = {
  nombre: 120,
  negocio: 160,
  telefono: 30,
  email: 200,
  localidad: 120,
  mensaje: 3000,
}

/** Ocho cifras como mínimo (con o sin prefijo, espacios, guiones o paréntesis). */
export const TELEFONO_RE = /^\+?[\d\s().-]{8,30}$/
