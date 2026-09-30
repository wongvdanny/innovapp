import { describe, it, expect } from 'vitest'
import { calcularLinea, calcularTotales, desglosarIvaIncluido } from '../calculos'
import { fmt2, eur } from '../decimal'
import { validarNifEspanol, validarNifIva, normalizarNif, paisIso, aplicaRetencionPorDefecto } from '../validacion'
import { fechaHoraHuso, hoyMadrid, ddmmaaaa, sumarDias } from '../fechas'
import { urlCotejo } from '../verifactu/qr'
import { serieDeTipo, formatearNumSerie } from '../numeracion'

const s = (l: { base: any; cuota: any }) => [fmt2(l.base), fmt2(l.cuota)]

describe('cálculo de líneas', () => {
  it('base y cuota redondeadas por línea', () => {
    expect(s(calcularLinea({ cantidad: 3, precio_unitario: '33.333', tipo_iva: 21 }))).toEqual(['100.00', '21.00'])
  })
  it('redondeo half-up, no bancario', () => {
    expect(s(calcularLinea({ cantidad: 1, precio_unitario: '0.125', tipo_iva: 0 }))[0]).toBe('0.13')
    expect(s(calcularLinea({ cantidad: 1, precio_unitario: '10.50', tipo_iva: 21 }))[1]).toBe('2.21') // 2.205
  })
  it('sin errores de coma flotante', () => {
    expect(s(calcularLinea({ cantidad: 3, precio_unitario: '0.1', tipo_iva: 21 }))).toEqual(['0.30', '0.06'])
  })
  it('descuento por línea', () => {
    expect(s(calcularLinea({ cantidad: 2, precio_unitario: 100, descuento_pct: 15, tipo_iva: 21 }))).toEqual(['170.00', '35.70'])
  })
  it('cantidades negativas (rectificativas por diferencias)', () => {
    expect(s(calcularLinea({ cantidad: -1, precio_unitario: 100, tipo_iva: 21 }))).toEqual(['-100.00', '-21.00'])
  })
})

describe('totales y retención', () => {
  const lineas = [calcularLinea({ cantidad: 1, precio_unitario: 1000, tipo_iva: 21 }), calcularLinea({ cantidad: 1, precio_unitario: '250.55', tipo_iva: 21 })]
  it('retención 7 % (nuevo autónomo)', () => {
    const t = calcularTotales(lineas, 7)
    expect([t.base_imponible, t.cuota_iva, t.importe_total, t.cuota_retencion, t.liquido_a_cobrar].map(fmt2))
      .toEqual(['1250.55', '262.62', '1513.17', '87.54', '1425.63'])
  })
  it('retención 15 %', () => {
    expect(fmt2(calcularTotales(lineas, 15).cuota_retencion)).toBe('187.58')
  })
  it('sin retención', () => {
    const t = calcularTotales(lineas)
    expect(fmt2(t.liquido_a_cobrar)).toBe(fmt2(t.importe_total))
  })
})

describe('desglose de precio con IVA incluido (cobros online)', () => {
  it.each(['1.99', '49', '99', '490', '990', '29.99', '0.01', '12345.67'])('%s €: base + cuota = total exacto', total => {
    const d = desglosarIvaIncluido(total, 21)
    expect(fmt2(d.base.plus(d.cuota))).toBe(fmt2(total))
    expect(d.base.times('0.21').minus(d.cuota).abs().lessThanOrEqualTo('0.01')).toBe(true)
  })
  it('49 € → 40,50 + 8,50 · 99 € → 81,82 + 17,18', () => {
    expect(s(desglosarIvaIncluido(49, 21))).toEqual(['40.50', '8.50'])
    expect(s(desglosarIvaIncluido(99, 21))).toEqual(['81.82', '17.18'])
  })
})

