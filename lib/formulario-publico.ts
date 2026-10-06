import type { NextApiRequest } from 'next'

// Protecciones compartidas por los formularios públicos (/api/contacto, /api/baja).

// --- Rate limiting básico en memoria: 5 envíos por IP cada 10 min ---
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

export function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // limpieza oportunista para que el Map no crezca sin límite
  if (hits.size > 500) {
    hits.forEach((v, k) => {
      if (v.every(t => now - t >= WINDOW_MS)) hits.delete(k)
    })
  }
  return false
}

export function clientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  if (Array.isArray(fwd) && fwd.length) return fwd[0]
  return req.socket.remoteAddress || 'unknown'
}

// Si RECAPTCHA_SECRET_KEY no está configurada todavía, no se exige el captcha -- así el
// formulario sigue funcionando (con honeypot + rate limit) mientras se da de alta la
// clave, en vez de romperse en despliegues donde aún no se ha añadido. Devuelve false
// (rechaza) si la propia llamada a Google falla, para no fallar "abierto" por un problema
// de red cuando el captcha sí está configurado y en teoría es obligatorio.
export async function recaptchaValido(token: string, ip: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const params = new URLSearchParams({ secret, response: token, remoteip: ip })
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error('[formulario-publico] error al verificar reCAPTCHA:', err)
    return false
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
