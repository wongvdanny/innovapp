import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { prisma } from '../../../../lib/prisma'
import { authOptions } from '../../../../lib/authOptions'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()
  const { subject, body } = req.body
  const subs = await prisma.newsletterSubscriber.findMany({ where: { active: true } })
  let sent = 0
  for (const sub of subs) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'innovapp <onboarding@resend.dev>',
        to: sub.email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${body}<hr style="margin-top:32px;border:none;border-top:1px solid #eee"><p style="font-size:12px;color:#999">Recibes este email porque te suscribiste en innovapp.es. <a href="https://innovapp.es/unsubscribe?email=${sub.email}">Darse de baja</a></p></div>`,
      })
      sent++
    } catch {}
  }
  return res.json({ ok: true, sent })
}
