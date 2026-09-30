import type { Prisma, PrismaClient } from '@prisma/client'
import { fmt2, DecimalLike } from '../decimal'
import { ddmmaaaa } from '../fechas'
import { cadenaAlta, cadenaAnulacion, sha256Hex } from './huella'

// Verificación de la cadena de registros VERI*FACTU: recalcula cada huella a partir
// de los campos guardados y comprueba el encadenamiento y la coherencia con las facturas.

export interface RegistroCadena {
  id: bigint | number
  tipo_registro: string
  factura_id: string
  id_emisor_factura: string
  num_serie_factura: string
  fecha_expedicion_factura: string
  tipo_factura: string | null
  cuota_total: DecimalLike
  importe_total: DecimalLike
  primer_registro: boolean
  huella_anterior: string | null
  huella: string
  fecha_hora_huso_gen_registro: string
  cadena_huella: string
}

export interface ErrorIntegridad {
  registroId?: string
  facturaId?: string
  tipo: 'huella' | 'cadena_texto' | 'encadenamiento' | 'primer_registro' | 'factura_discrepante' | 'factura_sin_registro'
  detalle: string
}

export function recalcularCadena(r: RegistroCadena): string {
  return r.tipo_registro === 'alta'
    ? cadenaAlta({
        idEmisorFactura: r.id_emisor_factura,
        numSerieFactura: r.num_serie_factura,
        fechaExpedicionFactura: r.fecha_expedicion_factura,
        tipoFactura: r.tipo_factura ?? '',
        cuotaTotal: r.cuota_total,
        importeTotal: r.importe_total,
        huellaAnterior: r.huella_anterior,
        fechaHoraHusoGenRegistro: r.fecha_hora_huso_gen_registro,
      })
    : cadenaAnulacion({
        idEmisorFacturaAnulada: r.id_emisor_factura,
        numSerieFacturaAnulada: r.num_serie_factura,
        fechaExpedicionFacturaAnulada: r.fecha_expedicion_factura,
        huellaAnterior: r.huella_anterior,
        fechaHoraHusoGenRegistro: r.fecha_hora_huso_gen_registro,
      })
}

/** Verificación pura (sin BD) de una lista de registros ordenada por id. */
export function verificarRegistros(registros: RegistroCadena[]): ErrorIntegridad[] {
  const errores: ErrorIntegridad[] = []
  let anterior: string | null = null
  registros.forEach((r, i) => {
    const id = String(r.id)
    const cadena = recalcularCadena(r)
    if (cadena !== r.cadena_huella)
      errores.push({ registroId: id, tipo: 'cadena_texto', detalle: 'Los campos del registro no coinciden con el texto hasheado guardado' })
    if (sha256Hex(cadena) !== r.huella)
      errores.push({ registroId: id, tipo: 'huella', detalle: `Huella recalculada distinta de la guardada (${r.num_serie_factura})` })
    if (i === 0 && !r.primer_registro)
      errores.push({ registroId: id, tipo: 'primer_registro', detalle: 'El primer registro no está marcado como PrimerRegistro' })
    if (i > 0 && r.primer_registro)
      errores.push({ registroId: id, tipo: 'primer_registro', detalle: 'Registro marcado como primero en mitad de la cadena' })
    if ((r.huella_anterior ?? null) !== anterior)
      errores.push({ registroId: id, tipo: 'encadenamiento', detalle: `huella_anterior no coincide con la huella del registro previo` })
    anterior = r.huella
  })
  return errores
}

export interface ResultadoIntegridad {
  ok: boolean
  registros: number
  facturasEmitidas: number
  ultimaHuella: string | null
  errores: ErrorIntegridad[]
  verificadoEn: string
}

/** Verificación completa contra la BD: cadena + coherencia registro ↔ factura. */
export async function verificarIntegridad(db: PrismaClient | Prisma.TransactionClient): Promise<ResultadoIntegridad> {
  const [registros, facturas] = await Promise.all([
    db.fac_registros_verifactu.findMany({ orderBy: { id: 'asc' } }),
    db.fac_facturas.findMany({
      where: { estado: { not: 'borrador' } },
      select: { id: true, estado: true, num_serie_factura: true, fecha_expedicion: true, tipo_factura: true, cuota_iva: true, importe_total: true },
    }),
  ])
  const errores = verificarRegistros(registros as RegistroCadena[])

  const altas = new Map(registros.filter(r => r.tipo_registro === 'alta').map(r => [r.factura_id, r]))
  const anulaciones = new Set(registros.filter(r => r.tipo_registro === 'anulacion').map(r => r.factura_id))
  for (const f of facturas) {
    const alta = altas.get(f.id)
    if (!alta) {
      errores.push({ facturaId: f.id, tipo: 'factura_sin_registro', detalle: `${f.num_serie_factura} emitida sin registro de alta` })
      continue
    }
    const discrepancias: string[] = []
    if (alta.num_serie_factura !== f.num_serie_factura) discrepancias.push('número')
    if (alta.fecha_expedicion_factura !== ddmmaaaa(f.fecha_expedicion!)) discrepancias.push('fecha')
    if (alta.tipo_factura !== f.tipo_factura) discrepancias.push('tipo')
    if (fmt2(alta.cuota_total) !== fmt2(f.cuota_iva)) discrepancias.push('cuota')
    if (fmt2(alta.importe_total) !== fmt2(f.importe_total)) discrepancias.push('importe')
    if (discrepancias.length)
      errores.push({ facturaId: f.id, registroId: String(alta.id), tipo: 'factura_discrepante', detalle: `${f.num_serie_factura}: ${discrepancias.join(', ')} no coinciden con su registro` })
    if (f.estado === 'anulada' && !anulaciones.has(f.id))
      errores.push({ facturaId: f.id, tipo: 'factura_sin_registro', detalle: `${f.num_serie_factura} anulada sin registro de anulación` })
  }

  return {
    ok: errores.length === 0,
    registros: registros.length,
    facturasEmitidas: facturas.length,
    ultimaHuella: registros.at(-1)?.huella ?? null,
    errores,
    verificadoEn: new Date().toISOString(),
  }
}
