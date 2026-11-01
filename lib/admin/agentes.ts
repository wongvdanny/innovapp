import { Pool } from 'pg'

// Lectura de agentes_db con el rol innovapp_lectura_agentes (solo SELECT en Negocio, OfertaPago y CuotaPago).
// Columnas explícitas: OfertaPago guarda tokens de acceso y de tarjeta que nunca deben salir de aquí.
const pool = new Pool({ connectionString: process.env.AGENTES_DB_URL, max: 3 })

export interface NegocioAgentes {
  id: string
  name: string
  vertical: string
  estadoServicio: string
  creado: string
  /** Oferta vigente (la más reciente no cancelada). */
  oferta: { estado: string; proveedor: string; mensual: number; esPrueba: boolean } | null
  cobradoPeriodo: number
  cuotasPendientes: number
}

export async function negociosAgentes(desde: Date, hasta: Date): Promise<NegocioAgentes[]> {
  const { rows } = await pool.query(`
    SELECT n.id, n.nombre, n.vertical, n."estadoServicio"::text AS estado_servicio, n."createdAt" AS creado,
           o.estado AS oferta_estado, o.proveedor, o."importeMensualCent" AS mensual_cent, o."esPrueba" AS es_prueba,
           coalesce((SELECT sum(c."importeCent") FROM "CuotaPago" c JOIN "OfertaPago" o2 ON o2.id = c."ofertaPagoId"
                     WHERE o2."negocioId" = n.id AND c.estado = 'pagada' AND NOT c."esPrueba"
                       AND c."pagadaEn" BETWEEN $1 AND $2), 0)::int AS cobrado_cent,
           (SELECT count(*) FROM "CuotaPago" c JOIN "OfertaPago" o2 ON o2.id = c."ofertaPagoId"
             WHERE o2."negocioId" = n.id AND c.estado IN ('pendiente', 'fallida') AND NOT c."esPrueba")::int AS pendientes
    FROM "Negocio" n
    LEFT JOIN LATERAL (
      SELECT estado, proveedor, "importeMensualCent", "esPrueba" FROM "OfertaPago"
      WHERE "negocioId" = n.id AND estado <> 'cancelado' ORDER BY "createdAt" DESC LIMIT 1
    ) o ON true
    ORDER BY n."createdAt"`, [desde, hasta])
  return rows.map(r => ({
    id: r.id,
    name: r.nombre,
    vertical: r.vertical,
    estadoServicio: r.estado_servicio,
    creado: r.creado,
    oferta: r.oferta_estado ? { estado: r.oferta_estado, proveedor: r.proveedor, mensual: r.mensual_cent / 100, esPrueba: r.es_prueba } : null,
    cobradoPeriodo: r.cobrado_cent / 100,
    cuotasPendientes: r.pendientes,
  }))
}

export interface OfertaAgentes { id: string; negocio: string; mensual: number; estado: string; pagadoAt: string | null; canceladoAt: string | null }

/** Ofertas reales (sin pruebas) con su alta y baja, para MRR/altas/bajas de Contabilidad. */
export async function ofertasAgentes(): Promise<OfertaAgentes[]> {
  const { rows } = await pool.query(`
    SELECT o.id, n.nombre AS negocio, o."importeMensualCent" AS mensual_cent, o.estado, o."pagadoAt" AS pagado, o."canceladoAt" AS cancelado
    FROM "OfertaPago" o JOIN "Negocio" n ON n.id = o."negocioId"
    WHERE NOT o."esPrueba"`)
  return rows.map(r => ({
    id: r.id, negocio: r.negocio, mensual: r.mensual_cent / 100, estado: r.estado,
    pagadoAt: r.pagado ? new Date(r.pagado).toISOString().slice(0, 10) : null,
    canceladoAt: r.cancelado ? new Date(r.cancelado).toISOString().slice(0, 10) : null,
  }))
}

export interface CuotaAgentes {
  id: string; negocioId: string; negocio: string; importe: number; pagadaEn: string; periodoDesde: string; periodoHasta: string
  razonSocial: string | null; cif: string | null; direccion: string | null; codigoPostal: string | null; ciudad: string | null; provincia: string | null
  email: string | null
}

/** Cuotas cobradas reales (sin pruebas). Si `ids`, solo esas. */
export async function cuotasPagadasAgentes(ids?: string[]): Promise<CuotaAgentes[]> {
  const { rows } = await pool.query(`
    SELECT c.id, n.id AS negocio_id, n.nombre, c."importeCent" AS importe_cent, c."pagadaEn" AS pagada, c."periodoDesde" AS desde, c."periodoHasta" AS hasta,
           n."razonSocial" AS razon_social, n.cif, n.direccion, n."codigoPostal" AS cp, n.ciudad, n.provincia,
           coalesce(o."emailCliente", n."notificacionEmail") AS email
    FROM "CuotaPago" c JOIN "OfertaPago" o ON o.id = c."ofertaPagoId" JOIN "Negocio" n ON n.id = o."negocioId"
    WHERE c.estado = 'pagada' AND NOT c."esPrueba" AND NOT o."esPrueba" AND c."pagadaEn" IS NOT NULL
      AND ($1::text[] IS NULL OR c.id = ANY($1))
    ORDER BY c."pagadaEn"`, [ids ?? null])
  const dia = (d: Date) => new Date(d).toISOString().slice(0, 10)
  return rows.map(r => ({
    id: r.id, negocioId: r.negocio_id, negocio: r.nombre, importe: r.importe_cent / 100, pagadaEn: dia(r.pagada),
    periodoDesde: dia(r.desde), periodoHasta: dia(r.hasta), razonSocial: r.razon_social, cif: r.cif, direccion: r.direccion,
    codigoPostal: r.cp, ciudad: r.ciudad, provincia: r.provincia, email: r.email,
  }))
}
