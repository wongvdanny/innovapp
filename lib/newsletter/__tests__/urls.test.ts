import { describe, it, expect, vi, afterEach } from 'vitest'
import { comprobarUrlsProduccion, problemasUrls } from '../../urls-produccion'

describe('URLs de producción', () => {
  it('localhost, 127.x, ::1 o sin https → problema', () => {
    expect(problemasUrls({ NEXTAUTH_URL: 'http://localhost:3001' })[0]).toMatch(/NEXTAUTH_URL apunta a localhost/)
    expect(problemasUrls({ NEWSLETTER_BASE_URL: 'https://127.0.0.1:3098' })[0]).toMatch(/127\.0\.0\.1/)
    expect(problemasUrls({ NEXT_PUBLIC_SITE_URL: 'http://[::1]:3000' })).toHaveLength(1)
    expect(problemasUrls({ NEWSLETTER_BASE_URL: 'http://innovapp.es' })[0]).toMatch(/no usa https/)
    expect(problemasUrls({ NEXTAUTH_URL: 'no-es-url' })[0]).toMatch(/no es una URL válida/)
    expect(problemasUrls({ NEXTAUTH_URL: 'https://innovapp.es', NEWSLETTER_BASE_URL: 'https://innovapp.es' })).toEqual([])
  })
  it('solo en producción y salvo PERMITIR_URLS_LOCALES=1', () => {
    const mal = { NEXTAUTH_URL: 'http://localhost:3001' }
    expect(comprobarUrlsProduccion({ ...mal, NODE_ENV: 'development' })).toEqual([])
    expect(comprobarUrlsProduccion({ ...mal, NODE_ENV: 'production' })).toHaveLength(1)
    expect(comprobarUrlsProduccion({ ...mal, NODE_ENV: 'production', PERMITIR_URLS_LOCALES: '1' })).toEqual([])
  })
})

describe('enlaces de los correos sin NEWSLETTER_BASE_URL', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })
  it('baja, List-Unsubscribe y descargas usan https://innovapp.es', async () => {
    vi.stubEnv('NEWSLETTER_BASE_URL', '')
    vi.resetModules()
    const e = await import('../envio')
    const t = 'f'.repeat(64)
    expect(e.BASE_URL).toBe('https://innovapp.es')
    expect(e.urlBaja(t)).toBe(`https://innovapp.es/newsletter/baja?t=${t}`)
    expect(e.cabecerasBaja(t)['List-Unsubscribe']).toBe(`<https://innovapp.es/api/newsletter/baja?t=${t}>`)
  })
  it('en producción se niega a enviar si la base apunta a localhost', async () => {
    vi.stubEnv('NEWSLETTER_BASE_URL', 'http://localhost:3098')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PERMITIR_URLS_LOCALES', '')
    vi.resetModules()
    const e = await import('../envio')
    await expect(e.enviarPrueba({ asunto: 'A', cuerpo_md: 'x' }, 'x@y.es')).rejects.toThrow(/No se envía: NEWSLETTER_BASE_URL apunta a localhost/)
  })
})
