import fs from 'fs'
import path from 'path'
import { prisma } from '../prisma'
import { generarPdfFactura, FacturaPdf } from './pdf/factura'
import { rutaAbsoluta, escribirArchivo } from './storage'
import { FacturacionError } from './errores'

// PDF de facturas: el de una factura emitida se genera una vez, se guarda en
// storage/facturacion/facturas/<año>/<número>.pdf y pdf_path queda fijado (trigger).
// Los borradores solo tienen vista previa (marca de agua, no se guarda).

async function cargar(id: string) {
  const f = await prisma.fac_facturas.findUnique({
    where: { id },
    include: {
      fac_lineas: { orderBy: { orden: 'asc' } },
      fac_facturas: { select: { num_serie_factura: true, fecha_expedicion: true } },
      fac_clientes: true,
    },
  })
  if (!f) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  return { f, ajustes }
}

function aDatosPdf(f: Awaited<ReturnType<typeof cargar>>['f'], ajustes: any): FacturaPdf {
  const borrador = f.estado === 'borrador'
  return {
    ...f,
    // En vista previa los datos salen de ajustes y cliente actuales (aún no hay snapshot)
    emisor_snapshot: f.emisor_snapshot ?? { nombre: ajustes.emisor_nombre, nombre_comercial: ajustes.nombre_comercial, nif: ajustes.nif, direccion: ajustes.direccion, cp: ajustes.cp, municipio: ajustes.municipio, provincia: ajustes.provincia, pais: ajustes.pais, email: ajustes.email, telefono: ajustes.telefono },
    cliente_snapshot: borrador && f.fac_clientes ? f.fac_clientes : f.cliente_snapshot,
    rectificada: f.fac_facturas,
  } as FacturaPdf
}

const nombreArchivo = (num: string) => `${num.replace(/[^\w.-]+/g, '_')}.pdf`

/** Devuelve la ruta relativa del PDF de una factura emitida, generándolo si aún no existe. */
export async function asegurarPdf(id: string): Promise<string> {
  const { f, ajustes } = await cargar(id)
  if (f.estado === 'borrador' || !f.num_serie_factura || !f.fecha_expedicion)
    throw new FacturacionError('ESTADO_INVALIDO', 'Los borradores no tienen PDF definitivo')

  const relativa = f.pdf_path ?? path.join('facturas', String(f.fecha_expedicion.getUTCFullYear()), nombreArchivo(f.num_serie_factura))
  if (fs.existsSync(rutaAbsoluta(relativa))) {
    if (!f.pdf_path) await prisma.fac_facturas.updateMany({ where: { id, pdf_path: null }, data: { pdf_path: relativa } })
    return relativa
  }
  const pdf = await generarPdfFactura(aDatosPdf(f, ajustes), {
    iban: ajustes.iban, textoPie: ajustes.texto_pie,
    logoPath: (f.emisor_snapshot as any)?.logo_path ?? ajustes.logo_path,
    qrNoVerifactu: ajustes.qr_no_verifactu,
  })
  try {
    escribirArchivo(relativa, pdf)
  } catch (e: any) {
    if (e.code !== 'EEXIST') throw e // otra petición lo generó a la vez: vale el que ya está
  }
  if (!f.pdf_path) await prisma.fac_facturas.updateMany({ where: { id, pdf_path: null }, data: { pdf_path: relativa } })
  return relativa
}

export async function leerPdf(id: string): Promise<{ nombre: string; datos: Buffer }> {
  const relativa = await asegurarPdf(id)
  const f = await prisma.fac_facturas.findUniqueOrThrow({ where: { id }, select: { num_serie_factura: true } })
  return { nombre: nombreArchivo(f.num_serie_factura!), datos: fs.readFileSync(rutaAbsoluta(relativa)) }
}

/** Vista previa de un borrador: marca de agua "BORRADOR", sin número ni QR, no se guarda. */
export async function pdfVistaPrevia(id: string): Promise<Buffer> {
  const { f, ajustes } = await cargar(id)
  if (f.estado !== 'borrador') throw new FacturacionError('ESTADO_INVALIDO', 'Solo los borradores tienen vista previa')
  return generarPdfFactura(aDatosPdf(f, ajustes), { iban: ajustes.iban, textoPie: ajustes.texto_pie, logoPath: ajustes.logo_path, vistaPrevia: true })
}
