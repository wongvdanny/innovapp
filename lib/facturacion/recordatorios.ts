import { prisma } from '../prisma'
import { sendFacturaEmail } from '../email'
import { leerPdf } from './documentos'
import { htmlFactura } from './envio'
import { hoyMadrid, fechaDb, ddmmaaaa } from './fechas'
import { Actor, registrarEvento } from './eventos'

// Recordatorios de facturas vencidas: cada `recordatorio_cada_dias` días, hasta
// `recordatorio_max` veces, a facturas emitidas (no pagadas) cuyo cliente tenga email.

export async function enviarRecordatorios(actor: Actor = { usuario: 'cron' }, ahora = new Date()) {
  const a = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  if (!a.recordatorios_activos || a.recordatorio_max < 1) return []
  const limite = new Date(ahora.getTime() - a.recordatorio_cada_dias * 86_400_000)
  const vencidas = await prisma.fac_facturas.findMany({
    where: {
      estado: 'emitida',
      fecha_vencimiento: { lt: fechaDb(hoyMadrid(ahora)) },
      recordatorios_enviados: { lt: a.recordatorio_max },
      OR: [{ ultimo_recordatorio_at: null }, { ultimo_recordatorio_at: { lte: limite } }],
      liquido_a_cobrar: { gt: 0 },
    },
    include: { fac_clientes: { select: { email: true } } },
    orderBy: { fecha_vencimiento: 'asc' },
  })

  const res: { facturaId: string; numero: string | null; to?: string; ok: boolean; detalle?: string }[] = []
  for (const f of vencidas) {
    const to = f.fac_clientes?.email || (f.cliente_snapshot as any)?.email
    if (!to) { res.push({ facturaId: f.id, numero: f.num_serie_factura, ok: false, detalle: 'cliente sin email' }); continue }
    const n = f.recordatorios_enviados + 1
    const venc = ddmmaaaa(f.fecha_vencimiento!).replace(/-/g, '/')
    try {
      const emisor = { ...(f.emisor_snapshot as any), iban: a.iban || (f.emisor_snapshot as any)?.iban }
      const resendId = await sendFacturaEmail({
        to, replyTo: a.email || null,
        asunto: `Recordatorio: factura ${f.num_serie_factura} vencida el ${venc}`,
        html: htmlFactura(f, emisor, `Te recordamos que la factura ${f.num_serie_factura} venció el ${venc} y consta como pendiente de pago. Si ya la has pagado, ignora este mensaje y disculpa las molestias.`),
        adjunto: await leerPdf(f.id),
      })
      await prisma.fac_facturas.update({ where: { id: f.id }, data: { recordatorios_enviados: n, ultimo_recordatorio_at: ahora } })
      await registrarEvento(prisma, actor, 'factura.recordatorio_enviado', 'factura', f.id, { to, n, resend_id: resendId })
      res.push({ facturaId: f.id, numero: f.num_serie_factura, to, ok: true })
    } catch (e: any) {
      // Se aplaza al siguiente intervalo para no reintentar cada hora (sin contar como enviado)
      await prisma.fac_facturas.update({ where: { id: f.id }, data: { ultimo_recordatorio_at: ahora } })
      await registrarEvento(prisma, actor, 'factura.recordatorio_error', 'factura', f.id, { to, error: String(e.message).slice(0, 500) })
      res.push({ facturaId: f.id, numero: f.num_serie_factura, to, ok: false, detalle: e.message })
    }
  }
  return res
}
