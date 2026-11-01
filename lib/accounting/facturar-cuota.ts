import { prisma } from '../prisma'
import { cuotasPagadasAgentes } from '../admin/agentes'
import { desglosarIvaIncluido } from '../facturacion/calculos'
import { fmt2 } from '../facturacion/decimal'
import { fechaDb } from '../facturacion/fechas'
import { validarNifEspanol } from '../facturacion/validacion'
import { Actor, identificarActor, registrarEvento } from '../facturacion/eventos'
import { FacturacionError } from '../facturacion/errores'

/**
 * Botón «Facturar» de una cuota de Agentes IA cobrada sin factura: crea un BORRADOR (no se emite)
 * con origen 'agentes' y pago_ref = id de la cuota. El importe de la cuota lleva IVA incluido, como
 * el precio de los planes. Un índice único impide facturar dos veces la misma cuota.
 * TODO (pendiente, acordado): que agentes avise por webhook al cobrar y el borrador se cree solo.
 */
export async function facturarCuotaAgentes(cuotaId: string, actor: Actor) {
  const previa = await prisma.fac_facturas.findFirst({ where: { origen: 'agentes', pago_ref: cuotaId, estado: { not: 'anulada' } }, select: { id: true } })
  if (previa) return { facturaId: previa.id, existente: true }

  const [c] = await cuotasPagadasAgentes([cuotaId])
  if (!c) throw new FacturacionError('NO_ENCONTRADA', 'Cuota no encontrada o no cobrada en Agentes IA')
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const iva = ajustes.iva_defecto.toString()
  const nifR = c.cif ? validarNifEspanol(c.cif) : null
  const nif = nifR?.valido ? nifR.normalizado : null

  try {
    const f = await prisma.$transaction(async tx => {
      await identificarActor(tx, actor)
      const cliente = (nif ? await tx.fac_clientes.findFirst({ where: { nif, activo: true } }) : null) ?? await tx.fac_clientes.create({
        data: {
          tipo: nifR?.tipo === 'CIF' ? 'empresa' : 'autonomo', razon_social: c.razonSocial || c.negocio, nif, pais: 'ES',
          direccion: c.direccion, cp: c.codigoPostal, municipio: c.ciudad, provincia: c.provincia, email: c.email,
          notas: `Creado desde una cuota de Agentes IA (negocio ${c.negocioId})`,
        },
      })
      const { base, cuota } = desglosarIvaIncluido(String(c.importe), iva)
      const descripcion = `Agentes IA · cuota del ${c.periodoDesde.split('-').reverse().join('/')} al ${c.periodoHasta.split('-').reverse().join('/')}`
      return tx.fac_facturas.create({
        data: {
          serie_codigo: 'F', tipo_factura: 'F1', cliente_id: cliente.id, origen: 'agentes', pago_ref: c.id, producto_slug: 'agentes',
          fecha_operacion: fechaDb(c.pagadaEn), descripcion_operacion: descripcion, created_by: actor.usuario,
          base_imponible: fmt2(base), cuota_iva: fmt2(cuota), importe_total: fmt2(c.importe), liquido_a_cobrar: fmt2(c.importe),
          fac_lineas: {
            create: [{
              orden: 0, descripcion, cantidad: '1', precio_unitario: fmt2(base), descuento_pct: '0', tipo_iva: iva,
              calificacion: 'S1', operacion_exenta: null, base: fmt2(base), cuota: fmt2(cuota),
            }],
          },
        },
      })
    })
    await registrarEvento(prisma, actor, 'cuota_agentes.borrador', 'factura', f.id, { cuota: c.id, negocio: c.negocioId, importe: fmt2(c.importe) })
    return { facturaId: f.id, existente: false }
  } catch (e: any) {
    if (e?.code === 'P2002') { // doble clic: otra petición ya lo creó
      const otra = await prisma.fac_facturas.findFirst({ where: { origen: 'agentes', pago_ref: cuotaId, estado: { not: 'anulada' } }, select: { id: true } })
      if (otra) return { facturaId: otra.id, existente: true }
    }
    throw e
  }
}
