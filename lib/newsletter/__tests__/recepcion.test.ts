import { describe, it, expect } from 'vitest'
import { componerReenvio, debeReenviarse, extraerEmail } from '../recepcion'

const base = { id: 'r1', from: 'Laura Pérez <laura@inmonorte.es>', to: ['novedades@boletin.innovapp.es'], subject: 'Re: Prueba cómo atendería…', replyTo: null, fecha: '2026-11-20T10:00:00Z' }

describe('qué se reenvía', () => {
  it('extrae el email de «Nombre <email>»', () => {
    expect(extraerEmail('Laura <Laura@InmoNorte.es>')).toBe('laura@inmonorte.es')
    expect(extraerEmail('a@b.es')).toBe('a@b.es')
  })
  it('solo lo dirigido al boletín y que no sale de él (sin bucles)', () => {
    expect(debeReenviarse({ from: base.from, to: base.to })).toBe(true)
    expect(debeReenviarse({ from: base.from, to: ['Otro <x@otro-dominio.es>'] })).toBe(false)
    expect(debeReenviarse({ from: 'Innovapp <novedades@boletin.innovapp.es>', to: base.to })).toBe(false)
  })
})

describe('correo de reenvío', () => {
  it('a contacto@, Reply-To = quien escribió y asunto marcado', () => {
    const c = componerReenvio(base, { text: 'Me interesa, llamadme el martes.', html: null, attachments: [] })
    expect(c.to).toBe('contacto@innovapp.es')
    expect(c.replyTo).toBe('laura@inmonorte.es')
    expect(c.from).toBe('Innovapp (boletín) <novedades@boletin.innovapp.es>')
    expect(c.subject).toBe('[Boletín] Re: Prueba cómo atendería…')
    expect(c.text).toContain('De: Laura Pérez <laura@inmonorte.es>')
    expect(c.text).toContain('Me interesa, llamadme el martes.')
    expect(c.attachments).toBeUndefined()
  })
  it('respeta el Reply-To original si lo hay', () => {
    expect(componerReenvio({ ...base, replyTo: ['Comercial <ventas@inmonorte.es>'] }, { text: 'x', attachments: [] }).replyTo).toBe('ventas@inmonorte.es')
  })
  it('escapa los datos en la cabecera HTML y conserva el HTML original', () => {
    const c = componerReenvio({ ...base, from: '<script>@x.es' }, { html: '<p>Hola</p>', attachments: [] })
    expect(c.html).not.toContain('<script>@')
    expect(c.html).toContain('<p>Hola</p>')
    expect(componerReenvio(base, { text: 'a < b', attachments: [] }).html).toContain('a &lt; b')
  })
  it('sin asunto y con adjuntos', () => {
    const c = componerReenvio({ ...base, subject: null }, { text: 'x', attachments: [{ filename: 'plano.pdf', content: 'JVBERi0=', mimeType: 'application/pdf' }] })
    expect(c.subject).toBe('[Boletín] (sin asunto)')
    expect(c.attachments).toEqual([{ filename: 'plano.pdf', content: 'JVBERi0=', contentType: 'application/pdf', contentId: undefined }])
  })
})
