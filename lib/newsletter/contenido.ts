// Composición de los correos de campaña (funciones puras, sin prisma).
// Markdown sencillo → HTML y texto plano, variables {{nombre}}/{{empresa}} y la firma con {{url_baja}}.
// Sin píxel de seguimiento ni enlaces redirigidos: los enlaces van tal cual.

export interface Destinatario { nombre?: string | null; empresa?: string | null; urlBaja: string }
/** PDF opcional de la campaña: en el correo va un botón «Descargar» (no un adjunto). */
export interface ArchivoCorreo { nombre: string; url: string; bytes: number }

const tamano = (b: number) => (b >= 1048576 ? `${(b / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

function botonDescarga(a: ArchivoCorreo) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td style="background:#EE7528;border-radius:10px;">
<a href="${esc(a.url)}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#1E1E1E;text-decoration:none;">Descargar «${esc(a.nombre)}» (PDF, ${tamano(a.bytes)})</a>
</td></tr></table>`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Sustituye {{nombre}} y {{empresa}}. En HTML, el valor va escapado. Si el dato está vacío, se quita
 * también la coma o el espacio que lo acompaña: «Hola, {{nombre}}:» → «Hola:», «Hola {{nombre}},» → «Hola,»,
 * «{{nombre}}, te escribo…» al principio de línea → «te escribo…».
 * Con texto alternativo, «como {{empresa|la tuya}}» → «como la tuya» si falta la empresa.
 */
export function sustituirVariables(texto: string, d: Pick<Destinatario, 'nombre' | 'empresa'>, html: boolean) {
  let t = texto
  for (const [clave, valor] of [['nombre', d.nombre], ['empresa', d.empresa]] as const) {
    const v = (valor ?? '').trim()
    // {{empresa|la tuya}}: texto alternativo si falta el dato (con dato, se usa el dato)
    t = t.replace(new RegExp(`\\{\\{\\s*${clave}\\s*\\|([^}]*)\\}\\}`, 'g'), (_m, alt: string) => (v ? (html ? esc(v) : v) : alt.trim()))
    const marca = `\\{\\{\\s*${clave}\\s*\\}\\}`
    if (v) { t = t.replace(new RegExp(marca, 'g'), html ? esc(v) : v); continue }
    t = t
      .replace(new RegExp(`[ \\t]*,[ \\t]*${marca}`, 'g'), '')            // «Hola, {{nombre}}» → «Hola»
      .replace(new RegExp(`(^|\\n)[ \\t]*${marca}[ \\t]*,?[ \\t]*`, 'g'), '$1') // «{{nombre}}, te…» → «te…»
      .replace(new RegExp(`[ \\t]+${marca}`, 'g'), '')                     // «Hola {{nombre}},» → «Hola,»
      .replace(new RegExp(marca, 'g'), '')
  }
  return t
}

const URL_SEGURA = /^(https?:\/\/|mailto:|tel:)/i

/** Negrita, cursiva y enlaces dentro de una línea (sobre texto ya escapado). */
function enLinea(s: string) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, u) =>
      URL_SEGURA.test(u) ? `<a href="${u}" style="color:#C85F1B;text-decoration:underline;">${t}</a>` : t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
}

const P = 'margin:0 0 16px;font-size:15px;line-height:24px;color:#1E1E1E;'
const H = (n: number) => `margin:24px 0 12px;font-size:${[0, 24, 20, 17][n]}px;line-height:1.3;color:#1E1E1E;`

/** Markdown sencillo: # títulos, párrafos, listas (- y 1.), **negrita**, *cursiva*, [enlaces](url) y ---. */
export function markdownAHtml(md: string) {
  const out: string[] = []
  const bloques = md.replace(/\r\n/g, '\n').split(/\n{2,}/)
  for (const b of bloques) {
    const lineas = b.split('\n').filter(l => l.trim() !== '')
    if (!lineas.length) continue
    const h = lineas[0].match(/^(#{1,3})\s+(.*)$/)
    if (h && lineas.length === 1) { out.push(`<h${h[1].length} style="${H(h[1].length)}">${enLinea(h[2])}</h${h[1].length}>`); continue }
    if (lineas.length === 1 && /^-{3,}$/.test(lineas[0].trim())) { out.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">'); continue }
    if (lineas.every(l => /^\s*[-*]\s+/.test(l))) {
      out.push(`<ul style="${P}padding-left:22px;">${lineas.map(l => `<li style="margin:0 0 6px;">${enLinea(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`); continue
    }
    if (lineas.every(l => /^\s*\d+[.)]\s+/.test(l))) {
      out.push(`<ol style="${P}padding-left:22px;">${lineas.map(l => `<li style="margin:0 0 6px;">${enLinea(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`); continue
    }
    out.push(`<p style="${P}">${lineas.map(enLinea).join('<br>')}</p>`)
  }
  return out.join('\n')
}

/** Versión de texto plano del mismo markdown: los enlaces quedan como «texto (url)». */
export function markdownATexto(md: string) {
  return md.replace(/\r\n/g, '\n')
    .replace(/^#{1,3}\s+(.*)$/gm, (_m, t) => t.toUpperCase())
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1$2')
    .replace(/^\s*[*]\s+/gm, '- ')
    .replace(/^-{3,}$/gm, '──────────')
    .replace(/\n{3,}/g, '\n\n').trim()
}

/** Firma en texto plano: nombre, cargo, teléfono, web y enlace de baja. */
export const firmaTexto = (urlBaja: string) => [
  '--',
  'Danny Wong',
  'Dirección de proyectos · Innovapp',
  'Tel. y WhatsApp: +34 684 90 21 96',
  'https://innovapp.es',
  '',
  'Recibes este correo porque te suscribiste a las novedades de Innovapp.',
  `Darte de baja: ${urlBaja}`,
].join('\n')

/** Correo completo de una campaña para un destinatario. `firmaHtml` = contenido de firma-newsletter.html. */
export function componerCorreo(c: { asunto: string; cuerpoMd: string }, d: Destinatario, firmaHtml: string, archivo?: ArchivoCorreo | null) {
  const cuerpo = sustituirVariables(c.cuerpoMd, d, false)
  const firma = firmaHtml.replace(/<!--[\s\S]*?-->\s*/g, '').replace(/\{\{\s*url_baja\s*\}\}/g, esc(d.urlBaja))
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.asunto)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;"><tr><td style="padding:32px 32px 24px;font-family:Arial,Helvetica,sans-serif;">
${markdownAHtml(cuerpo)}
${archivo ? botonDescarga(archivo) : ''}
${firma}
</td></tr></table>
</td></tr></table>
</body></html>`
  const descarga = archivo ? `\n\nDescargar «${archivo.nombre}» (PDF, ${tamano(archivo.bytes)}): ${archivo.url}` : ''
  const text = `${markdownATexto(cuerpo)}${descarga}\n\n${firmaTexto(d.urlBaja)}\n`
  return { asunto: sustituirVariables(c.asunto, d, false), html, text }
}
