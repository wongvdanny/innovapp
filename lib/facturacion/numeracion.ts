import type { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

export type CodigoSerie = 'F' | 'S' | 'R'

/** Serie que corresponde a cada TipoFactura VeriFactu. */
export function serieDeTipo(tipoFactura: string): CodigoSerie {
  if (tipoFactura.startsWith('R')) return 'R'
  if (tipoFactura === 'F2') return 'S'
  return 'F'
}

export function formatearNumSerie(prefijo: string, numero: number): string {
  return `${prefijo}${String(numero).padStart(4, '0')}`
}

export interface NumeroAsignado {
  serie_id: string
  numero: number
  num_serie_factura: string
  ultima_fecha: Date | null   // última fecha de expedición emitida en la serie
}

/**
 * Asigna el siguiente número de la serie del año, sin huecos:
 * la fila de la serie se bloquea (FOR UPDATE) hasta el fin de la transacción de emisión,
 * y si la emisión falla el incremento se deshace con ella.
 * La serie del año se crea sola la primera vez (reinicio anual automático).
 */
export async function siguienteNumero(tx: Tx, codigo: CodigoSerie, anio: number): Promise<NumeroAsignado> {
  const prefijo = `${codigo}${anio}-`
  await tx.$executeRaw`
    INSERT INTO fac_series (codigo, anio, prefijo) VALUES (${codigo}, ${anio}, ${prefijo})
    ON CONFLICT (codigo, anio) DO NOTHING`
  const [serie] = await tx.$queryRaw<{ id: string; prefijo: string; ultimo_numero: number }[]>`
    SELECT id, prefijo, ultimo_numero FROM fac_series
    WHERE codigo = ${codigo} AND anio = ${anio}
    FOR UPDATE`
  const numero = serie.ultimo_numero + 1
  await tx.$executeRaw`UPDATE fac_series SET ultimo_numero = ${numero} WHERE id = ${serie.id}`
  const ultima = await tx.fac_facturas.aggregate({
    where: { serie_id: serie.id, numero: { not: null } },
    _max: { fecha_expedicion: true },
  })
  return {
    serie_id: serie.id,
    numero,
    num_serie_factura: formatearNumSerie(serie.prefijo, numero),
    ultima_fecha: ultima._max.fecha_expedicion,
  }
}