describe('NIF / NIE / CIF', () => {
  it.each([
    ['12345678Z', 'DNI'], ['00000000T', 'DNI'], ['89890001K', 'DNI'],
    ['X1234567L', 'NIE'], ['Y1234567X', 'NIE'], ['Z1234567R', 'NIE'],
    ['B12345674', 'CIF'], ['A58818501', 'CIF'], ['Q2826000H', 'CIF'],
  ])('%s válido (%s)', (nif, tipo) => {
    expect(validarNifEspanol(nif)).toMatchObject({ valido: true, tipo })
  })
  it.each(['12345678A', 'X1234567A', 'B12345675', 'Q2826000A', '1234', ''])('%s inválido', nif => {
    expect(validarNifEspanol(nif).valido).toBe(false)
  })
  it('normaliza espacios, guiones, minúsculas y prefijo ES', () => {
    expect(normalizarNif(' es-12.345.678-z ')).toBe('12345678Z')
    expect(validarNifEspanol('b-1234567 4').valido).toBe(true)
  })
  it('NIF-IVA comunitario', () => {
    expect(validarNifIva('DE123456789').valido).toBe(true)
    expect(validarNifIva('FR12345678901').valido).toBe(true)
    expect(validarNifIva('ESB12345674').valido).toBe(true)
    expect(validarNifIva('DE12345').valido).toBe(false)
    expect(validarNifIva('US123456789').valido).toBe(false)
  })
  it('país del checkout → ISO y retención por defecto', () => {
    expect(paisIso('España')).toBe('ES')
    expect(paisIso('México')).toBe('MX')
    expect(paisIso('Narnia')).toBeNull()
    expect(aplicaRetencionPorDefecto('empresa', 'ES')).toBe(true)
    expect(aplicaRetencionPorDefecto('autonomo', 'ES')).toBe(true)
    expect(aplicaRetencionPorDefecto('particular', 'ES')).toBe(false)
    expect(aplicaRetencionPorDefecto('empresa', 'FR')).toBe(false)
  })
})

describe('fechas (Europe/Madrid)', () => {
  it('huso de invierno y de verano', () => {
    expect(fechaHoraHuso(new Date('2026-01-15T09:30:05.789Z'))).toBe('2026-01-15T10:30:05+01:00')
    expect(fechaHoraHuso(new Date('2026-07-15T09:30:05Z'))).toBe('2026-07-15T11:30:05+02:00')
  })
  it('cambio de día en Madrid antes que en UTC', () => {
    expect(hoyMadrid(new Date('2026-09-30T22:30:00Z'))).toBe('2026-10-01')
  })
  it('formatos', () => {
    expect(ddmmaaaa('2026-10-01')).toBe('01-10-2026')
    expect(ddmmaaaa(new Date('2026-10-01T00:00:00Z'))).toBe('01-10-2026')
    expect(sumarDias('2026-12-25', 15)).toBe('2027-01-09')
  })
})

describe('QR de cotejo', () => {
  it('VeriFactu en producción', () => {
    expect(urlCotejo({ nif: '89890001K', numSerie: '12345678/G33', fechaExpedicion: '2024-01-01', importeTotal: '241.4', verifactu: true, entorno: 'produccion' }))
      .toBe('https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678%2FG33&fecha=01-01-2024&importe=241.40')
  })
  it('no VeriFactu en pruebas y URL encoding de &', () => {
    expect(urlCotejo({ nif: '89890001K', numSerie: '12345678&G33', fechaExpedicion: '2024-01-01', importeTotal: 241.4, verifactu: false, entorno: 'pruebas' }))
      .toBe('https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu?nif=89890001K&numserie=12345678%26G33&fecha=01-01-2024&importe=241.40')
  })
})

describe('series', () => {
  it('serie según tipo de factura', () => {
    expect(['F1', 'F2', 'F3', 'R1', 'R5'].map(serieDeTipo)).toEqual(['F', 'S', 'F', 'R', 'R'])
  })
  it('formato del número', () => {
    expect(formatearNumSerie('F2026-', 7)).toBe('F2026-0007')
    expect(formatearNumSerie('F2026-', 12345)).toBe('F2026-12345')
  })
  it('importe para mostrar', () => {
    expect(eur('1234567.5')).toBe('1.234.567,50 €')
    expect(eur(-21)).toBe('-21,00 €')
  })
})
