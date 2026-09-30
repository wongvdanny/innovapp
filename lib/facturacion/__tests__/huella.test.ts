import { describe, it, expect } from 'vitest'
import { cadenaAlta, cadenaAnulacion, huellaAlta, huellaAnulacion } from '../verifactu/huella'
import { verificarRegistros, RegistroCadena } from '../verifactu/integridad'

// Ejemplos oficiales: AEAT, «Detalle de las especificaciones técnicas para generación
// de la huella o hash de los registros de facturación», v0.1.2, apartado 6.

const H1 = '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60'
const H2 = 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97'
const H3 = '177547C0D57AC74748561D054A9CEC14B4C4EA23D1BEFD6F2E69E3A388F90C68'

const caso1 = {
  idEmisorFactura: '89890001K', numSerieFactura: '12345678/G33', fechaExpedicionFactura: '01-01-2024',
  tipoFactura: 'F1', cuotaTotal: '12.35', importeTotal: '123.45', huellaAnterior: null,
  fechaHoraHusoGenRegistro: '2024-01-01T19:20:30+01:00',
}
const caso2 = { ...caso1, numSerieFactura: '12345679/G34', huellaAnterior: H1, fechaHoraHusoGenRegistro: '2024-01-01T19:20:35+01:00' }
const caso3 = {
  idEmisorFacturaAnulada: '89890001K', numSerieFacturaAnulada: '12345679/G34', fechaExpedicionFacturaAnulada: '01-01-2024',
  huellaAnterior: H2, fechaHoraHusoGenRegistro: '2024-01-01T19:20:40+01:00',
}

describe('huella VeriFactu — ejemplos oficiales AEAT', () => {
  it('caso 1: primer registro de alta (Huella vacía)', () => {
    expect(cadenaAlta(caso1)).toBe(
      'IDEmisorFactura=89890001K&NumSerieFactura=12345678/G33&FechaExpedicionFactura=01-01-2024&TipoFactura=F1&CuotaTotal=12.35&ImporteTotal=123.45&Huella=&FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00')
    expect(huellaAlta(caso1)).toBe(H1)
  })

  it('caso 2: alta encadenada', () => {
    expect(huellaAlta(caso2)).toBe(H2)
  })

  it('caso 3: anulación encadenada', () => {
    expect(cadenaAnulacion(caso3)).toBe(
      `IDEmisorFacturaAnulada=89890001K&NumSerieFacturaAnulada=12345679/G34&FechaExpedicionFacturaAnulada=01-01-2024&Huella=${H2}&FechaHoraHusoGenRegistro=2024-01-01T19:20:40+01:00`)
    expect(huellaAnulacion(caso3)).toBe(H3)
  })

  it('elimina espacios al inicio y final de cada valor', () => {
    expect(huellaAlta({ ...caso1, numSerieFactura: '  12345678/G33 ', idEmisorFactura: ' 89890001K' })).toBe(H1)
  })

  it('importes: mismo resultado con número, 1 o 2 decimales', () => {
    expect(huellaAlta({ ...caso1, cuotaTotal: 12.35, importeTotal: 123.45 })).toBe(H1)
    const a = huellaAlta({ ...caso1, importeTotal: '123.1' })
    expect(huellaAlta({ ...caso1, importeTotal: '123.10' })).toBe(a)
  })

  it('formato de salida: 64 caracteres hexadecimales en mayúsculas', () => {
    expect(huellaAlta(caso1)).toMatch(/^[0-9A-F]{64}$/)
  })
})

function registro(id: number, tipo: 'alta' | 'anulacion', datos: any, anterior: string | null): RegistroCadena {
  const cadena = tipo === 'alta' ? cadenaAlta({ ...datos, huellaAnterior: anterior }) : cadenaAnulacion({ ...datos, huellaAnterior: anterior })
  const huella = tipo === 'alta' ? huellaAlta({ ...datos, huellaAnterior: anterior }) : huellaAnulacion({ ...datos, huellaAnterior: anterior })
  return {
    id, tipo_registro: tipo, factura_id: `f${id}`,
    id_emisor_factura: datos.idEmisorFactura ?? datos.idEmisorFacturaAnulada,
    num_serie_factura: datos.numSerieFactura ?? datos.numSerieFacturaAnulada,
    fecha_expedicion_factura: datos.fechaExpedicionFactura ?? datos.fechaExpedicionFacturaAnulada,
    tipo_factura: datos.tipoFactura ?? null, cuota_total: datos.cuotaTotal ?? null, importe_total: datos.importeTotal ?? null,
    primer_registro: anterior === null, huella_anterior: anterior, huella,
    fecha_hora_huso_gen_registro: datos.fechaHoraHusoGenRegistro, cadena_huella: cadena,
  }
}

describe('verificación de la cadena', () => {
  const cadena = () => {
    const r1 = registro(1, 'alta', caso1, null)
    const r2 = registro(2, 'alta', caso2, r1.huella)
    const r3 = registro(3, 'anulacion', caso3, r2.huella)
    return [r1, r2, r3]
  }

  it('la cadena oficial reconstruida es íntegra', () => {
    const c = cadena()
    expect(c.map(r => r.huella)).toEqual([H1, H2, H3])
    expect(verificarRegistros(c)).toEqual([])
  })

  it('detecta un importe alterado', () => {
    const c = cadena()
    c[1].importe_total = '999.99'
    const e = verificarRegistros(c)
    expect(e.map(x => x.tipo)).toEqual(expect.arrayContaining(['huella', 'cadena_texto']))
    expect(e.every(x => x.registroId === '2')).toBe(true)
  })

  it('detecta un registro eliminado (encadenamiento roto)', () => {
    const c = cadena()
    const e = verificarRegistros([c[0], c[2]])
    expect(e).toEqual([expect.objectContaining({ registroId: '3', tipo: 'encadenamiento' })])
  })

  it('detecta un registro reordenado o un falso primer registro', () => {
    const c = cadena()
    const e = verificarRegistros([c[1], c[0], c[2]])
    expect(e.map(x => x.tipo)).toEqual(expect.arrayContaining(['primer_registro', 'encadenamiento']))
  })

  it('detecta una huella sustituida aunque se recalcule el registro', () => {
    const c = cadena()
    const falso = registro(2, 'alta', { ...caso2, importeTotal: '1.00' }, c[0].huella)
    const e = verificarRegistros([c[0], falso, c[2]])
    expect(e).toEqual([expect.objectContaining({ registroId: '3', tipo: 'encadenamiento' })])
  })
})
