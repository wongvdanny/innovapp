// Fechas de facturación en hora peninsular (Europe/Madrid).
// Las columnas `date` llegan de Prisma como Date a medianoche UTC: se leen con getUTC*.

const TZ = 'Europe/Madrid'

function partesMadrid(d: Date) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const g = (t: string) => p.find(x => x.type === t)!.value
  return { y: g('year'), m: g('month'), d: g('day'), hh: g('hour'), mm: g('minute'), ss: g('second') }
}

/** 'YYYY-MM-DD' del día actual en Madrid. */
export function hoyMadrid(ahora: Date = new Date()): string {
  const { y, m, d } = partesMadrid(ahora)
  return `${y}-${m}-${d}`
}

/**
 * FechaHoraHusoGenRegistro: ISO 8601 con huso, sin milisegundos.
 * Ej.: '2026-10-01T10:15:00+02:00' (verano) / '2026-12-01T10:15:00+01:00' (invierno).
 */
export function fechaHoraHuso(ahora: Date = new Date()): string {
  const { y, m, d, hh, mm, ss } = partesMadrid(ahora)
  const localComoUtc = Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss)
  const offsetMin = Math.round((localComoUtc - Math.floor(ahora.getTime() / 1000) * 1000) / 60000)
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const off = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${off}`
}

/** Date (columna `date`) o 'YYYY-MM-DD' → 'YYYY-MM-DD'. */
export function isoFecha(v: Date | string): string {
  if (typeof v === 'string') return v.slice(0, 10)
  return v.toISOString().slice(0, 10)
}

/** → 'dd-mm-aaaa' (formato VeriFactu y QR). */
export function ddmmaaaa(v: Date | string): string {
  const [y, m, d] = isoFecha(v).split('-')
  return `${d}-${m}-${y}`
}

/** 'YYYY-MM-DD' → Date a medianoche UTC, para escribir en columnas `date` con Prisma. */
export function fechaDb(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
}

export function sumarDias(iso: string, dias: number): string {
  const d = fechaDb(iso)
  d.setUTCDate(d.getUTCDate() + dias)
  return isoFecha(d)
}
