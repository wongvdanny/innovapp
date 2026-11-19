// Constantes de la newsletter (sin prisma: se usan también en el navegador).

export const SECTORES = { inmobiliaria: 'Inmobiliaria', restaurante: 'Restaurante', ecommerce: 'E-commerce', otro: 'Otro' } as const
export type Sector = keyof typeof SECTORES

export const ESTADOS = { pendiente: 'Pendiente', confirmado: 'Confirmado', baja: 'Baja', rebotado: 'Rebotado' } as const
export type EstadoSuscriptor = keyof typeof ESTADOS

export const ORIGENES = { formulario_web: 'Formulario web', alta_manual: 'Alta manual', importacion: 'Importación' } as const
export type Origen = keyof typeof ORIGENES

/** Cómo se obtuvo el consentimiento en un alta manual (obligatorio). */
export const MEDIOS = { llamada: 'Llamada', visita: 'Visita', reunion: 'Reunión', respuesta_correo: 'Respuesta a correo', otro: 'Otro' } as const
export type Medio = keyof typeof MEDIOS

export const ESTADOS_CAMPANA = { borrador: 'Borrador', programada: 'Programada', enviando: 'Enviando', enviada: 'Enviada', cancelada: 'Cancelada' } as const

/** Texto exacto de la casilla del formulario público: es lo que se guarda como prueba del consentimiento. */
export const TEXTO_CONSENTIMIENTO_WEB =
  'Quiero recibir por email novedades de Innovapp sobre webs, aplicaciones y automatización con IA para negocios. He leído la política de privacidad y puedo darme de baja en cualquier momento.'

export const esSector = (v: unknown): v is Sector => typeof v === 'string' && v in SECTORES
export const esMedio = (v: unknown): v is Medio => typeof v === 'string' && v in MEDIOS
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const normalizarEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')
