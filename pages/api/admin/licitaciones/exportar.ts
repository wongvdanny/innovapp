import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import ExcelJS from 'exceljs'
import { authOptions } from '../../../../lib/authOptions'
import { isAdmin } from '../../../../lib/isAdmin'
import { ESTADOS, Licitacion, plazoDe } from '../../../../lib/licitaciones'

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }

// Excel con las licitaciones seleccionadas en /licitaciones (llegan ya filtradas y ordenadas).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const filas: Licitacion[] = Array.isArray(req.body?.filas) ? req.body.filas : []
  if (!filas.length) return res.status(400).json({ error: 'No hay licitaciones seleccionadas' })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Licitaciones')
  ws.columns = [
    { header: 'Licitación', key: 'titulo', width: 60 },
    { header: 'Órgano', key: 'organo', width: 40 },
    { header: 'Lugar', key: 'prov', width: 18 },
    { header: 'Importe sin IVA (€)', key: 'importe', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Plazo', key: 'plazo', width: 17 },
    { header: 'Estado', key: 'estado', width: 22 },
    { header: 'CPV', key: 'cpv', width: 30 },
    { header: 'Actualizada', key: 'upd', width: 12 },
    { header: 'Enlace', key: 'link', width: 14 },
    { header: 'PCAP', key: 'pcap', width: 10 },
    { header: 'PPT', key: 'ppt', width: 10 },
    { header: 'Otros documentos', key: 'otros', width: 18 },
  ]
  // Solo enlaces de PLACSP (las filas llegan del navegador)
  const seguro = (u: unknown) => typeof u === 'string' && u.startsWith('https://contrataciondelestado.es/') ? u : ''
  const hiper = (u: string, text: string) => (u ? { text, hyperlink: u } : '')
  for (const l of filas) {
    const titulo = String(l.objeto || l.titulo || '')
    const link = seguro(l.link)
    const docs = Array.isArray(l.docs) ? l.docs : []
    const doc = (t: string) => seguro(docs.find(d => d?.tipo === t)?.url)
    const otros = docs.filter(d => d?.tipo === 'Otro').length
    ws.addRow({
      titulo, organo: l.organo, prov: l.prov, importe: Number(l.importe) || null, plazo: plazoDe(l),
      estado: ESTADOS[l.estado] ?? l.estado, cpv: (l.cpvs || []).join(', '), upd: String(l.upd || '').slice(0, 10),
      link: hiper(link, 'Ver en PLACSP'), pcap: hiper(doc('PCAP'), 'PCAP'), ppt: hiper(doc('PPT'), 'PPT'),
      otros: otros ? `${otros} (ver en PLACSP)` : '',
    })
  }
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: 'A1', to: 'L1' }
  ws.getColumn('titulo').alignment = { wrapText: true, vertical: 'top' }
  for (const c of ['link', 'pcap', 'ppt']) ws.getColumn(c).font = { color: { argb: 'FF2457D6' }, underline: true }
  ws.getRow(1).font = { bold: true }

  const fecha = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="licitaciones-${fecha}.xlsx"`)
  res.send(Buffer.from(await wb.xlsx.writeBuffer()))
}
