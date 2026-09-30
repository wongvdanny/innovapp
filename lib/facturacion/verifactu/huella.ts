import { createHash } from 'crypto'
import { fmt2, DecimalLike } from '../decimal'

// Huella («hash») de los registros de facturación VERI*FACTU.
// Fuente: AEAT, «Detalle de las especificaciones técnicas para generación de la huella
// o hash de los registros de facturación», v0.1.2 (27/08/2024):
//  - Campos en orden fijo, formato nombre=valor unidos por '&'.
//  - Valores sin espacios al inicio/fin; campo ausente → 'Nombre=' sin valor.
//  - Cadena en UTF-8 → SHA-256 → hexadecimal en MAYÚSCULAS (64 caracteres).
// Los importes se formatean siempre con 2 decimales, igual que en el XML que se genere.

export interface DatosHuellaAlta {
  idEmisorFactura: string
  numSerieFactura: string
  fechaExpedicionFactura: string   // dd-mm-aaaa
  tipoFactura: string
  cuotaTotal: DecimalLike
  importeTotal: DecimalLike
  huellaAnterior: string | null    // null/'' en el primer registro
  fechaHoraHusoGenRegistro: string // ISO 8601 con huso
}

export interface DatosHuellaAnulacion {
  idEmisorFacturaAnulada: string
  numSerieFacturaAnulada: string
  fechaExpedicionFacturaAnulada: string
  huellaAnterior: string | null
  fechaHoraHusoGenRegistro: string
}

const v = (x: string | null | undefined) => (x ?? '').trim()

function unir(campos: [string, string][]): string {
  return campos.map(([k, val]) => `${k}=${val}`).join('&')
}

export function cadenaAlta(d: DatosHuellaAlta): string {
  return unir([
    ['IDEmisorFactura', v(d.idEmisorFactura)],
    ['NumSerieFactura', v(d.numSerieFactura)],
    ['FechaExpedicionFactura', v(d.fechaExpedicionFactura)],
    ['TipoFactura', v(d.tipoFactura)],
    ['CuotaTotal', fmt2(d.cuotaTotal)],
    ['ImporteTotal', fmt2(d.importeTotal)],
    ['Huella', v(d.huellaAnterior)],
    ['FechaHoraHusoGenRegistro', v(d.fechaHoraHusoGenRegistro)],
  ])
}

export function cadenaAnulacion(d: DatosHuellaAnulacion): string {
  return unir([
    ['IDEmisorFacturaAnulada', v(d.idEmisorFacturaAnulada)],
    ['NumSerieFacturaAnulada', v(d.numSerieFacturaAnulada)],
    ['FechaExpedicionFacturaAnulada', v(d.fechaExpedicionFacturaAnulada)],
    ['Huella', v(d.huellaAnterior)],
    ['FechaHoraHusoGenRegistro', v(d.fechaHoraHusoGenRegistro)],
  ])
}

export function sha256Hex(cadena: string): string {
  return createHash('sha256').update(cadena, 'utf8').digest('hex').toUpperCase()
}

export const huellaAlta = (d: DatosHuellaAlta) => sha256Hex(cadenaAlta(d))
export const huellaAnulacion = (d: DatosHuellaAnulacion) => sha256Hex(cadenaAnulacion(d))
