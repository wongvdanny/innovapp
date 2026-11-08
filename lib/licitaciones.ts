import { XMLParser } from 'fast-xml-parser'

// Buscador de licitaciones (PLACSP), portado de public/licitaciones.php.
// El servidor solo descarga y resume cada página del feed ATOM; el filtrado se hace en el
// navegador para poder ir página a página sin chocar con los timeouts del proxy.

export const FEED = 'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'

// Prefijos CPV: casan con cualquier código que empiece por ellos (72212 → 72212000, 72212100…).
const SERVICIOS: Record<string, [string, string[]]> = {
  software: ['Desarrollo de software y apps', ['7221', '7223', '7224', '72262']],
  web: ['Web, tiendas online e Internet', ['724']],
  ia_datos: ['IA, datos y atención telefónica', ['7231', '7232', '7951']],
  mantenimiento: ['Mantenimiento y soporte de software', ['7225', '7226', '7261']],
  consultoria: ['Consultoría TIC y transformación digital', ['72100', '72200', '7222']],
  gestion: ['Software de gestión (TPV, ERP, reservas…)', ['481', '482', '484', '485', '486']],
  marketing: ['Marketing digital y publicidad', ['7934', '79413', '79416', '79822']],
  formacion: ['Formación TIC y e-learning', ['80533', '80420']],
}

export const RUBROS: Record<string, [string, string[]]> = {
  innovapp: ['Todo lo de innovapp (rubros de abajo)', Array.from(new Set(Object.values(SERVICIOS).flatMap(([, p]) => p)))],
  ...SERVICIOS,
  informatica: ['Informática (amplio)', ['72', '48', '302', '324', '50312', '50320', '51611', '80533']],
  telecom: ['Telecomunicaciones', ['322', '642', '3252']],
  ninguno: ['— Solo CPV personalizados —', []],
}

export const ESTADOS: Record<string, string> = {
  PRE: 'Anuncio previo', PUB: 'En plazo', EV: 'Pendiente adjudicación',
  ADJ: 'Adjudicada', RES: 'Resuelta', ANUL: 'Anulada',
}

/** Documento enlazado en el feed. Se abre desde el navegador: PLACSP rechaza las descargas desde el servidor. */
export type Documento = { tipo: 'PCAP' | 'PPT' | 'Otro'; nombre: string; url: string }

export type Licitacion = {
  id: string; upd: string; titulo: string; objeto: string; organo: string; prov: string
  importe: number; estado: string; plazo: string; hora: string; cpvs: string[]; link: string; docs: Documento[]
}

export type Filtros = {
  prefijos: string[]; palabras: string[]; prov: string; abiertas: boolean; minImp: number; hoy: string
}

/** Solo se descargan páginas del feed de PLACSP (la URL de la siguiente página llega del cliente). */
export function urlPermitida(u: string): boolean {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' && url.hostname === 'contrataciondelestado.es' && url.pathname.startsWith('/sindicacion/sindicacion_643/')
  } catch {
    return false
  }
}

export function norm(s: string): string {
  const mapa: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'à': 'a', 'è': 'e', 'ò': 'o', 'ç': 'c', '·': '' }
  return s.toLowerCase().replace(/[áéíóúüàèòç·]/g, c => mapa[c])
}

const parser = new XMLParser({
  removeNSPrefix: true, ignoreAttributes: false, attributeNamePrefix: '@', parseTagValue: false, trimValues: true,
})

type Nodo = any
const hijos = (n: Nodo, nombre: string): Nodo[] => {
  if (!n || typeof n !== 'object') return []
  const v = n[nombre]
  return v === undefined ? [] : Array.isArray(v) ? v : [v]
}
const texto = (n: Nodo): string => (n === undefined || n === null ? '' : typeof n === 'object' ? String(n['#text'] ?? '') : String(n)).trim()

/** Todos los nodos que casan con la ruta de hijos `ruta`, empezando en cualquier descendiente de `n` (como `.//a/b` en XPath). */
function desc(n: Nodo, ruta: string[], out: Nodo[] = []): Nodo[] {
  if (!n || typeof n !== 'object') return out
  let nivel: Nodo[] = [n]
  for (const r of ruta) nivel = nivel.flatMap(x => hijos(x, r))
  out.push(...nivel)
  for (const [k, v] of Object.entries(n)) {
    if (k.startsWith('@') || k === '#text') continue
    for (const h of Array.isArray(v) ? v : [v]) desc(h, ruta, out)
  }
  return out
}
const val = (n: Nodo, ...ruta: string[]) => texto(desc(n, ruta)[0])
const vals = (n: Nodo, ...ruta: string[]) => Array.from(new Set(desc(n, ruta).map(texto).filter(Boolean)))

