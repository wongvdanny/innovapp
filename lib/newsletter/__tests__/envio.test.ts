import { describe, it, expect } from 'vitest'
import { cabecerasBaja, urlBaja, urlBajaOneClick } from '../envio'

describe('baja con un clic (RFC 8058)', () => {
  it('List-Unsubscribe apunta al POST de baja y List-Unsubscribe-Post lleva One-Click', () => {
    const t = 'b'.repeat(64)
    const h = cabecerasBaja(t)
    expect(h['List-Unsubscribe']).toBe(`<${urlBajaOneClick(t)}>`)
    expect(h['List-Unsubscribe']).toMatch(/^<https?:\/\/[^>]+\/api\/newsletter\/baja\?t=b{64}>$/)
    expect(h['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(urlBaja(t)).toMatch(/\/newsletter\/baja\?t=b{64}$/)
  })
})
