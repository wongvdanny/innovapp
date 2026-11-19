import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { markdownAHtml, markdownATexto, sustituirVariables, componerCorreo, firmaTexto } from '../contenido'
import { validarImportacion, parsearCsv, csv } from '../csv'
import { normalizarCampana } from '../campanas'
import { nombreSeguro } from '../archivos'
import { TEXTO_CONSENTIMIENTO_WEB } from '../tipos'

const firma = fs.readFileSync(path.join(__dirname, '..', 'firma-newsletter.html'), 'utf8')
const URL_BAJA = 'https://innovapp.es/newsletter/baja?t=' + 'a'.repeat(64)

describe('markdown', () => {
  it('títulos, párrafos, listas, negrita, cursiva y enlaces', () => {
    const h = markdownAHtml('# Hola\n\nUn **gran** cambio y *otro*.\nSegunda línea\n\n- uno\n- dos\n\n1. a\n2. b\n\n[web](https://innovapp.es)')
    expect(h).toContain('<h1')
    expect(h).toContain('<strong>gran</strong>')
    expect(h).toContain('<em>otro</em>')
    expect(h).toContain('cambio y <em>otro</em>.<br>Segunda línea')
    expect(h).toMatch(/<ul[^>]*><li[^>]*>uno<\/li><li[^>]*>dos<\/li><\/ul>/)
    expect(h).toMatch(/<ol/)
    expect(h).toContain('<a href="https://innovapp.es"')
  })
  it('escapa HTML y no admite enlaces javascript:', () => {
    const h = markdownAHtml('<script>alert(1)</script> [x](javascript:alert(1))')
    expect(h).not.toContain('<script>')
    expect(h).toContain('&lt;script&gt;')
    expect(h).not.toContain('href="javascript')
  })
  it('texto plano: enlaces como «texto (url)» y sin marcas', () => {
    expect(markdownATexto('# Novedad\n\nVer **esto** en [la web](https://innovapp.es)')).toBe('NOVEDAD\n\nVer esto en la web (https://innovapp.es)')
  })
})

describe('variables', () => {
  it('{{nombre}} y {{empresa}} con dato', () => {
    expect(sustituirVariables('Hola {{nombre}} de {{ empresa }}', { nombre: 'Ana', empresa: 'Inmo SL' }, false)).toBe('Hola Ana de Inmo SL')
  })
  it('vacías: se quita también la coma o el espacio que las acompaña', () => {
    const vacio = { nombre: null, empresa: '  ' }
    const casos: [string, string][] = [
      ['Hola, {{nombre}}:', 'Hola:'],
      ['Hola {{nombre}},', 'Hola,'],
      ['Hola {{ nombre }}:', 'Hola:'],
      ['{{nombre}}, te escribo porque…', 'te escribo porque…'],
      ['Línea 1\n{{nombre}}, te escribo', 'Línea 1\nte escribo'],
      ['Novedades para {{empresa}}', 'Novedades para'],
      ['Hola, {{nombre}}, ¿qué tal en {{empresa}}?', 'Hola, ¿qué tal en?'],
    ]
    for (const [entra, sale] of casos) expect(sustituirVariables(entra, vacio, false)).toBe(sale)
  })
  it('vacías en el correo completo: asunto, HTML y texto', () => {
    const m = componerCorreo({ asunto: 'Novedades para {{empresa}}', cuerpoMd: 'Hola, {{nombre}}:\n\nTexto.' }, { nombre: '', empresa: null, urlBaja: URL_BAJA }, firma)
    expect(m.asunto).toBe('Novedades para')
    expect(m.text.startsWith('Hola:\n\nTexto.')).toBe(true)
    expect(m.html).toContain('>Hola:</p>')
  })
  it('un nombre con HTML no se cuela en el correo', () => {
    const m = componerCorreo({ asunto: 'Hola {{nombre}}', cuerpoMd: 'Hola {{nombre}}' }, { nombre: '<img src=x onerror=1>', urlBaja: URL_BAJA }, firma)
    expect(m.html).not.toContain('<img src=x')
    expect(m.asunto).toBe('Hola <img src=x onerror=1>')   // el asunto es texto, no HTML
  })
})

describe('correo completo', () => {
  const m = componerCorreo({ asunto: 'Novedades de {{empresa}}', cuerpoMd: 'Hola {{nombre}},\n\nNovedades.' }, { nombre: 'Laura', empresa: 'Inmo SL', urlBaja: URL_BAJA }, firma)
  it('firma con {{url_baja}} sustituido y sin el comentario de la plantilla', () => {
    expect(m.html).toContain(`href="${URL_BAJA}"`)
    expect(m.html).not.toContain('{{url_baja}}')
    expect(m.html).not.toContain('Sustituir {{url_baja}}')
    expect(m.html).toContain('Dirección de proyectos · Innovapp')
    expect(m.asunto).toBe('Novedades de Inmo SL')
  })
  it('texto plano con nombre, cargo, teléfono, web y enlace de baja', () => {
    for (const x of ['Hola Laura,', 'Danny Wong', 'Dirección de proyectos · Innovapp', '+34 684 90 21 96', 'https://innovapp.es', `Darte de baja: ${URL_BAJA}`]) expect(m.text).toContain(x)
    expect(firmaTexto('U')).toMatch(/Darte de baja: U$/)
  })
  it('sin píxel de seguimiento: la única imagen es el logo de la firma', () => {
    expect(m.html.match(/<img /g)?.length).toBe(1)
    expect(m.html).toContain('https://innovapp.es/firma/logo-firma.png')
  })
})

