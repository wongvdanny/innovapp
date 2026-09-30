// Errores de negocio con código estable, para que la UI muestre un mensaje claro
// (p. ej. EMISOR_INCOMPLETO → enlace a Ajustes; USAR_RECTIFICATIVA → botón de rectificar).

export type CodigoError =
  | 'NO_ENCONTRADA'
  | 'ESTADO_INVALIDO'
  | 'EMISOR_INCOMPLETO'
  | 'CLIENTE_INCOMPLETO'
  | 'SIN_LINEAS'
  | 'LINEA_INCOHERENTE'
  | 'IMPORTE_INVALIDO'
  | 'SIMPLIFICADA_SUPERA_LIMITE'
  | 'ANTES_INICIO_ACTIVIDAD'
  | 'FECHA_NO_CORRELATIVA'
  | 'USAR_RECTIFICATIVA'
  | 'COBRO_ONLINE'
  | 'RECTIFICADA_INVALIDA'
  | 'DATOS_INVALIDOS'

export class FacturacionError extends Error {
  constructor(public code: CodigoError, message: string, public meta?: Record<string, unknown>) {
    super(message)
    this.name = 'FacturacionError'
  }
}

export const esFacturacionError = (e: unknown): e is FacturacionError => e instanceof FacturacionError
