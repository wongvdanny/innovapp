// Promoción «4 webs gratis + IA» (/webgratis). Fechas y cifras que aparecen en la página, los
// emails, las bases y la API: se cambian solo aquí.

export const PROMO_SLUG = 'webgratis-2026'
export const PROMO_END = '2026-12-15T12:00:00+01:00'
export const FECHA_ANUNCIO = '2026-12-15'
export const PRECIO_IA_DESDE = 55
export const INSTAGRAM_HANDLE = 'innovapp.es'
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`
export const MAX_WEBS = 4
export const CUOTA_MANTENIMIENTO = 19
export const PERMANENCIA_MESES = 12
/** El contador «Inscripciones recibidas» solo se muestra a partir de este número. */
export const MIN_INSCRIPCIONES_VISIBLES = 10
/** Remitente de los emails de la promo (dominio verificado en Resend); las respuestas van a contacto@innovapp.es. */
export const REMITENTE_PROMO = 'Innovapp <notificaciones@mail.innovapp.es>'

/** Número de suplentes, ordenados del 1 al MAX_SUPLENTES. */
export const MAX_SUPLENTES = 4
/** Días naturales para aceptar la selección (desde el aviso) y para aportar dominio e información (desde la aceptación). */
export const DIAS_ACEPTAR = 3
export const DIAS_MATERIAL = 15
/** Tras PROMO_END, ponerlo a true para mostrar en /webgratis la sección «Seleccionados». */
export const RESULTADOS_PUBLICADOS = false

export const promoCerrada = (ahora: Date = new Date()) => ahora.getTime() >= new Date(PROMO_END).getTime()

export const SECTORES_PROMO = [
  'Hostelería', 'Estética y belleza', 'Peluquería', 'Salud y bienestar', 'Gimnasio/deporte',
  'Comercio', 'Servicios profesionales', 'Construcción/reformas', 'Otro',
]

export const CANALES_CONTACTO = ['Teléfono', 'WhatsApp', 'Redes sociales', 'Web', 'En persona']

export const PROVINCIAS = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 'Bizkaia',
  'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Gipuzkoa',
  'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'La Rioja', 'Las Palmas', 'León',
  'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra',
  'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
  'Valladolid', 'Zamora', 'Zaragoza',
]

/** Textos exactos de las casillas: se guardan con cada inscripción (consentText). */
export const TEXTO_ACEPTO_BASES = 'He leído y acepto las bases de la promoción y la política de privacidad, y autorizo la publicación del nombre de mi negocio y mi cuenta de Instagram si resulto ganador o suplente.'
export const TEXTO_MARKETING = 'Quiero recibir por email novedades y ofertas de Innovapp sobre webs, aplicaciones y automatización con IA para negocios. Puedo darme de baja en cualquier momento.'
