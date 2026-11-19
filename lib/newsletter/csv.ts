// Importación y exportación CSV de suscriptores (funciones puras).
import { EMAIL_RE, SECTORES, esSector, normalizarEmail } from './tipos'

/** Separa un CSV (detecta «;» o «,», respeta comillas y saltos de línea dentro de comillas). */
export function parsearCsv(texto: string): string[][] {
  const t = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto
  const primera = t.split(/\r?\n/, 1)[0] ?? ''
  const sep = (primera.match(/;/g)?.length ?? 0) >= (primera.match(/,/g)?.length ?? 0) ? ';' : ','
  const filas: string[][] = []
  let fila: string[] = [], campo = '', comillas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"') comillas = true
    else if (c === sep) { fila.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      fila.push(campo); filas.push(fila); fila = []; campo = ''
    } else campo += c
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila) }
  return filas.filter(f => f.some(x => x.trim() !== ''))
}

export interface FilaImportacion { email: string; nombre: string | null; empresa: string | null; sector: keyof typeof SECTORES; consentimiento: string; fecha: Date }
export interface ResultadoParseo { validas: FilaImportacion[]; rechazadas: { linea: number; motivo: string }[] }

const ALIAS: Record<string, string[]> = {
  email: ['email', 'correo', 'e-mail'],
  nombre: ['nombre', 'name'],
  empresa: ['empresa', 'company', 'negocio'],
  sector: ['sector'],
  consentimiento: ['consentimiento', 'consent', 'consentimiento_texto'],
  fecha: ['consentimiento_fecha', 'fecha_consentimiento', 'fecha'],
}

/**
 * Valida las filas. La columna «consentimiento» es obligatoria y cada fila sin texto de
 * consentimiento se rechaza. Sector desconocido → «otro». Fecha inválida o vacía → `ahora`.
 */
export function validarImportacion(texto: string, ahora: Date): ResultadoParseo | { error: string } {
  const filas = parsearCsv(texto)
  if (filas.length < 2) return { error: 'El CSV necesita una fila de cabecera y al menos un suscriptor' }
  const cab = filas[0].map(h => h.trim().toLowerCase())
  const col = (k: string) => cab.findIndex(h => ALIAS[k].includes(h))
  const idx = Object.fromEntries(Object.keys(ALIAS).map(k => [k, col(k)])) as Record<string, number>
  if (idx.email < 0) return { error: 'Falta la columna «email»' }
  if (idx.consentimiento < 0) return { error: 'Falta la columna «consentimiento» (obligatoria: cómo y cuándo dio su permiso cada persona)' }

  const r: ResultadoParseo = { validas: [], rechazadas: [] }
  const vistos = new Set<string>()
  filas.slice(1).forEach((f, i) => {
    const linea = i + 2
    const v = (k: string) => (idx[k] >= 0 ? (f[idx[k]] ?? '').trim() : '')
    const email = normalizarEmail(v('email'))
    if (!EMAIL_RE.test(email)) return r.rechazadas.push({ linea, motivo: `Email no válido: «${v('email')}»` })
    if (vistos.has(email)) return r.rechazadas.push({ linea, motivo: `Email repetido en el archivo: ${email}` })
    const consentimiento = v('consentimiento')
    if (!consentimiento) return r.rechazadas.push({ linea, motivo: `Sin consentimiento: ${email}` })
    const f0 = v('fecha'), m = f0.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    const fecha = m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], 12)) : f0 && !isNaN(Date.parse(f0)) ? new Date(f0) : ahora
    vistos.add(email)
    r.validas.push({ email, nombre: v('nombre') || null, empresa: v('empresa') || null, sector: esSector(v('sector').toLowerCase()) ? (v('sector').toLowerCase() as any) : 'otro', consentimiento, fecha: fecha > ahora ? ahora : fecha })
  })
  return r
}

/** CSV con «;» y BOM (se abre bien en Excel). */
export function csv(cabecera: string[], filas: (string | null | undefined)[][]) {
  const esc = (x: string | null | undefined) => {
    const t = x ?? ''
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return String.fromCharCode(0xfeff) + [cabecera, ...filas].map(f => f.map(esc).join(';')).join('\r\n') + '\r\n'
}
