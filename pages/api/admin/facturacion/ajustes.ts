import { prisma } from '../../../../lib/prisma'
import { adminApi, texto } from '../../../../lib/facturacion/api'
import { validarNifEspanol } from '../../../../lib/facturacion/validacion'
import { FacturacionError } from '../../../../lib/facturacion/errores'
import { registrarEvento } from '../../../../lib/facturacion/eventos'

const TEXTOS = ['emisor_nombre', 'nombre_comercial', 'direccion', 'cp', 'municipio', 'provincia', 'email', 'telefono', 'texto_pie'] as const
const BOOLEANOS = ['retencion_en_cobros_online', 'recordatorios_activos', 'verifactu_activo', 'qr_no_verifactu'] as const
const ENTEROS = ['dias_vencimiento', 'recordatorio_cada_dias', 'recordatorio_max'] as const
const DECIMALES = ['iva_defecto', 'retencion_defecto', 'limite_simplificada'] as const

function normalizarIban(v: string) {
  const s = v.toUpperCase().replace(/\s/g, '')
  if (!s) return ''
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) throw new FacturacionError('DATOS_INVALIDOS', 'IBAN con formato no válido')
  // Dígitos de control ISO 13616 (mod 97)
  const reord = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55))
  let resto = 0
  for (const ch of reord) resto = (resto * 10 + +ch) % 97
  if (resto !== 1) throw new FacturacionError('DATOS_INVALIDOS', 'IBAN incorrecto (dígitos de control)')
  return s.replace(/(.{4})/g, '$1 ').trim()
}

export default adminApi({
  GET: async () => prisma.fac_ajustes.findUnique({ where: { id: 1 } }),
  PUT: async (req, _res, actor) => {
    const b = req.body || {}
    const antes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
    const data: Record<string, unknown> = {}
    for (const k of TEXTOS) if (k in b) data[k] = texto(b[k])
    for (const k of BOOLEANOS) if (k in b) data[k] = b[k] === true
    for (const k of ENTEROS) if (k in b) {
      const n = parseInt(String(b[k]), 10)
      if (!Number.isFinite(n) || n < 0 || n > 365) throw new FacturacionError('DATOS_INVALIDOS', `${k} no válido`)
      data[k] = n
    }
    for (const k of DECIMALES) if (k in b) {
      const s = String(b[k]).replace(',', '.').trim()
      if (!/^\d+(\.\d+)?$/.test(s)) throw new FacturacionError('DATOS_INVALIDOS', `${k} no válido`)
      data[k] = s
    }
    if ('nif' in b) {
      const nif = texto(b.nif)
      if (nif) {
        const r = validarNifEspanol(nif)
        if (!r.valido) throw new FacturacionError('DATOS_INVALIDOS', `NIF no válido: ${r.error}`)
        data.nif = r.normalizado
      } else data.nif = ''
    }
    if ('iban' in b) data.iban = normalizarIban(texto(b.iban))
    if ('pais' in b && texto(b.pais) !== 'ES') throw new FacturacionError('DATOS_INVALIDOS', 'El emisor debe estar en España')

    const despues = await prisma.fac_ajustes.update({ where: { id: 1 }, data: { ...data, updated_at: new Date() } })
    const cambios = Object.fromEntries(Object.keys(data)
      .filter(k => String((antes as any)[k]) !== String((despues as any)[k]))
      .map(k => [k, { de: String((antes as any)[k]), a: String((despues as any)[k]) }]))
    if (Object.keys(cambios).length) await registrarEvento(prisma, actor, 'ajustes.actualizados', 'ajustes', '1', cambios)
    return despues
  },
})
