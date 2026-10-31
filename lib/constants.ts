/**
 * Constantes de contacto/marca compartidas por todo el sitio. Ningún teléfono ni número de
 * WhatsApp se escribe fuera de este archivo: se importan de aquí (o se usan waLink/telLink).
 */
export const CONTACT_EMAIL = 'contacto@innovapp.es'

/** WhatsApp comercial de Innovapp, atendido por nuestro agente comercial de IA. Formato wa.me. */
export const COMMERCIAL_WHATSAPP = '34684902196'

/** Teléfono fijo comercial, atendido por nuestro agente de voz IA. */
export const COMMERCIAL_PHONE = '+34 984 276 259'

/** "34684902196" -> "+34 684 902 196" */
export function formatearWhatsApp(numero: string = COMMERCIAL_WHATSAPP): string {
  return `+${numero.slice(0, 2)} ${numero.slice(2, 5)} ${numero.slice(5, 8)} ${numero.slice(8)}`
}

/** Enlace wa.me al WhatsApp comercial, con el mensaje prerrellenado si se pasa (texto sin codificar). */
export function waLink(text?: string): string {
  return `https://wa.me/${COMMERCIAL_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Enlace tel: al teléfono comercial. */
export function telLink(): string {
  return `tel:${COMMERCIAL_PHONE.replace(/\s/g, '')}`
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
