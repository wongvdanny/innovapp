import { fmt2, DecimalLike } from '../decimal'
import { ddmmaaaa } from '../fechas'

// URL de cotejo del «QR tributario».
// Fuente: AEAT, «Características del QR y especificaciones del servicio de cotejo», v0.5.0,
// y Orden HAC/1177/2024 arts. 20-21: ISO/IEC 18004, nivel de corrección M, 30×30 a 40×40 mm,
// texto «QR tributario:» encima y, solo en sistemas VERI*FACTU, la leyenda debajo.

export type EntornoAEAT = 'produccion' | 'pruebas'

const BASE: Record<EntornoAEAT, string> = {
  produccion: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/',
  pruebas: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/',
}

export const TEXTO_SOBRE_QR = 'QR tributario:'
export const LEYENDA_VERIFACTU = 'Factura verificable en la sede electrónica de la AEAT'
export const QR_NIVEL_CORRECCION = 'M' as const
export const QR_TAMANO_MM = 35

export function entornoAEAT(): EntornoAEAT {
  return process.env.VERIFACTU_ENTORNO === 'pruebas' ? 'pruebas' : 'produccion'
}

export interface DatosQR {
  nif: string
  numSerie: string
  fechaExpedicion: Date | string
  importeTotal: DecimalLike
  verifactu: boolean
  entorno?: EntornoAEAT
}

/** Parámetros codificados en UTF-8 («URL encoding»), en el orden nif, numserie, fecha, importe. */
export function urlCotejo(d: DatosQR): string {
  const servicio = d.verifactu ? 'ValidarQR' : 'ValidarQRNoVerifactu'
  const q = [
    ['nif', d.nif.trim()],
    ['numserie', d.numSerie.trim()],
    ['fecha', ddmmaaaa(d.fechaExpedicion)],
    ['importe', fmt2(d.importeTotal)],
  ].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `${BASE[d.entorno ?? entornoAEAT()]}${servicio}?${q}`
}
