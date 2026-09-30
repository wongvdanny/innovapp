import type { Prisma, PrismaClient } from '@prisma/client'

type Db = PrismaClient | Prisma.TransactionClient

/** Quién realiza la acción: usuario del admin, o 'sistema' / 'cron' / 'webhook'. */
export interface Actor {
  usuario: string
  usuarioId?: string | null
  ip?: string | null
}

export const SISTEMA: Actor = { usuario: 'sistema' }

/**
 * Identifica al actor dentro de la transacción: el trigger de cambios de estado de
 * fac_facturas lo lee con current_setting('fac.usuario') para su evento automático.
 */
export async function identificarActor(tx: Prisma.TransactionClient, actor: Actor) {
  await tx.$queryRaw`SELECT set_config('fac.usuario', ${actor.usuario}, true)`
}

export async function registrarEvento(
  db: Db,
  actor: Actor,
  accion: string,
  entidad: string,
  entidadId: string | null,
  payload?: Prisma.InputJsonValue,
) {
  await db.fac_eventos.create({
    data: {
      usuario: actor.usuario,
      usuario_id: actor.usuarioId ?? null,
      ip: actor.ip ?? null,
      accion, entidad, entidad_id: entidadId,
      payload: payload ?? undefined,
    },
  })
}
