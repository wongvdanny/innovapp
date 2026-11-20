import { prisma } from './prisma'

// Transferencia bancaria: la suscripción queda 'pending' hasta que el admin confirma
// el ingreso (Activar en /admin/clientes), que la aprovisiona y factura vía fulfillInvoice.

export interface DatosTransferencia {
  titular: string
  iban: string
  bic: string
  banco: string
  instrucciones: string
  diasPlazo: number
}

export const normalizarIban = (iban: string) => (iban || '').replace(/\s+/g, '').toUpperCase()

/** IBAN agrupado de 4 en 4 para mostrarlo/copiarlo con comodidad. */
export const formatearIban = (iban: string) => normalizarIban(iban).replace(/(.{4})/g, '$1 ').trim()

/** Validación de IBAN (longitud básica + dígitos de control mod 97). */
export function ibanValido(iban: string) {
  const s = normalizarIban(iban)
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false
  const reord = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55))
  let resto = 0
  for (const d of reord) resto = (resto * 10 + Number(d)) % 97
  return resto === 1
}

/** Concepto que el cliente debe indicar en la transferencia (estable por suscripción). */
export const referenciaTransferencia = (subscriptionId: string) => `INV-${subscriptionId.slice(-8).toUpperCase()}`

export const transferenciaActiva = (c: { enabled: boolean; titular: string; iban: string } | null | undefined) =>
  !!(c?.enabled && c.titular.trim() && ibanValido(c.iban))

/** Configuración pública (todo es mostrable al cliente; no hay secretos) o null si no está activa. */
export async function datosTransferencia(): Promise<DatosTransferencia | null> {
  const c = await prisma.transferConfig.findFirst()
  if (!c || !transferenciaActiva(c)) return null
  return { titular: c.titular, iban: formatearIban(c.iban), bic: c.bic, banco: c.banco, instrucciones: c.instrucciones, diasPlazo: c.diasPlazo }
}
