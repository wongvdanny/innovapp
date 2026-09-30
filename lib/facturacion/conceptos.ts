import { texto } from './api'
import { FacturacionError } from './errores'

export function datosConcepto(b: any) {
  const descripcion = texto(b.descripcion)
  if (!descripcion) throw new FacturacionError('DATOS_INVALIDOS', 'La descripción es obligatoria')
  const precio = String(b.precio_unitario ?? '0').replace(',', '.').trim()
  if (!/^\d+(\.\d+)?$/.test(precio)) throw new FacturacionError('DATOS_INVALIDOS', 'Precio no válido')
  const iva = String(b.tipo_iva ?? '21')
  if (!['21', '10', '4', '0'].includes(iva)) throw new FacturacionError('DATOS_INVALIDOS', 'Tipo de IVA no válido')
  return { descripcion, precio_unitario: precio, tipo_iva: iva, activo: b.activo !== false }
}
