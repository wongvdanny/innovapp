import { prisma } from '../prisma'
import { validarNifEspanol, validarNifIva, aplicaRetencionPorDefecto, paisIso } from './validacion'
import { FacturacionError } from './errores'
import { Actor, registrarEvento } from './eventos'
import { texto, textoONull } from './api'

export const TIPOS_CLIENTE = ['empresa', 'autonomo', 'particular'] as const
const PAISES_UE = ['AT','BE','BG','CY','CZ','DE','DK','EE','GR','FI','FR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK']

/** Valida y normaliza los datos de un cliente. `aplica_retencion` se deduce si no se indica. */
export async function normalizarCliente(b: any) {
  const tipo = texto(b.tipo)
  if (!TIPOS_CLIENTE.includes(tipo as any)) throw new FacturacionError('DATOS_INVALIDOS', 'Tipo de cliente no válido')
  const razon_social = texto(b.razon_social)
  if (!razon_social) throw new FacturacionError('DATOS_INVALIDOS', 'El nombre o razón social es obligatorio')
  const pais = paisIso(texto(b.pais) || 'ES')
  if (!pais) throw new FacturacionError('DATOS_INVALIDOS', 'País no válido (usa el código ISO de 2 letras)')

  let nif = textoONull(b.nif)
  let tipo_id = '01'
  if (nif) {
    if (pais === 'ES') {
      const r = validarNifEspanol(nif)
      if (!r.valido) throw new FacturacionError('DATOS_INVALIDOS', `NIF no válido: ${r.error}`)
      nif = r.normalizado
    } else if (PAISES_UE.includes(pais)) {
      const r = validarNifIva(nif.toUpperCase().startsWith(pais === 'GR' ? 'EL' : pais) ? nif : `${pais === 'GR' ? 'EL' : pais}${nif}`)
      if (!r.valido) throw new FacturacionError('DATOS_INVALIDOS', `NIF-IVA no válido: ${r.error}`)
      nif = r.normalizado
      tipo_id = '02'
    } else {
      nif = nif.toUpperCase()
      tipo_id = texto(b.tipo_id) || '04'
    }
  }

  let user_id: string | null = null
  const userEmail = texto(b.user_email).toLowerCase()
  if (userEmail) {
    const u = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } })
    if (!u) throw new FacturacionError('DATOS_INVALIDOS', `No hay ningún usuario de innovapp con el email ${userEmail}`)
    user_id = u.id
  }

  return {
    tipo, razon_social, pais, nif, tipo_id, user_id,
    nombre_comercial: textoONull(b.nombre_comercial),
    direccion: textoONull(b.direccion), cp: textoONull(b.cp), municipio: textoONull(b.municipio), provincia: textoONull(b.provincia),
    email: textoONull(b.email)?.toLowerCase() ?? null, telefono: textoONull(b.telefono), notas: textoONull(b.notas),
    aplica_retencion: typeof b.aplica_retencion === 'boolean' ? b.aplica_retencion : aplicaRetencionPorDefecto(tipo, pais),
  }
}

async function comprobarNifUnico(nif: string | null, excluirId?: string) {
  if (!nif) return
  const otro = await prisma.fac_clientes.findFirst({ where: { nif, activo: true, ...(excluirId ? { id: { not: excluirId } } : {}) }, select: { razon_social: true } })
  if (otro) throw new FacturacionError('DATOS_INVALIDOS', `Ya existe un cliente con ese NIF: ${otro.razon_social}`)
}

export async function crearCliente(b: any, actor: Actor) {
  const data = await normalizarCliente(b)
  await comprobarNifUnico(data.nif)
  const c = await prisma.fac_clientes.create({ data })
  await registrarEvento(prisma, actor, 'cliente.creado', 'cliente', c.id, { razon_social: c.razon_social, nif: c.nif })
  return c
}

export async function actualizarCliente(id: string, b: any, actor: Actor) {
  const data = await normalizarCliente(b)
  await comprobarNifUnico(data.nif, id)
  const c = await prisma.fac_clientes.update({ where: { id }, data: { ...data, activo: b.activo !== false, updated_at: new Date() } })
  await registrarEvento(prisma, actor, 'cliente.actualizado', 'cliente', id, { razon_social: c.razon_social, nif: c.nif, activo: c.activo })
  return c
}

export function buscarClientes(q: string, incluirInactivos = false, limite = 20) {
  const t = q.trim()
  return prisma.fac_clientes.findMany({
    where: {
      ...(incluirInactivos ? {} : { activo: true }),
      ...(t ? { OR: [
        { razon_social: { contains: t, mode: 'insensitive' } },
        { nombre_comercial: { contains: t, mode: 'insensitive' } },
        { nif: { contains: t.toUpperCase().replace(/[\s-]/g, '') } },
        { email: { contains: t, mode: 'insensitive' } },
      ] } : {}),
    },
    orderBy: { razon_social: 'asc' },
    take: limite,
    include: { User: { select: { email: true } } },
  })
}
