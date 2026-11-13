// Validación de la inscripción de /webgratis: la usan el formulario (cliente) y la API (servidor).
// Sin imports de servidor.
import { CANALES_CONTACTO, PROVINCIAS, SECTORES_PROMO } from './config'

export type InscripcionPromo = {
  name: string
  businessName: string
  sector: string
  city: string
  province: string
  email: string
  phone: string
  instagram: string
  currentWeb: string
  contactChannel: string
  description: string
  acceptedTerms: boolean
  marketingConsent: boolean
}

export const DESCRIPCION_MIN = 50
export const DESCRIPCION_MAX = 500
/** Tiempo mínimo entre la carga del formulario y el envío (antispam). */
export const TIEMPO_MINIMO_MS = 3000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_RE = /^\+?[\d\s().-]{9,20}$/
// Usuarios de Instagram: letras, números, puntos y guiones bajos, hasta 30 caracteres
const INSTAGRAM_RE = /^[a-z0-9._]{1,30}$/

/** «@MiNegocio» → «minegocio». */
export const normalizarInstagram = (v: string) => v.trim().replace(/^@+/, '').toLowerCase()

/** Devuelve los datos limpios o el primer error, con un mensaje para mostrar. */
export function validarInscripcion(datos: Record<string, unknown>): { ok: true; valor: InscripcionPromo } | { ok: false; error: string } {
  const txt = (k: string, max: number) => String(datos[k] ?? '').trim().slice(0, max + 1)
  const v: InscripcionPromo = {
    name: txt('name', 120),
    businessName: txt('businessName', 160),
    sector: txt('sector', 60),
    city: txt('city', 120),
    province: txt('province', 60),
    email: txt('email', 200).toLowerCase(),
    phone: txt('phone', 30),
    instagram: normalizarInstagram(txt('instagram', 40)),
    currentWeb: txt('currentWeb', 300),
    contactChannel: txt('contactChannel', 40),
    description: txt('description', DESCRIPCION_MAX),
    acceptedTerms: datos.acceptedTerms === true,
    marketingConsent: datos.marketingConsent === true,
  }
  if (!v.name) return { ok: false, error: 'Escribe tu nombre y apellidos.' }
  if (!v.businessName) return { ok: false, error: 'Escribe el nombre de tu negocio.' }
  if (!SECTORES_PROMO.includes(v.sector)) return { ok: false, error: 'Elige el sector de tu negocio.' }
  if (!v.city) return { ok: false, error: 'Escribe tu localidad.' }
  if (!PROVINCIAS.includes(v.province)) return { ok: false, error: 'Elige tu provincia.' }
  if (!EMAIL_RE.test(v.email)) return { ok: false, error: 'Revisa el email.' }
  if (!TELEFONO_RE.test(v.phone)) return { ok: false, error: 'Revisa el teléfono.' }
  if (!INSTAGRAM_RE.test(v.instagram)) return { ok: false, error: 'Revisa tu usuario de Instagram (por ejemplo, @tunegocio).' }
  if (!CANALES_CONTACTO.includes(v.contactChannel)) return { ok: false, error: 'Dinos cómo te contactan hoy tus clientes.' }
  if (v.description.length < DESCRIPCION_MIN || v.description.length > DESCRIPCION_MAX) {
    return { ok: false, error: `Cuéntanos tu negocio en ${DESCRIPCION_MIN}-${DESCRIPCION_MAX} caracteres.` }
  }
  if (!v.acceptedTerms) return { ok: false, error: 'Para participar tienes que aceptar las bases y la política de privacidad.' }
  if (v.name.length > 120 || v.businessName.length > 160 || v.city.length > 120 || v.currentWeb.length > 300) {
    return { ok: false, error: 'Algún campo es demasiado largo.' }
  }
  return { ok: true, valor: v }
}
