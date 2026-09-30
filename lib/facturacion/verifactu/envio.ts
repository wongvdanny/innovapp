import type { fac_registros_verifactu } from '@prisma/client'

// Remisión de registros a la AEAT (VERI*FACTU). NO IMPLEMENTADO.
// La implementación real será un cliente SOAP (servicio SuministroLR) autenticado con
// certificado electrónico, que envíe lotes de hasta 1000 registros respetando el
// tiempo de espera que devuelve la AEAT entre envíos, y actualice estado_envio,
// csv_aeat, respuesta_aeat e intentos en fac_registros_verifactu.

export type EstadoEnvio = 'enviado' | 'aceptado' | 'aceptado_con_errores' | 'rechazado'

export interface ResultadoEnvio {
  registroId: bigint
  estado: EstadoEnvio
  csv?: string
  codigoError?: string
  descripcionError?: string
  respuesta?: unknown
}

export interface EnvioAEAT {
  /** Envía los registros (ya con XML generado) y devuelve el resultado de cada uno. */
  enviar(registros: fac_registros_verifactu[]): Promise<ResultadoEnvio[]>
  /** Segundos que la AEAT exige esperar antes del siguiente envío. */
  tiempoEsperaSegundos(): number
}

export class EnvioAEATNoImplementado implements EnvioAEAT {
  async enviar(): Promise<ResultadoEnvio[]> {
    throw new Error('Envío a la AEAT no implementado: los registros quedan en estado "pendiente"')
  }
  tiempoEsperaSegundos() { return 60 }
}

/** Cliente de envío en uso. Al implementar el real, devolverlo aquí. */
export function clienteEnvioAEAT(): EnvioAEAT {
  return new EnvioAEATNoImplementado()
}

export const envioAEATImplementado = () => !(clienteEnvioAEAT() instanceof EnvioAEATNoImplementado)
