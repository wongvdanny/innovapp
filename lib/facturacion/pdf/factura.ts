import path from 'path'
import fs from 'fs'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { D, eur, suma } from '../decimal'
import { ddmmaaaa } from '../fechas'
import { urlCotejo, TEXTO_SOBRE_QR, LEYENDA_VERIFACTU, QR_TAMANO_MM } from '../verifactu/qr'
import { rutaAbsoluta } from '../storage'

// PDF de factura (A4). Contenido obligatorio del art. 6 RD 1619/2012: número y serie, fecha de
// expedición y de operación, emisor y destinatario completos, descripción, base, tipo y cuota
// por tipo impositivo, retención y total. QR tributario arriba (Orden HAC/1177/2024 art. 20-21).

const FUENTES = path.join(process.cwd(), 'lib', 'facturacion', 'pdf', 'fonts')
const COLOR = { naranja: '#EE7528', negro: '#1E1E1E', gris: '#6B7C85', linea: '#E5E7EB', fondo: '#F8FAFB' }
const MM = 72 / 25.4
const A4 = { ancho: 595.28, alto: 841.89 }
const M = 42 // margen
const PIE = 40 // alto reservado al pie

const METODOS: Record<string, string> = {
  transferencia: 'transferencia bancaria', tarjeta: 'tarjeta', stripe: 'tarjeta (Stripe)', redsys: 'tarjeta (Redsys)',
  efectivo: 'efectivo', domiciliacion: 'domiciliación bancaria', otro: 'otro medio',
}
const PAISES: Record<string, string> = { ES: 'España', PT: 'Portugal', FR: 'Francia', DE: 'Alemania', IT: 'Italia', NL: 'Países Bajos', BE: 'Bélgica', IE: 'Irlanda', GB: 'Reino Unido', US: 'Estados Unidos', MX: 'México', AR: 'Argentina', CO: 'Colombia', CL: 'Chile', PE: 'Perú', UY: 'Uruguay' }

export interface LineaPdf { descripcion: string; cantidad: any; precio_unitario: any; descuento_pct: any; tipo_iva: any; calificacion: string; operacion_exenta: string | null; base: any; cuota: any }
export interface FacturaPdf {
  estado: string
  tipo_factura: string
  num_serie_factura: string | null
  fecha_expedicion: Date | string | null
  fecha_operacion: Date | string | null
  fecha_vencimiento: Date | string | null
  emisor_snapshot: any
  cliente_snapshot: any
  base_imponible: any; cuota_iva: any; importe_total: any; tipo_retencion: any; cuota_retencion: any; liquido_a_cobrar: any
  metodo_pago: string | null; fecha_pago: Date | string | null
  tipo_rectificacion: string | null; motivo_rectificacion: string | null
  base_rectificada: any; cuota_rectificada: any
  modo_verifactu: boolean
  notas: string | null
  fac_lineas: LineaPdf[]
  rectificada?: { num_serie_factura: string | null; fecha_expedicion: Date | string | null } | null
}
export interface OpcionesPdf {
  iban?: string
  textoPie?: string
  logoPath?: string | null       // relativa a storage/facturacion
  qrNoVerifactu?: boolean
  vistaPrevia?: boolean          // borradores: marca de agua, sin número
}

const fecha = (v: Date | string | null | undefined) => v ? ddmmaaaa(v).replace(/-/g, '/') : '—'
const num = (v: any) => Number(v).toLocaleString('es-ES', { maximumFractionDigits: 4 })

function tituloDe(tipo: string) {
  if (tipo.startsWith('R')) return { titulo: 'FACTURA RECTIFICATIVA', sub: tipo === 'R5' ? 'Rectificativa de factura simplificada (R5)' : `Tipo ${tipo}` }
  if (tipo === 'F2') return { titulo: 'FACTURA SIMPLIFICADA', sub: 'Tipo F2' }
  return { titulo: 'FACTURA', sub: 'Tipo F1' }
}

