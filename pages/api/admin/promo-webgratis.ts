import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { MAX_SUPLENTES, PROMO_SLUG } from '../../../lib/promo/config'
import { sendPromoSeleccionado, sendPromoSuplente } from '../../../lib/email'

// Admin de la promoción /webgratis:
//   GET                    inscripciones + KPIs
//   GET ?csv=todas         CSV con todas las inscripciones
//   GET ?csv=marketing     CSV para la herramienta de email: consentimiento de marketing, confirmadas y sin baja
//   PATCH { id, followsInstagram?, status?, substituteOrder?, adminNotes?, notifiedAt?, acceptedAt?, materialDelivered? }
//   POST  { accion: 'enviar', id }    email «Has sido seleccionado» o «Eres suplente nº X» (y fecha de aviso)
//   POST  { accion: 'promover', id }  el ganador pasa a descartado y el primer suplente a ganador

const ESTADOS = ['pending', 'shortlisted', 'selected', 'substitute', 'rejected']

/** «2026-12-16» o ISO → Date; vacío → null; inválido → undefined. */
const aFecha = (v: unknown): Date | null | undefined => {
  if (v === null || v === '') return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? undefined : d
}

const BOM = String.fromCharCode(0xfeff)
// Celdas que empiezan por = + - @ se neutralizan para que la hoja de cálculo no las ejecute como fórmula
const celda = (v: unknown) => {
  let s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v)
  if (/^[=+\-@]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  if (req.method === 'GET') {
    const csv = String(req.query.csv ?? '')
    if (csv === 'todas' || csv === 'marketing') {
      const filas = await prisma.promoEntry.findMany({
        where: csv === 'marketing'
          ? { promo: PROMO_SLUG, marketingConsent: true, confirmedAt: { not: null }, unsubscribedAt: null }
          : { promo: PROMO_SLUG },
        orderBy: { createdAt: 'asc' },
      })
      const columnas = csv === 'marketing'
        ? (['email', 'name', 'businessName', 'sector', 'province', 'createdAt'] as const)
        : (['createdAt', 'confirmedAt', 'status', 'name', 'businessName', 'sector', 'city', 'province', 'email', 'phone', 'instagram',
            'followsInstagram', 'currentWeb', 'contactChannel', 'description', 'marketingConsent', 'unsubscribedAt', 'adminNotes', 'consentText', 'ip', 'userAgent'] as const)
      const lineas = [columnas.join(';'), ...filas.map(f => columnas.map(c => celda(f[c])).join(';'))]
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="webgratis-${csv}-${new Date().toISOString().slice(0, 10)}.csv"`)
      return res.status(200).send(BOM + lineas.join('\r\n'))
    }

    const entradas = await prisma.promoEntry.findMany({ where: { promo: PROMO_SLUG }, orderBy: { createdAt: 'desc' } })
    const contar = (clave: 'province' | 'sector') =>
      Object.entries(entradas.reduce<Record<string, number>>((m, e) => ({ ...m, [e[clave]]: (m[e[clave]] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
    const total = entradas.length
    const conMarketing = entradas.filter(e => e.marketingConsent).length
    return res.status(200).json({
      entradas,
      kpis: {
        total,
        confirmadas: entradas.filter(e => e.confirmedAt).length,
        pctMarketing: total ? Math.round((conMarketing / total) * 100) : 0,
        porProvincia: contar('province'),
        porSector: contar('sector'),
        ganadores: entradas.filter(e => e.status === 'selected').length,
        suplentes: entradas.filter(e => e.status === 'substitute').length,
        // Sectores con más de un ganador (las bases piden variedad de sectores)
        sectoresRepetidos: Object.entries(entradas.filter(e => e.status === 'selected')
          .reduce<Record<string, number>>((m, e) => ({ ...m, [e.sector]: (m[e.sector] ?? 0) + 1 }), {}))
          .filter(([, n]) => n > 1).map(([s]) => s),
      },
    })
  }

  if (req.method === 'PATCH') {
    const b = (req.body ?? {}) as Record<string, unknown>
    const id = String(b.id ?? '')
    const data: {
      followsInstagram?: boolean | null; status?: string; substituteOrder?: number | null; adminNotes?: string | null
      notifiedAt?: Date | null; acceptedAt?: Date | null; materialDeliveredAt?: Date | null
    } = {}
    if ('followsInstagram' in b) data.followsInstagram = b.followsInstagram === null ? null : b.followsInstagram === true
    if ('adminNotes' in b) data.adminNotes = String(b.adminNotes ?? '').slice(0, 5000) || null
    for (const k of ['notifiedAt', 'acceptedAt'] as const) {
      if (!(k in b)) continue
      const f = aFecha(b[k])
      if (f === undefined) return res.status(400).json({ error: 'Fecha no válida' })
      data[k] = f
    }
    const existe = id ? await prisma.promoEntry.findFirst({ where: { id, promo: PROMO_SLUG } }) : null
    if (!existe) return res.status(404).json({ error: 'Inscripción no encontrada' })
    // Casilla «Material entregado»: guarda la fecha al marcarla (conserva la que hubiera) y la borra al desmarcarla
    if ('materialDelivered' in b) data.materialDeliveredAt = b.materialDelivered === true ? existe.materialDeliveredAt ?? new Date() : null
    if ('status' in b) {
      if (!ESTADOS.includes(String(b.status))) return res.status(400).json({ error: 'Estado no válido' })
      data.status = String(b.status)
      if (data.status === 'substitute') {
        const orden = Number(b.substituteOrder)
        if (!Number.isInteger(orden) || orden < 1 || orden > MAX_SUPLENTES) return res.status(400).json({ error: `Indica el orden del suplente (1-${MAX_SUPLENTES}).` })
        const ocupado = await prisma.promoEntry.findFirst({ where: { promo: PROMO_SLUG, status: 'substitute', substituteOrder: orden, NOT: { id } } })
        if (ocupado) return res.status(409).json({ error: `El orden ${orden} ya lo tiene ${ocupado.businessName}.` })
        data.substituteOrder = orden
      } else {
        data.substituteOrder = null
      }
    }
    const entrada = await prisma.promoEntry.update({ where: { id }, data })
    return res.status(200).json({ entrada })
  }

  if (req.method === 'POST') {
    const b = (req.body ?? {}) as Record<string, unknown>
    const id = String(b.id ?? '')
    const e = id ? await prisma.promoEntry.findFirst({ where: { id, promo: PROMO_SLUG } }) : null
    if (!e) return res.status(404).json({ error: 'Inscripción no encontrada' })

    if (b.accion === 'enviar') {
      try {
        if (e.status === 'selected') {
          await sendPromoSeleccionado(e)
          // La fecha de aviso marca el inicio del plazo para aceptar (si no se había puesto a mano)
          const entrada = e.notifiedAt ? e : await prisma.promoEntry.update({ where: { id }, data: { notifiedAt: new Date() } })
          return res.status(200).json({ entrada, enviado: 'seleccionado' })
        }
        if (e.status === 'substitute' && e.substituteOrder) {
          await sendPromoSuplente(e, e.substituteOrder)
          return res.status(200).json({ entrada: e, enviado: 'suplente' })
        }
      } catch (err) {
        console.error('[api/admin/promo-webgratis] fallo al enviar el aviso:', err)
        return res.status(502).json({ error: 'No se ha podido enviar el email.' })
      }
      return res.status(400).json({ error: 'Solo se avisa a ganadores y suplentes.' })
    }

    if (b.accion === 'promover') {
      if (e.status !== 'selected') return res.status(400).json({ error: 'Solo se puede sustituir a un ganador.' })
      const suplente = await prisma.promoEntry.findFirst({ where: { promo: PROMO_SLUG, status: 'substitute' }, orderBy: { substituteOrder: 'asc' } })
      if (!suplente) return res.status(409).json({ error: 'No quedan suplentes.' })
      const [, nuevo] = await prisma.$transaction([
        prisma.promoEntry.update({ where: { id: e.id }, data: { status: 'rejected' } }),
        prisma.promoEntry.update({ where: { id: suplente.id }, data: { status: 'selected', substituteOrder: null, notifiedAt: null, acceptedAt: null, materialDeliveredAt: null } }),
      ])
      return res.status(200).json({ promovido: nuevo })
    }
    return res.status(400).json({ error: 'Acción no válida' })
  }

  res.setHeader('Allow', 'GET, PATCH, POST')
  return res.status(405).json({ error: 'Método no permitido' })
}