describe('CSV', () => {
  const ahora = new Date('2026-11-19T10:00:00Z')
  it('separador «;» o «,», BOM y comillas', () => {
    expect(parsearCsv(String.fromCharCode(0xfeff) + 'a;b\n"x;y";"di ""hola"""')).toEqual([['a', 'b'], ['x;y', 'di "hola"']])
    expect(parsearCsv('a,b\r\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })
  it('sin columna de consentimiento: error', () => {
    expect(validarImportacion('email;nombre\nana@x.es;Ana', ahora)).toEqual({ error: expect.stringContaining('consentimiento') })
  })
  it('filas sin consentimiento, emails malos y repetidos se rechazan', () => {
    const r = validarImportacion('Email;Nombre;Sector;Consentimiento;Consentimiento_fecha\nANA@x.es;Ana;Inmobiliaria;Reunión 10/11;10/11/2026\nluis@x.es;Luis;;;\nmalo;;;;x\nana@x.es;Ana;;otra vez;', ahora) as any
    expect(r.validas).toHaveLength(1)
    expect(r.validas[0]).toMatchObject({ email: 'ana@x.es', sector: 'inmobiliaria', consentimiento: 'Reunión 10/11' })
    expect(r.validas[0].fecha.toISOString().slice(0, 10)).toBe('2026-11-10')
    expect(r.rechazadas.map((x: any) => x.linea)).toEqual([3, 4, 5])
    expect(r.rechazadas[0].motivo).toContain('Sin consentimiento')
  })
  it('exporta con BOM y escapa «;»', () => {
    const t = csv(['a', 'b'], [['x;y', null]])
    expect(t.charCodeAt(0)).toBe(0xfeff)
    expect(t).toContain('"x;y";')
  })
})

describe('campañas y consentimiento', () => {
  it('normaliza campos y descarta sectores desconocidos', () => {
    expect(normalizarCampana({ asunto: ' Hola ', cuerpo_md: 'x', sectores: ['ecommerce', 'nada', 'ecommerce'], estado: 'enviada' }))
      .toEqual({ asunto: 'Hola', cuerpo_md: 'x', sectores: ['ecommerce'] })
    expect(() => normalizarCampana({ asunto: '  ' })).toThrow()
  })
  it('el texto de la casilla cubre recibir novedades de Innovapp y enlaza la privacidad', () => {
    expect(TEXTO_CONSENTIMIENTO_WEB).toContain('Quiero recibir por email novedades de Innovapp')
    expect(TEXTO_CONSENTIMIENTO_WEB.split('política de privacidad')).toHaveLength(2)
  })
})

describe('PDF de la campaña', () => {
  const archivo = { nombre: 'Guía «IA» inmobiliarias.pdf', url: 'https://innovapp.es/api/newsletter/archivo/x?e=y', bytes: 1572864 }
  const m = componerCorreo({ asunto: 'A', cuerpoMd: 'Hola.' }, { urlBaja: URL_BAJA }, firma, archivo)
  it('botón «Descargar» con tamaño, antes de la firma, y línea en el texto plano', () => {
    expect(m.html).toContain('href="https://innovapp.es/api/newsletter/archivo/x?e=y"')
    expect(m.html).toContain('Descargar «Guía «IA» inmobiliarias.pdf» (PDF, 1,5 MB)')
    expect(m.html.indexOf('Descargar «')).toBeLessThan(m.html.indexOf('Danny Wong'))
    expect(m.text).toContain('Descargar «Guía «IA» inmobiliarias.pdf» (PDF, 1,5 MB): https://innovapp.es/api/newsletter/archivo/x?e=y')
  })
  it('sin PDF no hay botón', () => {
    expect(componerCorreo({ asunto: 'A', cuerpoMd: 'Hola.' }, { urlBaja: URL_BAJA }, firma).html).not.toContain('Descargar «')
  })
  it('nombre de archivo seguro: sin rutas ni comillas, siempre .pdf', () => {
    expect(nombreSeguro('../../etc/pass"wd')).toBe('passwd.pdf')
    expect(nombreSeguro('Informe.PDF')).toBe('Informe.PDF')
    expect(nombreSeguro('')).toBe('documento.pdf')
  })
})

describe('texto alternativo {{variable|alternativa}}', () => {
  it('sin dato usa la alternativa; con dato, el dato', () => {
    const f = 'inmobiliarias como {{empresa|la tuya}}.'
    expect(sustituirVariables(f, { empresa: null }, false)).toBe('inmobiliarias como la tuya.')
    expect(sustituirVariables(f, { empresa: 'Inmo Norte' }, false)).toBe('inmobiliarias como Inmo Norte.')
    expect(sustituirVariables('Hola, {{ nombre | amigo }}:', { nombre: '' }, false)).toBe('Hola, amigo:')
  })
})
