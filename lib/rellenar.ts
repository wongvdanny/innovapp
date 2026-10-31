// Marca de dato pendiente en data/*.ts. Un campo con este valor (o vacío) no se pinta en la web.
export const RELLENAR = '[RELLENAR]'

export function tieneValor(valor?: string | null): valor is string {
  return !!valor && valor.trim() !== '' && valor.trim() !== RELLENAR
}
