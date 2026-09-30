import path from 'path'
import PDFDocument from 'pdfkit'
import type { DocumentoGestor } from '../gestor'

// PDF del documento para la gestoría, con la marca innovapp (Gabarito, #EE7528, #1E1E1E).
const FUENTES = path.join(process.cwd(), 'lib', 'facturacion', 'pdf', 'fonts')
const COLOR = { naranja: '#EE7528', negro: '#1E1E1E', gris: '#6B7C85', linea: '#E5E7EB', verde: '#166534', ambar: '#92400E' }
const A4 = { ancho: 595.28, alto: 841.89 }
const M = 48

export function generarPdfGestor(doc: DocumentoGestor): Promise<Buffer> {
  const pdf = new PDFDocument({ size: 'A4', margin: M, bufferPages: true, font: path.join(FUENTES, 'Gabarito-400.ttf'), info: { Title: doc.titulo, Author: doc.emisor.nombre, Creator: 'innovapp facturación' } })
  pdf.registerFont('n', path.join(FUENTES, 'Gabarito-400.ttf'))
  pdf.registerFont('b', path.join(FUENTES, 'Gabarito-700.ttf'))
  const trozos: Buffer[] = []
  pdf.on('data', (c: Buffer) => trozos.push(c))
  const fin = new Promise<Buffer>(res => pdf.on('end', () => res(Buffer.concat(trozos))))
  const ancho = A4.ancho - 2 * M
  const limite = A4.alto - M - 30
  const t = (f: 'n' | 'b', tam: number, color = COLOR.negro) => pdf.font(f).fontSize(tam).fillColor(color)
  const espacio = (h: number) => { if (pdf.y + h > limite) pdf.addPage() }

  // Cabecera
  pdf.save().rect(0, 0, A4.ancho, 70).fill(COLOR.negro).restore()
  t('b', 20, COLOR.naranja).text(doc.emisor.nombreComercial || 'innovapp', M, 24, { width: ancho })
  pdf.y = 92
  t('b', 20).text(doc.titulo, M, pdf.y, { width: ancho })
  t('n', 9, COLOR.gris).text(`${doc.emisor.nombre} · generado el ${new Date(doc.generado).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })} con los datos del sistema`, { width: ancho })
  pdf.moveDown(0.8)
  t('n', 11).text(doc.lead, { width: ancho })

  const h2 = (texto: string) => {
    espacio(50)
    pdf.moveDown(1.2)
    t('b', 14).text(texto, M, pdf.y, { width: ancho })
    const y = pdf.y + 2
    pdf.save().moveTo(M, y).lineTo(M + ancho, y).lineWidth(1.5).strokeColor(COLOR.naranja).stroke().restore()
    pdf.y = y + 8
  }
  const vineta = (marca: string, colorMarca: string, partes: [string, 'n' | 'b', string?][]) => {
    pdf.font('n').fontSize(10)
    const texto = partes.map(p => p[0]).join('')
    espacio(pdf.heightOfString(texto, { width: ancho - 16 }) + 6)
    const y = pdf.y
    t('b', 10, colorMarca).text(marca, M, y, { width: 14 })
    pdf.y = y
    partes.forEach(([s, f, c], i) => t(f, 10, c ?? COLOR.negro).text(s, i === 0 ? M + 16 : undefined, i === 0 ? y : undefined, { width: ancho - 16, continued: i < partes.length - 1 }))
    pdf.moveDown(0.35)
  }

  h2('Qué hace el sistema')
  for (const r of doc.resumen) vineta('•', COLOR.naranja, [[`${r.titulo}: `, 'b'], [r.texto, 'n']])

  h2('Criterios aplicados')
  const col = [ancho * 0.26, ancho * 0.58, ancho * 0.16]
  const fila = (celdas: string[], cabecera = false) => {
    pdf.font(cabecera ? 'b' : 'n').fontSize(cabecera ? 8 : 9.5)
    const alto = Math.max(...celdas.map((c, i) => pdf.heightOfString(c, { width: col[i] - 10 }))) + 10
    if (pdf.y + alto > limite) { pdf.addPage(); if (!cabecera) fila(['TEMA', 'CÓMO SE APLICA HOY', 'CONFIRMAR'], true) }
    const y = pdf.y
    if (cabecera) pdf.save().rect(M, y, ancho, alto).fill('#F8FAFB').restore()
    let x = M
    celdas.forEach((c, i) => {
      const color = cabecera ? COLOR.gris : i === 2 && c === 'Sí' ? COLOR.ambar : COLOR.negro
      t(cabecera || i === 0 || (i === 2 && c === 'Sí') ? 'b' : 'n', cabecera ? 8 : 9.5, color).text(c, x + 5, y + 5, { width: col[i] - 10 })
      x += col[i]
    })
    pdf.y = y + alto
    pdf.save().moveTo(M, pdf.y).lineTo(M + ancho, pdf.y).lineWidth(0.5).strokeColor(COLOR.linea).stroke().restore()
  }
  fila(['TEMA', 'CÓMO SE APLICA HOY', 'CONFIRMAR'], true)
  for (const c of doc.criterios) fila([c.tema, c.aplicado, c.confirmar ? 'Sí' : '—'])

  h2('VeriFactu: estado y pendientes')
  t('n', 10).text(doc.verifactu.estado, M, pdf.y, { width: ancho })
  pdf.moveDown(0.5)
  for (const p of doc.verifactu.pendientes) vineta(p.hecho ? '●' : '○', p.hecho ? COLOR.verde : COLOR.gris, [[p.texto, 'n', p.hecho ? COLOR.gris : COLOR.negro]])

  h2('Dudas para la gestoría')
  doc.dudas.forEach((d, i) => {
    vineta(`${i + 1}.`, COLOR.negro, [[`${d.tema}. `, 'b'], [d.pregunta, 'n']])
    if (d.estado === 'resuelta') vineta('', COLOR.verde, [['Resuelta: ', 'b', COLOR.verde], [d.respuesta || '—', 'n', COLOR.verde]])
    else { t('b', 8, COLOR.ambar).text('ABIERTA', M + 16, pdf.y - 2); pdf.moveDown(0.3) }
  })

  h2('Fuentes')
  for (const f of doc.fuentes) { espacio(16); t('n', 9, '#C85F1B').text(f.texto, M, pdf.y, { width: ancho, link: f.url, underline: true }); pdf.moveDown(0.2) }

  const paginas = pdf.bufferedPageRange()
  for (let i = 0; i < paginas.count; i++) {
    pdf.switchToPage(paginas.start + i)
    pdf.page.margins.bottom = 0
    t('n', 8, COLOR.gris).text(`${doc.emisor.nombreComercial || doc.emisor.nombre} · Documento para la gestoría · Página ${i + 1} de ${paginas.count}`, M, A4.alto - M + 10, { width: ancho, align: 'center', lineBreak: false })
  }
  pdf.end()
  return fin
}
