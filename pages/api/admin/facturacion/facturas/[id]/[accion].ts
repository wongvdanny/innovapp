import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { emitirFactura, anularFactura, marcarPagada, desmarcarPagada, marcarEntregada, MetodoPago } from '../../../../../../lib/facturacion/emision'
import { crearRectificativa } from '../../../../../../lib/facturacion/rectificativas'
import { duplicarFactura } from '../../../../../../lib/facturacion/borradores'
import { hoyMadrid } from '../../../../../../lib/facturacion/fechas'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'
import { asegurarPdf } from '../../../../../../lib/facturacion/documentos'
import { enviarFactura } from '../../../../../../lib/facturacion/envio'

// POST /api/admin/facturacion/facturas/:id/:accion
export default adminApi({
  POST: async (req, _res, actor) => {
    const id = texto(req.query.id)
    const b = req.body || {}
    switch (texto(req.query.accion)) {
      case 'emitir': {
        const f = await emitirFactura(id, actor)
        // El PDF definitivo se genera ya; si falla, se generará en la primera descarga o envío.
        await asegurarPdf(id).catch(e => console.error('Facturación: PDF tras emitir', f.num_serie_factura, e.message))
        return f
      }
      case 'enviar':     return enviarFactura(id, { to: texto(b.to), mensaje: texto(b.mensaje), copia: b.copia === true }, actor)
      case 'pagar':      return marcarPagada(id, { fecha: texto(b.fecha) || hoyMadrid(), metodo: (texto(b.metodo) || 'transferencia') as MetodoPago }, actor)
      case 'desmarcar':  return desmarcarPagada(id, actor)
      case 'entregar':   return marcarEntregada(id, 'manual', actor)
      case 'anular':     return anularFactura(id, texto(b.motivo), actor)
      case 'rectificar': return crearRectificativa(id, { tipo: b.tipo === 'S' ? 'S' : 'I', motivo: texto(b.motivo), codigo: ['R1', 'R2', 'R3', 'R4'].includes(b.codigo) ? b.codigo : undefined }, actor)
      case 'duplicar':   return duplicarFactura(id, actor)
      default: throw new FacturacionError('DATOS_INVALIDOS', 'Acción no válida')
    }
  },
})
