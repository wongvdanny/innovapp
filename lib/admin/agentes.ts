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
