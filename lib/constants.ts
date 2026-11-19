/**
 * Constantes de contacto/marca compartidas por todo el sitio. Ningún teléfono ni número de
 * WhatsApp se escribe fuera de este archivo: se importan de aquí (o se usan waLink/telLink).
 */
export const CONTACT_EMAIL = 'contacto@innovapp.es'

/** WhatsApp comercial de Innovapp, atendido por nuestro agente comercial de IA. Formato wa.me. */
export const COMMERCIAL_WHATSAPP = '34684902196'

/** WhatsApp de la demo de inmobiliarias (agente de una inmobiliaria de ejemplo). Formato wa.me. */
export const DEMO_INMOBILIARIA_WHATSAPP = '34617940994'

/** Teléfono comercial (el mismo móvil que el WhatsApp comercial), tal como se muestra. */
export const COMMERCIAL_PHONE = '684 90 21 96'
/** El mismo, en formato E.164: enlaces tel: y JSON-LD. */
export const COMMERCIAL_PHONE_TEL = '+34684902196'

/**
 * Número de la demo de voz (fijo de Netelip). Hoy lo atiende «Sofía», el agente de voz de
 * Innovapp en agentes; pasará a ser la demo de voz de la inmobiliaria. Solo para las demos
 * de voz (/agentes-voz y VozDemo), nunca como contacto comercial.
 */
export const VOICE_DEMO_PHONE = '+34 984 276 259'

/** "34684902196" -> "+34 684 902 196" */
export function formatearWhatsApp(numero: string = COMMERCIAL_WHATSAPP): string {
  return `+${numero.slice(0, 2)} ${numero.slice(2, 5)} ${numero.slice(5, 8)} ${numero.slice(8)}`
}

/** Enlace wa.me (por defecto al WhatsApp comercial), con el mensaje prerrellenado si se pasa (texto sin codificar). */
export function waLink(text?: string, numero: string = COMMERCIAL_WHATSAPP): string {
  return `https://wa.me/${numero}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Enlace tel: al teléfono comercial. */
export function telLink(): string {
  return `tel:${COMMERCIAL_PHONE_TEL}`
}

/** Enlace tel: a la demo de voz. */
export function voiceDemoTelLink(): string {
  return `tel:${VOICE_DEMO_PHONE.replace(/\s/g, '')}`
}

/**
 * Identidad del titular para las páginas legales (Aviso Legal, Privacidad, Cookies,
 * Términos de Uso). Innovapp opera como nombre comercial de una persona física, no como
 * sociedad -- por eso NIF (no CIF) y sin Registro Mercantil. Cambiar aquí se propaga a
 * todas las páginas legales; no hardcodear estos datos en ningún otro sitio.
 */
export const LEGAL_OWNER = 'Danny Gary Wong Vera'
export const LEGAL_TRADE_NAME = 'Innovapp'
export const LEGAL_NIF = '61348042G'
export const LEGAL_ADDRESS_ES = 'Avenida Príncipe de Asturias 141, 33660 Oviedo (Asturias)'
export const LEGAL_ADDRESS = `${LEGAL_ADDRESS_ES}, España`
export const LEGAL_ACTIVITY = 'programación informática (epígrafe 763 del IAE, programadores y analistas de informática)'

export const CONTACT_PHONE = COMMERCIAL_PHONE
export const CONTACT_PHONE_TEL = COMMERCIAL_PHONE_TEL
