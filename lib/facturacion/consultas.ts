import { prisma } from '../prisma'
import { FacturacionError } from './errores'

/** Factura con líneas, cliente, rectificada/rectificativas, registros VeriFactu y eventos. */
export async function detalleFactura(id: string) {
  const f = await prisma.fac_facturas.findUnique({
    where: { id },
    include: {
      fac_lineas: { orderBy: { orden: 'asc' } },
      fac_clientes: true,
      fac_facturas: { select: { id: true, num_serie_factura: true, fecha_expedicion: true, tipo_factura: true } },
      other_fac_facturas: { select: { id: true, num_serie_factura: true, estado: true, tipo_factura: true, importe_total: true } },
      fac_registros_verifactu: { orderBy: { id: 'asc' }, select: { id: true, tipo_registro: true, huella: true, huella_anterior: true, fecha_hora_huso_gen_registro: true, estado_envio: true, csv_aeat: true } },
    },
  })
  if (!f) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
  const eventos = await prisma.fac_eventos.findMany({ where: { entidad: 'factura', entidad_id: id }, orderBy: { id: 'asc' } })
  return { ...f, eventos }
}