const TIPOS_DOC: [string, Documento['tipo']][] = [['LegalDocumentReference', 'PCAP'], ['TechnicalDocumentReference', 'PPT'], ['AdditionalDocumentReference', 'Otro']]
function documentos(e: Nodo): Documento[] {
  const vistas = new Set<string>()
  return TIPOS_DOC.flatMap(([etiqueta, tipo]) => desc(e, [etiqueta]).map(d => ({ tipo, nombre: val(d, 'ID'), url: val(d, 'URI') })))
    .filter(d => d.url.startsWith('https://contrataciondelestado.es/') && !vistas.has(d.url) && !!vistas.add(d.url))
}

export function parsearPagina(xml: string): { entradas: Licitacion[]; siguiente: string | null } {
  const feed = parser.parse(xml)?.feed
  if (!feed) throw new Error('El feed no tiene el formato esperado')
  const entradas = hijos(feed, 'entry').map((e): Licitacion => ({
    id: texto(hijos(e, 'id')[0]),
    upd: texto(hijos(e, 'updated')[0]),
    titulo: texto(hijos(e, 'title')[0]),
    objeto: val(e, 'ProcurementProject', 'Name'),
    organo: val(e, 'LocatedContractingParty', 'Party', 'PartyName', 'Name'),
    prov: val(e, 'ProcurementProject', 'RealizedLocation', 'CountrySubentity'),
    importe: parseFloat(val(e, 'ProcurementProject', 'BudgetAmount', 'TaxExclusiveAmount')) || 0,
    estado: val(e, 'ContractFolderStatusCode'),
    plazo: val(e, 'TenderSubmissionDeadlinePeriod', 'EndDate'),
    hora: val(e, 'TenderSubmissionDeadlinePeriod', 'EndTime'),
    cpvs: vals(e, 'RequiredCommodityClassification', 'ItemClassificationCode'),
    link: hijos(e, 'link')[0]?.['@href'] ?? '',
    docs: documentos(e),
  }))
  const siguiente = hijos(feed, 'link').find(l => l['@rel'] === 'next')?.['@href'] ?? null
  return { entradas, siguiente }
}

/** Mismo criterio que el PHP: CPV por prefijo, estado/plazo, palabras, provincia/órgano e importe. */
export function pasaFiltros(l: Licitacion, f: Filtros): boolean {
  if (f.prefijos.length && !l.cpvs.some(c => f.prefijos.some(p => c.startsWith(p)))) return false
  if (f.abiertas && (l.estado !== 'PUB' || (l.plazo !== '' && l.plazo.slice(0, 10) < f.hoy))) return false
  if (f.palabras.length) {
    const txt = norm(`${l.titulo} ${l.objeto} ${l.organo}`)
    if (!f.palabras.every(w => txt.includes(w))) return false
  }
  if (f.prov !== '' && !norm(`${l.prov} ${l.organo}`).includes(norm(f.prov))) return false
  if (f.minImp > 0 && l.importe < f.minImp) return false
  return true
}

/** Plazo para mostrar y ordenar: "2026-11-16 18:30" (como el PHP). */
export const plazoDe = (l: Licitacion) => `${l.plazo.slice(0, 10)} ${l.hora.slice(0, 5)}`.trim()

/** En plazo: primero las que cierran antes; si no, las actualizadas más recientemente. */
export function ordenar(res: Licitacion[], abiertas: boolean): Licitacion[] {
  const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
  return [...res].sort((a, b) => abiertas
    ? cmp(plazoDe(a) || '9999', plazoDe(b) || '9999')
    : cmp(b.upd.slice(0, 10), a.upd.slice(0, 10)))
}

export type Orden = { campo: 'defecto' | 'importe' | 'prov' | 'plazo' | 'organo'; asc: boolean }

/** Orden elegido en la tabla. Los vacíos (sin importe, sin lugar…) van siempre al final. */
export function ordenarPor(res: Licitacion[], o: Orden, abiertas: boolean): Licitacion[] {
  if (o.campo === 'defecto') return ordenar(res, abiertas)
  const clave = (l: Licitacion): string | number | null =>
    o.campo === 'importe' ? (l.importe || null) : o.campo === 'plazo' ? (plazoDe(l) || null) : (l[o.campo] || null)
  return [...res].sort((a, b) => {
    const x = clave(a), y = clave(b)
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
    const c = typeof x === 'number' ? x - (y as number) : x.localeCompare(y as string, 'es', { sensitivity: 'base' })
    return o.asc ? c : -c
  })
}
