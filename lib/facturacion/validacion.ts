// Validación de identificadores fiscales españoles y NIF-IVA comunitario.

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE'
const LETRAS_CIF_CONTROL = 'JABCDEFGHI'

export type TipoIdentificador = 'DNI' | 'NIE' | 'CIF' | 'NIF_ESPECIAL' | 'NIF_IVA'

export interface ResultadoNif {
  valido: boolean
  normalizado: string
  tipo?: TipoIdentificador
  error?: string
}

/** Mayúsculas, sin espacios, guiones ni puntos. Quita el prefijo 'ES' de un NIF español. */
export function normalizarNif(v: string): string {
  const s = (v || '').toUpperCase().replace(/[\s.\-_/]/g, '')
  return /^ES[0-9A-Z]\d{7}[0-9A-Z]$/.test(s) ? s.slice(2) : s
}

function validarDni(s: string): boolean {
  return LETRAS_DNI[parseInt(s.slice(0, 8), 10) % 23] === s[8]
}

function validarNie(s: string): boolean {
  const num = { X: '0', Y: '1', Z: '2' }[s[0] as 'X' | 'Y' | 'Z'] + s.slice(1, 8)
  return LETRAS_DNI[parseInt(num, 10) % 23] === s[8]
}

function digitoControlCif(cuerpo: string): number {
  let pares = 0, impares = 0
  for (let i = 0; i < 7; i++) {
    const n = parseInt(cuerpo[i], 10)
    if (i % 2 === 1) pares += n
    else { const d = n * 2; impares += Math.floor(d / 10) + (d % 10) }
  }
  return (10 - ((pares + impares) % 10)) % 10
}

function validarCif(s: string): boolean {
  const control = s[8]
  const d = digitoControlCif(s.slice(1, 8))
  const letra = LETRAS_CIF_CONTROL[d]
  // Control numérico: A B E H · control letra: P Q R S N W · resto: cualquiera de los dos
  if ('ABEH'.includes(s[0])) return control === String(d)
  if ('PQRSNW'.includes(s[0])) return control === letra
  return control === String(d) || control === letra
}

/** Valida DNI, NIE, CIF y NIF especiales (K, L, M). */
export function validarNifEspanol(valor: string): ResultadoNif {
  const s = normalizarNif(valor)
  if (!s) return { valido: false, normalizado: s, error: 'NIF vacío' }
  if (/^\d{8}[A-Z]$/.test(s))
    return validarDni(s) ? { valido: true, normalizado: s, tipo: 'DNI' } : { valido: false, normalizado: s, error: 'Letra del DNI incorrecta' }
  if (/^[XYZ]\d{7}[A-Z]$/.test(s))
    return validarNie(s) ? { valido: true, normalizado: s, tipo: 'NIE' } : { valido: false, normalizado: s, error: 'Letra del NIE incorrecta' }
  if (/^[KLM]\d{7}[A-Z]$/.test(s))
    return LETRAS_DNI[parseInt(s.slice(1, 8), 10) % 23] === s[8]
      ? { valido: true, normalizado: s, tipo: 'NIF_ESPECIAL' }
      : { valido: false, normalizado: s, error: 'Letra del NIF incorrecta' }
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(s))
    return validarCif(s) ? { valido: true, normalizado: s, tipo: 'CIF' } : { valido: false, normalizado: s, error: 'Dígito de control del CIF incorrecto' }
  return { valido: false, normalizado: s, error: 'Formato de NIF/NIE/CIF no reconocido' }
}

// Formato (no dígito de control) de NIF-IVA de los Estados miembros.
const NIF_IVA_UE: Record<string, RegExp> = {
  AT: /^U\d{8}$/, BE: /^[01]\d{9}$/, BG: /^\d{9,10}$/, CY: /^\d{8}[A-Z]$/, CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/, DK: /^\d{8}$/, EE: /^\d{9}$/, EL: /^\d{9}$/, ES: /^[0-9A-Z]\d{7}[0-9A-Z]$/,
  FI: /^\d{8}$/, FR: /^[0-9A-Z]{2}\d{9}$/, HR: /^\d{11}$/, HU: /^\d{8}$/, IE: /^\d{7}[A-Z]{1,2}$|^\d[A-Z+*]\d{5}[A-Z]$/,
  IT: /^\d{11}$/, LT: /^\d{9}$|^\d{12}$/, LU: /^\d{8}$/, LV: /^\d{11}$/, MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/, PL: /^\d{10}$/, PT: /^\d{9}$/, RO: /^\d{2,10}$/, SE: /^\d{12}$/,
  SI: /^\d{8}$/, SK: /^\d{10}$/, XI: /^\d{9}$|^\d{12}$|^GD\d{3}$|^HA\d{3}$/,
}

/** Valida el formato de un NIF-IVA comunitario (prefijo de país + número). */
export function validarNifIva(valor: string): ResultadoNif {
  const s = (valor || '').toUpperCase().replace(/[\s.\-_]/g, '')
  const pais = s.slice(0, 2)
  const re = NIF_IVA_UE[pais]
  if (!re) return { valido: false, normalizado: s, error: `Prefijo de país '${pais}' no comunitario` }
  if (pais === 'ES') {
    const r = validarNifEspanol(s.slice(2))
    return { ...r, normalizado: s, tipo: r.valido ? 'NIF_IVA' : undefined }
  }
  return re.test(s.slice(2))
    ? { valido: true, normalizado: s, tipo: 'NIF_IVA' }
    : { valido: false, normalizado: s, error: `Formato de NIF-IVA ${pais} incorrecto` }
}

/** Nombres de país del checkout → ISO 3166-1 alfa-2. */
const PAISES: Record<string, string> = {
  'españa': 'ES', 'spain': 'ES', 'es': 'ES',
  'méxico': 'MX', 'mexico': 'MX', 'argentina': 'AR', 'colombia': 'CO', 'chile': 'CL',
  'perú': 'PE', 'peru': 'PE', 'uruguay': 'UY', 'portugal': 'PT', 'francia': 'FR', 'alemania': 'DE', 'italia': 'IT',
}

export function paisIso(v?: string | null): string | null {
  if (!v) return null
  const s = v.trim()
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase()
  return PAISES[s.toLowerCase()] ?? null
}

/** Retención por defecto según tipo de cliente: empresas y autónomos residentes en España. */
export function aplicaRetencionPorDefecto(tipo: string, pais: string): boolean {
  return (tipo === 'empresa' || tipo === 'autonomo') && pais === 'ES'
}
