import { prisma } from '../prisma'
import { historial } from './suscriptores'
import { reenviarRecibido } from './recepcion'

// Eventos de Resend (webhook). Llegan los de TODOS los correos de la cuenta: solo se tienen en
// cuenta los que corresponden a un envío de campaña (por su resend_id); el resto se ignora.
//   delivered → entregado · bounced → rebotado (y el suscriptor «rebotado» si es permanente)
//   complained → queja (y el suscriptor pasa a «baja») · failed → error
//   received → reenvío a contacto@ (respuestas al boletín; ver recepcion.ts)
// Sin aperturas ni clics: no hay píxel ni enlaces de seguimiento.

export interface EventoResend { type: string; created_at?: string; data?: { email_id?: string; bounce?: { type?: string; subType?: string; message?: string } } }

export async function procesarEvento(evt: EventoResend): Promise<string> {
  if (evt.type === 'email.received') return reenviarRecibido(evt as any)
  const id = evt.data?.email_id
  if (!id) return 'ignorado'
  const envio = await prisma.newsletter_envios.findUnique({ where: { resend_id: id } })
  if (!envio) return 'ignorado'
  const cuando = evt.created_at && !isNaN(Date.parse(evt.created_at)) ? new Date(evt.created_at) : new Date()

  switch (evt.type) {
    case 'email.delivered':
      // No retrocede: si ya rebotó o hubo queja, se queda así
      await prisma.newsletter_envios.updateMany({ where: { id: envio.id, estado: { in: ['pendiente', 'enviado'] } }, data: { estado: 'entregado', entregado_at: cuando, updated_at: new Date() } })
      return 'entregado'
    case 'email.bounced': {
      const permanente = (evt.data?.bounce?.type ?? '').toLowerCase() === 'permanent'
      await prisma.$transaction(async tx => {
        await tx.newsletter_envios.update({ where: { id: envio.id }, data: { estado: 'rebotado', rebotado_at: cuando, error: evt.data?.bounce?.message?.slice(0, 500) ?? null, updated_at: new Date() } })
        if (permanente) {
          const r = await tx.newsletter_suscriptores.updateMany({ where: { id: envio.suscriptor_id, estado: { in: ['confirmado', 'pendiente'] } }, data: { estado: 'rebotado', rebotado_at: cuando, updated_at: new Date() } })
          if (r.count) await historial(tx, envio.suscriptor_id, 'rebote', { campana: envio.campana_id, bounce: evt.data?.bounce ?? null })
        }
      })
      return permanente ? 'rebote_permanente' : 'rebote_temporal'
    }
    case 'email.complained':
      await prisma.$transaction(async tx => {
        await tx.newsletter_envios.update({ where: { id: envio.id }, data: { estado: 'queja', queja_at: cuando, updated_at: new Date() } })
        const r = await tx.newsletter_suscriptores.updateMany({ where: { id: envio.suscriptor_id, estado: { not: 'baja' } }, data: { estado: 'baja', baja_at: cuando, baja_motivo: 'queja', updated_at: new Date() } })
        if (r.count) await historial(tx, envio.suscriptor_id, 'queja', { campana: envio.campana_id })
      })
      return 'queja'
    case 'email.failed':
      await prisma.newsletter_envios.update({ where: { id: envio.id }, data: { estado: 'error', error: 'Resend: envío fallido', updated_at: new Date() } })
      return 'error'
    default:
      return 'ignorado'
  }
}
