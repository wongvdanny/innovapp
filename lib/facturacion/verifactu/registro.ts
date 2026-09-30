import type { Prisma } from '@prisma/client'
import { fechaHoraHuso, ddmmaaaa } from '../fechas'
import { fmt2, DecimalLike } from '../decimal'
import { cadenaAlta, cadenaAnulacion, sha256Hex } from './huella'

type Tx = Prisma.TransactionClient

// Clave del advisory lock que serializa la cadena de registros (un único SIF).
const LOCK_CADENA = 7630001

/**
 * Bloquea la cadena hasta el fin de la transacción: dos emisiones simultáneas
 * no pueden encadenar sobre la misma huella anterior.
 */
async function bloquearCadena(tx: Tx) {
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${LOCK_CADENA})`)
}

async function huellaAnterior(tx: Tx): Promise<string | null> {
  const ultimo = await tx.fac_registros_verifactu.findFirst({ orderBy: { id: 'desc' }, select: { huella: true } })
  return ultimo?.huella ?? null
}

export interface FacturaParaRegistro {
  id: string
  num_serie_factura: string
  fecha_expedicion: Date | string
  tipo_factura: string
  cuota_iva: DecimalLike
  importe_total: DecimalLike
}

/** Inserta el registro de alta encadenado. Debe llamarse dentro de la transacción de emisión. */
export async function crearRegistroAlta(tx: Tx, f: FacturaParaRegistro, nifEmisor: string, ahora = new Date()) {
  await bloquearCadena(tx)
  const anterior = await huellaAnterior(tx)
  const datos = {
    idEmisorFactura: nifEmisor,
    numSerieFactura: f.num_serie_factura,
    fechaExpedicionFactura: ddmmaaaa(f.fecha_expedicion),
    tipoFactura: f.tipo_factura,
    cuotaTotal: fmt2(f.cuota_iva),
    importeTotal: fmt2(f.importe_total),
    huellaAnterior: anterior,
    fechaHoraHusoGenRegistro: fechaHoraHuso(ahora),
  }
  const cadena = cadenaAlta(datos)
  return tx.fac_registros_verifactu.create({
    data: {
      tipo_registro: 'alta',
      factura_id: f.id,
      id_emisor_factura: datos.idEmisorFactura,
      num_serie_factura: datos.numSerieFactura,
      fecha_expedicion_factura: datos.fechaExpedicionFactura,
      tipo_factura: datos.tipoFactura,
      cuota_total: datos.cuotaTotal,
      importe_total: datos.importeTotal,
      primer_registro: anterior === null,
      huella_anterior: anterior,
      huella: sha256Hex(cadena),
      fecha_hora_huso_gen_registro: datos.fechaHoraHusoGenRegistro,
      cadena_huella: cadena,
    },
  })
}

/** Inserta el registro de anulación encadenado, en la misma transacción que el cambio de estado. */
export async function crearRegistroAnulacion(
  tx: Tx,
  f: Pick<FacturaParaRegistro, 'id' | 'num_serie_factura' | 'fecha_expedicion'>,
  nifEmisor: string,
  ahora = new Date(),
) {
  await bloquearCadena(tx)
  const anterior = await huellaAnterior(tx)
  const datos = {
    idEmisorFacturaAnulada: nifEmisor,
    numSerieFacturaAnulada: f.num_serie_factura,
    fechaExpedicionFacturaAnulada: ddmmaaaa(f.fecha_expedicion),
    huellaAnterior: anterior,
    fechaHoraHusoGenRegistro: fechaHoraHuso(ahora),
  }
  const cadena = cadenaAnulacion(datos)
  return tx.fac_registros_verifactu.create({
    data: {
      tipo_registro: 'anulacion',
      factura_id: f.id,
      id_emisor_factura: datos.idEmisorFacturaAnulada,
      num_serie_factura: datos.numSerieFacturaAnulada,
      fecha_expedicion_factura: datos.fechaExpedicionFacturaAnulada,
      primer_registro: anterior === null,
      huella_anterior: anterior,
      huella: sha256Hex(cadena),
      fecha_hora_huso_gen_registro: datos.fechaHoraHusoGenRegistro,
      cadena_huella: cadena,
    },
  })
}
