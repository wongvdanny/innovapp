import { prisma } from '../prisma'
import { sendFacturaEmail } from '../email'
import { leerPdf } from './documentos'
import { marcarEntregada } from './emision'
import { eur } from './decimal'
import { ddmmaaaa } from './fechas'
import { Actor, registrarEvento } from './eventos'
import { FacturacionError } from './errores'

const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface OpcionesEnvio {
  to?: string            // por defecto, el email del cliente
  mensaje?: string       // texto libre opcional
  copia?: boolean        // copia oculta al email del emisor (Ajustes)
}

function htmlFactura(f: any, emisor: any, mensaje?: string) {
  const fecha = (v: any) => v ? ddmmaaaa(v).replace(/-/g, '/') : ''
  const nombre = f.cliente_snapshot?.razon_social
  const rect = f.tipo_factura.startsWith('R')
  const pagada = !!f.fecha_pago
  const negativa = Number(f.liquido_a_cobrar) <= 0
  const filas: [string, string][] = [
    ['Factura', f.num_serie_factura],
    ['Fecha', fecha(f.fecha_expedicion)],
    [Number(f.cuota_retencion) ? 'Total a pagar' : 'Importe', eur(f.liquido_a_cobrar)],
    ...(!pagada && !negativa && f.fecha_vencimiento ? [['Vencimiento', fecha(f.fecha_vencimiento)] as [string, string]] : []),
    ...(!pagada && !negativa && emisor.iban ? [['Transferencia a', emisor.iban] as [string, string]] : []),
    ...(pagada ? [['Estado', `Pagada el ${fecha(f.fecha_pago)}`] as [string, string]] : []),
  ]
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1e1e1e">
    <div style="background:#1e1e1e;padding:22px 28px;border-radius:14px 14px 0 0">
      <span style="color:#ee7528;font-size:20px;font-weight:800">${esc(emisor.nombre_comercial || emisor.nombre)}</span>
    </div>
    <div style="border:1px solid #eef1f4;border-top:none;border-radius:0 0 14px 14px;padding:28px">
      <p style="font-size:15px;margin:0 0 14px">Hola${nombre ? ` ${esc(nombre)}` : ''},</p>
      <p style="font-size:15px;margin:0 0 18px">Te enviamos adjunta la ${rect ? 'factura rectificativa' : 'factura'} <strong>${esc(f.num_serie_factura)}</strong>.</p>
      ${mensaje?.trim() ? `<p style="font-size:14px;margin:0 0 18px;white-space:pre-wrap;background:#f8fafb;border-radius:10px;padding:12px 14px">${esc(mensaje.trim())}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">
        ${filas.map(([k, v]) => `<tr><td style="padding:7px 0;color:#88a8b0;border-top:1px solid #eef1f4">${k}</td><td style="padding:7px 0;text-align:right;font-weight:700;border-top:1px solid #eef1f4">${esc(v)}</td></tr>`).join('')}
      </table>
      <p style="font-size:13px;color:#88a8b0;margin:0">Si tienes cualquier duda, responde a este email.</p>
    </div>
    <p style="font-size:11px;color:#88a8b0;text-align:center;margin:14px 0 0">${esc(emisor.nombre)} · NIF ${esc(emisor.nif)} · ${esc([emisor.direccion, emisor.cp, emisor.municipio].filter(Boolean).join(', '))}</p>
  </div>`
}

/**
 * Envía la factura por email con el PDF adjunto. Solo si Resend confirma el envío
 * se marca como entregada (email). Éxito y error quedan en fac_eventos.
 */
export async function enviarFactura(id: string, o: OpcionesEnvio, actor: Actor) {
  const f = await prisma.fac_facturas.findUnique({ where: { id }, include: { fac_clientes: { select: { email: true } } } })
  if (!f) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
  if (!['emitida', 'pagada'].includes(f.estado)) throw new FacturacionError('ESTADO_INVALIDO', `No se puede enviar una factura ${f.estado}`)
  const to = (o.to?.trim() || f.fac_clientes?.email || '').toLowerCase()
  if (!EMAIL_RE.test(to)) throw new FacturacionError('DATOS_INVALIDOS', 'Indica un email de destino válido')

  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const emisor = { ...(f.emisor_snapshot as any), iban: ajustes.iban || (f.emisor_snapshot as any)?.iban }
  const pdf = await leerPdf(id)
  const bcc = o.copia && ajustes.email ? ajustes.email : null

  let resendId: string | null
  try {
    resendId = await sendFacturaEmail({
      to, bcc, replyTo: ajustes.email || null,
      asunto: `${f.tipo_factura.startsWith('R') ? 'Factura rectificativa' : 'Factura'} ${f.num_serie_factura} · ${emisor.nombre_comercial || emisor.nombre}`,
      html: htmlFactura(f, emisor, o.mensaje),
      adjunto: pdf,
    })
  } catch (e: any) {
    await registrarEvento(prisma, actor, 'factura.email_error', 'factura', id, { to, error: String(e.message).slice(0, 500) })
    throw new FacturacionError('DATOS_INVALIDOS', `No se pudo enviar el email: ${e.message}`)
  }
  await registrarEvento(prisma, actor, 'factura.email_enviado', 'factura', id, { to, bcc, resend_id: resendId, num_serie_factura: f.num_serie_factura })
  await marcarEntregada(id, 'email', actor)
  return { ok: true, to, resendId }
}
