import { createHash, randomBytes } from 'crypto'
import { prisma } from '../prisma'
import { fmt2 } from './decimal'
import { hoyMadrid, isoFecha } from './fechas'
import { ACTIVIDAD, CONCEPTO_GASTO } from './informes'
import { ETIQUETAS_CATEGORIA } from './categorias'
import { verificarIntegridad } from './verifactu/integridad'
import { envioAEATImplementado } from './verifactu/envio'
import { listarBackups } from './copias'
import { Actor, registrarEvento } from './eventos'
import { FacturacionError } from './errores'

// Documento para la gestoría, construido SIEMPRE a partir de los datos reales: ajustes,
// configuración de pasarelas, series, cadena VeriFactu, copias y dudas (tabla fac_dudas_gestor).
// Lo usan la página del admin, el PDF y el enlace público de solo lectura.

const fecha = (v: Date | string) => isoFecha(v).split('-').reverse().join('/')

import type { Criterio, Pendiente, DocumentoGestor } from './gestor-tipos'
import { DIAS_ENLACE } from './gestor-tipos'
export type { Criterio, Pendiente, DocumentoGestor }
export { DIAS_ENLACE }

export const FUENTES = [
  { texto: 'Especificaciones de la huella o hash de los registros de facturación, v0.1.2 (AEAT)', url: 'https://www.agenciatributaria.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/Veri-Factu_especificaciones_huella_hash_registros.pdf' },
  { texto: 'Características del QR y servicio de cotejo, v0.5.0 (AEAT)', url: 'https://www.agenciatributaria.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/DetalleEspecificacTecnCodigoQRfactura.pdf' },
  { texto: 'Formato electrónico común de los libros registro del IVA y del IRPF (AEAT)', url: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/Fact_registro/Libros_registro/Formato_Electronico_Comun_Libros_Registro_IVA_IRPF.pdf' },
  { texto: 'Diseños de registro de los libros, LSI.xlsx (AEAT)', url: 'https://sede.agenciatributaria.gob.es/static_files/AEAT/LSI.xlsx' },
  { texto: 'Epígrafes IAE y códigos de actividad, Epigrafes_x_EEDD.xlsx (AEAT)', url: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/Fact_registro/Libros_registro/Epigrafes_x_EEDD.xlsx' },
]

const pasarela = (nombre: string, cfg: { environment: string; enabled: boolean } | null) =>
  !cfg || !cfg.enabled ? `${nombre}: desactivado` : cfg.environment === 'production' ? `${nombre}: en producción (sus cobros se facturan solos)` : `${nombre}: en modo de pruebas (sus cobros no se facturan)`

export async function documentoGestor(): Promise<DocumentoGestor> {
  const hoy = hoyMadrid()
  const anio = +hoy.slice(0, 4)
  const [a, stripe, redsys, series, porEstado, recurrentes, gastosAnio, dudas, integridad] = await Promise.all([
    prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.stripeConfig.findFirst(),
    prisma.redsysConfig.findFirst(),
    prisma.fac_series.findMany({ where: { anio }, orderBy: { codigo: 'asc' } }),
    prisma.fac_facturas.groupBy({ by: ['estado'], _count: true }),
    prisma.fac_recurrentes.count({ where: { activo: true } }),
    prisma.fac_gastos.count({ where: { fecha: { gte: new Date(`${anio}-01-01T00:00:00Z`) } } }),
    prisma.fac_dudas_gestor.findMany({ orderBy: [{ estado: 'asc' }, { orden: 'asc' }] }),
    verificarIntegridad(prisma),
  ])
  const n = (e: string) => porEstado.find(x => x.estado === e)?._count ?? 0
  const emitidas = n('emitida') + n('pagada')
  const copia = (() => { try { return listarBackups()[0] ?? null } catch { return null } })()
  const nombreSerie: Record<string, string> = { F: 'completas', S: 'simplificadas', R: 'rectificativas' }
  const iae = a.iae
  const ret = fmt2(a.retencion_defecto).replace(/\.00$/, '')
  const iva = fmt2(a.iva_defecto).replace(/\.00$/, '')
  const limite = fmt2(a.limite_simplificada).replace('.', ',')
  const abiertas = dudas.filter(d => d.estado === 'abierta').length
  const envio = envioAEATImplementado()

  // Concepto de gasto agrupado por código, con las etiquetas reales de las categorías
  const porCodigo = new Map<string, string[]>()
  for (const [cat, cod] of Object.entries(CONCEPTO_GASTO)) porCodigo.set(cod, [...(porCodigo.get(cod) ?? []), (ETIQUETAS_CATEGORIA[cat] ?? cat).toLowerCase()])
  const conceptos = Array.from(porCodigo.entries()).map(([cod, cats]) => `${cod}: ${cats.join(', ')}`).join(' · ')

  const criterios: Criterio[] = [
    { tema: 'Precio de los planes', aplicado: `IVA incluido. Cuota = redondeo a 2 decimales de total × ${iva}/${100 + Number(iva)}; base = total − cuota, para que la suma cuadre al céntimo con lo cobrado (la cuota puede diferir 0,01 € de base × ${iva} %).`, confirmar: false },
    { tema: 'Retención en cobros online (suscripción SaaS)', aplicado: a.retencion_en_cobros_online ? `Se aplica el ${ret} % a empresas y autónomos residentes en España.` : 'Sin retención: el cliente paga el total con tarjeta.', confirmar: true },
    { tema: 'Retención en facturas manuales', aplicado: `${ret} % a empresas y autónomos residentes en España (editable en cada factura).`, confirmar: true },
    { tema: 'Periodo de declaración', aplicado: 'Fecha de operación; si no la hay, fecha de expedición.', confirmar: false },
    { tema: 'Actividad en los libros', aplicado: `Código ${ACTIVIDAD.codigo}, tipo ${ACTIVIDAD.tipo} (resto de actividades profesionales), epígrafe ${iae}, según la tabla de epígrafes de la AEAT.`, confirmar: true },
    { tema: 'Factura simplificada', aplicado: `Hasta ${limite} € IVA incluido. Por encima, el checkout exige NIF y dirección.`, confirmar: false },
    { tema: 'Vencimiento', aplicado: `${a.dias_vencimiento} días desde la emisión.${a.recordatorios_activos ? ` Recordatorio cada ${a.recordatorio_cada_dias} días, hasta ${a.recordatorio_max} veces.` : ''}`, confirmar: false },
    { tema: 'Clientes fuera de España', aplicado: 'No se facturan automáticamente: se revisan a mano (normalmente «no sujeta por reglas de localización», N2).', confirmar: true },
    { tema: 'Rectificativa por sustitución en los libros', aplicado: 'La factura rectificada en negativo más la nueva, en el periodo de la rectificativa.', confirmar: false },
    { tema: 'Facturas anuladas', aplicado: 'No figuran en los libros ni en los resúmenes.', confirmar: true },
    { tema: 'IVA soportado no deducible', aplicado: 'Se suma al gasto en IRPF.', confirmar: false },
    { tema: 'Concepto de gasto', aplicado: conceptos + '. La cuota de autónomo figura como justificante F6.', confirmar: true },
    { tema: 'Casilla [05] del 130', aplicado: 'Estimada con los resultados positivos de los trimestres anteriores calculados por el sistema.', confirmar: false },
  ]

  const resumen = [
    { titulo: 'Actividad', texto: `Autónomo desde el ${fecha(a.fecha_inicio_actividad)}, IAE ${iae}.` },
    { titulo: 'Numeración', texto: `Series anuales sin huecos (F completas, S simplificadas, R rectificativas); el número se asigna solo al emitir. ${series.length ? `En ${anio}: ${series.map(s => `${s.prefijo}… hasta el nº ${s.ultimo_numero} (${nombreSerie[s.codigo]})`).join('; ')}.` : `Aún no se ha emitido ninguna factura en ${anio}.`}` },
    { titulo: 'Facturas', texto: `${emitidas} emitidas (${n('pagada')} cobradas, ${n('emitida')} pendientes), ${n('anulada')} anuladas y ${n('borrador')} borradores. ${recurrentes} recurrente(s) mensual(es) activa(s).` },
    { titulo: 'Inmutabilidad', texto: 'Una factura emitida no se puede modificar ni borrar: se corrige con rectificativa (R1–R4, o R5 si la original es simplificada), por sustitución o por diferencias. Solo se anula una emitida por error que no se haya entregado ni cobrado.' },
    { titulo: 'Cobros online', texto: `Cada cobro confirmado genera, emite y envía su factura: F1 si hay NIF y dirección; F2 si no y el total es de ${limite} € o menos. ${pasarela('Stripe', stripe)}. ${pasarela('Redsys', redsys)}.` },
    { titulo: 'Gastos', texto: `${gastosAnio} registrado(s) en ${anio}, con adjunto, porcentaje deducible, IVA deducible o no y retención soportada.` },
    { titulo: 'Libros e informes', texto: 'Libros registro unificados de IVA e IRPF en el formato electrónico común de la AEAT (XLSX anual con pestañas EXPEDIDAS_INGRESOS y RECIBIDAS_GASTOS) y CSV por trimestre. Resúmenes orientativos del 303, el 130 y el 390 calculados con las mismas filas.' },
    { titulo: 'Copias de seguridad', texto: copia ? `Diarias, conservadas 30 días. Última: ${fecha(copia.fecha.slice(0, 10))} a las ${copia.fecha.slice(11, 16)}.` : 'Diarias, conservadas 30 días.' },
  ]

  const pendientes: Pendiente[] = [
    { texto: `Huella SHA-256 encadenada por cada alta y anulación (${integridad.registros} registro(s); cadena ${integridad.ok ? 'íntegra' : 'CON ERRORES'} al generar este documento).`, hecho: integridad.ok },
    { texto: 'Elegir modalidad: VERI*FACTU con envío (recomendado) o sistema sin envío, que exige además firma electrónica de cada registro y registro de eventos. Elegida VERI*FACTU, se mantiene todo el año natural.', hecho: a.verifactu_activo },
    { texto: 'Certificado electrónico de persona física para autenticar los envíos.', hecho: !!process.env.VERIFACTU_CERT_PATH },
    { texto: 'Desarrollo del XML de alta y anulación y del cliente de envío (lotes de hasta 1.000 registros, tiempo de espera, subsanación y rechazos).', hecho: envio },
    { texto: 'Declaración responsable del sistema informático (RD 1007/2023); al ser software propio, el productor es el titular.', hecho: false },
    { texto: 'Pruebas en el entorno de pruebas de la AEAT.', hecho: false },
    { texto: 'Activar el modo en Ajustes: las facturas llevarán el QR y la leyenda «Factura verificable en la sede electrónica de la AEAT».', hecho: a.verifactu_activo },
  ]
  const estado = a.verifactu_activo
    ? `Modo VERI*FACTU activo${envio ? '.' : ', pero el envío a la AEAT aún no está implementado.'}`
    : `Modo VERI*FACTU desactivado: se genera la huella encadenada, sin envío a la AEAT${a.qr_no_verifactu ? ' y con QR tributario' : ' y sin QR tributario'}. Según nuestra información, la obligación para autónomos empieza en julio de 2027 (a confirmar).`

  return {
    generado: new Date().toISOString(),
    titulo: `Facturación ${a.nombre_comercial || a.emisor_nombre} — resumen para la gestoría`,
    emisor: { nombre: a.emisor_nombre, nombreComercial: a.nombre_comercial, iae, inicio: fecha(a.fecha_inicio_actividad) },
    lead: `Desde el ${fecha(a.fecha_inicio_actividad)} la facturación se hace con un sistema propio que numera sin huecos, encadena cada registro con la huella de VeriFactu y genera los libros registro en el formato de la AEAT. ${abiertas ? `Quedan ${abiertas} duda(s) abierta(s) y ${criterios.filter(c => c.confirmar).length} criterio(s) por confirmar.` : 'Todas las dudas están resueltas.'}`,
    resumen, criterios,
    verifactu: { estado, pendientes },
    dudas: dudas.map(d => ({ id: d.id, tema: d.tema, pregunta: d.pregunta, respuesta: d.respuesta, estado: d.estado })),
    fuentes: FUENTES,
  }
}

// ── Enlaces de solo lectura para la gestoría ──

const sha = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/ // 32 bytes en base64url

/** Crea un enlace. El token solo se devuelve aquí: en BD queda su SHA-256. */
export async function crearEnlace(actor: Actor, nota?: string) {
  const token = randomBytes(32).toString('base64url')
  const e = await prisma.fac_enlaces_gestor.create({
    data: { token_sha256: sha(token), token_sufijo: token.slice(-6), nota: nota?.trim() || null, creado_por: actor.usuario, expira_at: new Date(Date.now() + DIAS_ENLACE * 86_400_000) },
  })
  await registrarEvento(prisma, actor, 'gestor.enlace_creado', 'gestor', e.id, { sufijo: e.token_sufijo, expira: e.expira_at.toISOString(), nota: e.nota })
  return { id: e.id, token, expira_at: e.expira_at }
}

export async function revocarEnlace(id: string, actor: Actor) {
  const e = await prisma.fac_enlaces_gestor.findUnique({ where: { id } })
  if (!e) throw new FacturacionError('NO_ENCONTRADA', 'Enlace no encontrado')
  if (e.revocado_at) return e
  const r = await prisma.fac_enlaces_gestor.update({ where: { id }, data: { revocado_at: new Date(), revocado_por: actor.usuario } })
  await registrarEvento(prisma, actor, 'gestor.enlace_revocado', 'gestor', id, { sufijo: e.token_sufijo })
  return r
}

/** Valida un token y registra el acceso (válido o no). Devuelve el enlace o null. */
export async function accederConToken(token: string, ip: string | null, userAgent: string | null) {
  const valido = TOKEN_RE.test(token)
  const e = valido ? await prisma.fac_enlaces_gestor.findUnique({ where: { token_sha256: sha(token) } }) : null
  const motivo = !e ? 'desconocido' : e.revocado_at ? 'revocado' : e.expira_at < new Date() ? 'caducado' : null
  const actor = { usuario: 'gestoría (enlace)', ip }
  if (motivo) {
    await registrarEvento(prisma, actor, 'gestor.acceso_denegado', 'gestor', e?.id ?? null, { motivo, sufijo: valido ? token.slice(-6) : null, user_agent: userAgent?.slice(0, 200) ?? null })
    return null
  }
  await prisma.fac_enlaces_gestor.update({ where: { id: e!.id }, data: { accesos: { increment: 1 }, ultimo_acceso_at: new Date() } })
  await registrarEvento(prisma, actor, 'gestor.acceso', 'gestor', e!.id, { sufijo: e!.token_sufijo, user_agent: userAgent?.slice(0, 200) ?? null })
  return e
}