function regimen(l: LineaPdf) {
  if (l.operacion_exenta) return { clave: `E-${l.operacion_exenta}`, label: 'Exenta', orden: 1 }
  if (l.calificacion?.startsWith('N')) return { clave: `N-${l.calificacion}`, label: 'No sujeta', orden: 2 }
  return { clave: `S-${Number(l.tipo_iva)}`, label: `${num(l.tipo_iva)} %`, orden: 0 }
}

export async function generarPdfFactura(f: FacturaPdf, o: OpcionesPdf = {}): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4', margin: M, bufferPages: true, font: path.join(FUENTES, 'Gabarito-400.ttf'),
    info: { Title: `Factura ${f.num_serie_factura ?? 'borrador'}`, Author: f.emisor_snapshot?.nombre ?? '', Creator: 'innovapp facturación' },
  })
  doc.registerFont('n', path.join(FUENTES, 'Gabarito-400.ttf'))
  doc.registerFont('b', path.join(FUENTES, 'Gabarito-700.ttf'))
  const trozos: Buffer[] = []
  doc.on('data', (c: Buffer) => trozos.push(c))
  const fin = new Promise<Buffer>(res => doc.on('end', () => res(Buffer.concat(trozos))))

  const e = f.emisor_snapshot || {}
  const c = f.cliente_snapshot || {}
  const ancho = A4.ancho - 2 * M
  const limite = A4.alto - M - PIE
  const t = (fuente: 'n' | 'b', tam: number, color = COLOR.negro) => doc.font(fuente).fontSize(tam).fillColor(color)

  // ── Cabecera: QR tributario arriba a la izquierda (si procede), título a la derecha ──
  const conQR = !o.vistaPrevia && (f.modo_verifactu || o.qrNoVerifactu)
  let yCab = M
  let xTitulo = M
  if (conQR && f.num_serie_factura && f.fecha_expedicion) {
    const url = urlCotejo({ nif: e.nif, numSerie: f.num_serie_factura, fechaExpedicion: f.fecha_expedicion, importeTotal: f.importe_total, verifactu: f.modo_verifactu })
    const lado = QR_TAMANO_MM * MM
    const png = await QRCode.toBuffer(url, { errorCorrectionLevel: 'M', margin: 0, width: 600, color: { dark: '#000000', light: '#FFFFFF' } })
    t('b', 9).text(TEXTO_SOBRE_QR, M, yCab, { width: lado, align: 'center' })
    doc.image(png, M, yCab + 13, { width: lado, height: lado })
    let yQ = yCab + 13 + lado + 4
    if (f.modo_verifactu) {
      t('b', 9).text(LEYENDA_VERIFACTU, M - 10, yQ, { width: lado + 20, align: 'center' })
      yQ = doc.y
    }
    xTitulo = M + lado + 30
    yCab = Math.max(yQ, yCab)
  }

  // Logo (PNG en storage) o nombre comercial como marca
  const anchoDer = A4.ancho - M - xTitulo
  let yDer = M
  const logo = o.logoPath ? (() => { try { const p = rutaAbsoluta(o.logoPath!); return fs.existsSync(p) ? p : null } catch { return null } })() : null
  if (logo) {
    doc.image(logo, A4.ancho - M - 140, yDer, { fit: [140, 42], align: 'right' })
    yDer += 52
  } else {
    t('b', 20, COLOR.naranja).text(e.nombre_comercial || e.nombre || '', xTitulo, yDer, { width: anchoDer, align: 'right' })
    yDer = doc.y + 8
  }
  const { titulo, sub } = tituloDe(f.tipo_factura)
  t('b', 18).text(titulo, xTitulo, yDer, { width: anchoDer, align: 'right' })
  t('n', 9, COLOR.gris).text(sub, xTitulo, doc.y, { width: anchoDer, align: 'right' })
  doc.moveDown(0.4)
  const datosCab: [string, string][] = [
    ['Número', f.num_serie_factura ?? 'BORRADOR'],
    ['Fecha de expedición', f.fecha_expedicion ? fecha(f.fecha_expedicion) : 'Al emitir'],
    ...(f.fecha_operacion ? [['Fecha de operación', fecha(f.fecha_operacion)] as [string, string]] : []),
    ...(f.fecha_vencimiento && !f.fecha_pago && D(f.liquido_a_cobrar).greaterThan(0) ? [['Vencimiento', fecha(f.fecha_vencimiento)] as [string, string]] : []),
  ]
  for (const [k, v] of datosCab) {
    const y = doc.y
    t('n', 9, COLOR.gris).text(k, xTitulo, y, { width: anchoDer - 110, align: 'right' })
    t('b', 10).text(v, A4.ancho - M - 105, y, { width: 105, align: 'right' })
    doc.y = Math.max(doc.y, y + 13)
  }
  let y = Math.max(doc.y, yCab) + 18

  // ── Emisor y destinatario ──
  const colAncho = (ancho - 16) / 2
  const bloque = (x: number, etiqueta: string, lineas: (string | null | undefined)[], nombre?: string) => {
    t('b', 8, COLOR.naranja).text(etiqueta.toUpperCase(), x + 12, y + 10, { width: colAncho - 24, characterSpacing: 0.8 })
    if (nombre) t('b', 11).text(nombre, x + 12, doc.y + 3, { width: colAncho - 24 })
    t('n', 9, COLOR.negro)
    for (const l of lineas.filter(Boolean)) doc.text(l as string, x + 12, doc.y + 1, { width: colAncho - 24 })
    return doc.y
  }
  const direccion = (s: any) => [s.direccion, [s.cp, s.municipio].filter(Boolean).join(' ') + (s.provincia ? ` (${s.provincia})` : ''), s.pais && s.pais !== 'ES' ? PAISES[s.pais] ?? s.pais : null]
  const yE = bloque(M, 'Emisor', [e.nombre_comercial ? `Nombre comercial: ${e.nombre_comercial}` : null, `NIF: ${e.nif}`, ...direccion(e), e.email, e.telefono], e.nombre)
  const yC = c.razon_social || c.nif
    ? bloque(M + colAncho + 16, 'Cliente', [c.nif ? `${c.tipo_id === '02' ? 'NIF-IVA' : c.tipo_id && c.tipo_id !== '01' ? 'Id. fiscal' : 'NIF'}: ${c.nif}` : null, ...direccion(c)], c.razon_social)
    : bloque(M + colAncho + 16, 'Cliente', ['Destinatario no identificado (factura simplificada)'])
  const altoBloques = Math.max(yE, yC) - y + 10
  doc.save().lineWidth(0.8).strokeColor(COLOR.linea)
    .roundedRect(M, y, colAncho, altoBloques, 6).stroke()
    .roundedRect(M + colAncho + 16, y, colAncho, altoBloques, 6).stroke().restore()
  y += altoBloques + 14

  // ── Rectificativa: referencia a la factura rectificada (art. 15 RD 1619/2012) ──
  if (f.tipo_factura.startsWith('R')) {
    const r = f.rectificada
    const texto = `Rectifica la factura ${r?.num_serie_factura ?? ''} expedida el ${fecha(r?.fecha_expedicion)}. `
      + `Rectificación ${f.tipo_rectificacion === 'S' ? 'por sustitución' : 'por diferencias'}. Motivo: ${f.motivo_rectificacion ?? ''}`
      + (f.tipo_rectificacion === 'S' && f.base_rectificada !== null ? ` (base rectificada ${eur(f.base_rectificada)}, cuota rectificada ${eur(f.cuota_rectificada)})` : '')
    t('n', 9)
    const h = doc.heightOfString(texto, { width: ancho - 24 }) + 16
    doc.save().roundedRect(M, y, ancho, h, 6).fill('#FFF7ED').restore()
    t('n', 9).text(texto, M + 12, y + 8, { width: ancho - 24 })
    y += h + 12
  }

  // ── Conceptos ──
  const cols = [
    { k: 'Concepto', w: ancho - 290, a: 'left' as const },
    { k: 'Cant.', w: 45, a: 'right' as const },
    { k: 'Precio', w: 70, a: 'right' as const },
    { k: 'Dto.', w: 40, a: 'right' as const },
    { k: 'IVA', w: 55, a: 'right' as const },
    { k: 'Importe', w: 80, a: 'right' as const },
  ]
  const cabeceraTabla = () => {
    doc.save().rect(M, y, ancho, 20).fill(COLOR.negro).restore()
    let x = M
    for (const col of cols) { t('b', 8, '#FFFFFF').text(col.k.toUpperCase(), x + 6, y + 6.5, { width: col.w - 12, align: col.a, characterSpacing: 0.5 }); x += col.w }
    y += 24
  }
  const saltoSiHaceFalta = (alto: number) => {
    if (y + alto <= limite) return false
    doc.addPage(); y = M
    return true
  }
  cabeceraTabla()
  for (const l of f.fac_lineas) {
    const r = regimen(l)
    t('n', 9)
    const alto = Math.max(doc.heightOfString(l.descripcion, { width: cols[0].w - 12 }), 11) + 8
    if (saltoSiHaceFalta(alto)) cabeceraTabla()
    const celdas = [l.descripcion, num(l.cantidad), eur(l.precio_unitario), Number(l.descuento_pct) ? `${num(l.descuento_pct)} %` : '—', r.label, eur(l.base)]
    let x = M
    celdas.forEach((v, i) => { t(i === 5 ? 'b' : 'n', 9).text(v, x + 6, y, { width: cols[i].w - 12, align: cols[i].a }); x += cols[i].w })
    y += alto
    doc.save().moveTo(M, y - 4).lineTo(M + ancho, y - 4).lineWidth(0.5).strokeColor(COLOR.linea).stroke().restore()
  }
  y += 8

  // ── Desglose por tipo y totales ──
  const grupos = new Map<string, { label: string; orden: number; base: any[]; cuota: any[] }>()
  for (const l of f.fac_lineas) {
    const r = regimen(l)
    const g = grupos.get(r.clave) ?? { label: r.label, orden: r.orden, base: [], cuota: [] }
    g.base.push(l.base); g.cuota.push(l.cuota); grupos.set(r.clave, g)
  }
  const desglose = Array.from(grupos.values()).sort((a, b) => a.orden - b.orden)
  const retencion = D(f.cuota_retencion)
  const filasTot: [string, string, boolean?][] = [
    ['Base imponible', eur(f.base_imponible)],
    ['Cuota IVA', eur(f.cuota_iva)],
    ['Total factura', eur(f.importe_total), true],
    ...(!retencion.isZero() ? [[`Retención IRPF (${num(f.tipo_retencion)} %)`, eur(retencion.negated())] as [string, string]] : []),
  ]
  const altoResumen = Math.max(desglose.length * 15 + 30, filasTot.length * 17 + 40)
  saltoSiHaceFalta(altoResumen)
  const yRes = y
  // Desglose (izquierda)
  const wD = [95, 60, 85]
  t('b', 8, COLOR.gris)
  ;['BASE IMPONIBLE', 'TIPO', 'CUOTA'].forEach((h, i) => doc.text(h, M + wD.slice(0, i).reduce((a, b) => a + b, 0), y, { width: wD[i] - 8, align: i === 1 ? 'center' : 'right', characterSpacing: 0.5 }))
  y += 14
  for (const g of desglose) {
    const vals = [eur(suma(g.base)), g.label, eur(suma(g.cuota))]
    vals.forEach((v, i) => t('n', 9).text(v, M + wD.slice(0, i).reduce((a, b) => a + b, 0), y, { width: wD[i] - 8, align: i === 1 ? 'center' : 'right' }))
    y += 15
  }
  // Totales (derecha)
  const xT = M + ancho - 230
  let yT = yRes
  for (const [k, v, fuerte] of filasTot) {
    t(fuerte ? 'b' : 'n', 10, fuerte ? COLOR.negro : COLOR.gris).text(k, xT, yT, { width: 140 })
    t(fuerte ? 'b' : 'n', 10).text(v, xT + 130, yT, { width: 100, align: 'right' })
    yT += 17
  }
  doc.save().roundedRect(xT - 8, yT + 2, 238, 30, 6).fill(COLOR.naranja).restore()
  t('b', 11, '#FFFFFF').text(retencion.isZero() ? 'TOTAL' : 'TOTAL A PAGAR', xT + 2, yT + 12, { width: 120 })
  t('b', 14, '#FFFFFF').text(eur(f.liquido_a_cobrar), xT + 100, yT + 10, { width: 120, align: 'right' })
  y = Math.max(y, yT + 40) + 14

  // ── Menciones legales, forma de pago, notas ──
  const menciones: string[] = []
  if (f.fac_lineas.some(l => l.operacion_exenta)) menciones.push('Operación exenta de IVA en virtud del artículo 20 de la Ley 37/1992 del IVA.')
  if (f.fac_lineas.some(l => l.calificacion?.startsWith('N'))) {
    menciones.push('Operación no sujeta a IVA en el territorio de aplicación del impuesto por aplicación de las reglas de localización (arts. 69 y 70 de la Ley 37/1992).')
    if (c.tipo_id === '02') menciones.push('Inversión del sujeto pasivo.')
  }
  const pago = f.metodo_pago && f.fecha_pago
    ? `Pagada mediante ${METODOS[f.metodo_pago] ?? f.metodo_pago} el ${fecha(f.fecha_pago)}.`
    : o.iban && D(f.liquido_a_cobrar).greaterThan(0) ? `transferencia bancaria a ${o.iban}${f.fecha_vencimiento ? ` antes del ${fecha(f.fecha_vencimiento)}` : ''}. Indica el número de factura en el concepto.` : null
  const parrafos: [string, string, string][] = [
    ...(pago ? [['b', 'Forma de pago', pago] as [string, string, string]] : []),
    ...(f.notas ? [['b', 'Notas', f.notas] as [string, string, string]] : []),
    ...menciones.map(m => ['n', '', m] as [string, string, string]),
    ...(o.textoPie ? [['n', '', o.textoPie] as [string, string, string]] : []),
  ]
  for (const [fuente, titulo, texto] of parrafos) {
    t('n', 9)
    const h = doc.heightOfString((titulo ? `${titulo}: ` : '') + texto, { width: ancho }) + 6
    saltoSiHaceFalta(h)
    if (titulo) { t('b', 9).text(`${titulo}: `, M, y, { continued: true }); t('n', 9).text(texto) }
    else t(fuente as 'n', 9, COLOR.gris).text(texto, M, y, { width: ancho })
    y = doc.y + 6
  }

  // ── Pie de página y marca de agua ──
  const paginas = doc.bufferedPageRange()
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(paginas.start + i)
    doc.page.margins.bottom = 0 // el pie va dentro del margen: sin esto pdfkit abriría otra página
    const pie = `${e.nombre ?? ''} · NIF ${e.nif ?? ''} · ${f.num_serie_factura ?? 'Borrador'} · Página ${i + 1} de ${paginas.count}`
    t('n', 8, COLOR.gris).text(pie, M, A4.alto - M - 10, { width: ancho, align: 'center', lineBreak: false })
    if (o.vistaPrevia) {
      doc.save().rotate(-35, { origin: [A4.ancho / 2, A4.alto / 2] }).opacity(0.08)
      t('b', 80, COLOR.negro).text('BORRADOR', 0, A4.alto / 2 - 50, { width: A4.ancho, align: 'center', lineBreak: false })
      doc.restore()
      t('b', 8, COLOR.naranja).text('Vista previa sin validez fiscal', M, M - 22, { width: ancho, align: 'center', lineBreak: false })
    }
  }
  doc.end()
  return fin
}
