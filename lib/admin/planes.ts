// Campos de Plan que se pueden escribir desde el admin (nunca req.body tal cual).
const INTERVALOS = ['monthly', 'yearly', 'month', 'free']

export function datosPlan(b: any, crear: boolean): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {}
  if (b?.name !== undefined) data.name = String(b.name).trim()
  if (b?.description !== undefined) data.description = String(b.description)
  if (b?.price !== undefined) {
    const precio = Number(b.price)
    if (!Number.isFinite(precio) || precio < 0) return { error: 'Precio no válido' }
    data.price = precio
  }
  if (b?.interval !== undefined) {
    if (!INTERVALOS.includes(b.interval)) return { error: 'Intervalo no válido' }
    data.interval = b.interval
  }
  if (b?.features !== undefined) {
    if (!Array.isArray(b.features)) return { error: 'Características no válidas' }
    data.features = b.features.map(String).filter(Boolean)
  }
  if (b?.active !== undefined) data.active = !!b.active
  if (b?.productId !== undefined) data.productId = b.productId ? String(b.productId) : null
  if (crear) {
    if (!data.productId) return { error: 'El plan necesita un producto' }
    if (!data.name) return { error: 'Falta el nombre' }
    if (data.price === undefined) return { error: 'Falta el precio' }
    data.interval ??= 'monthly'
    data.description ??= ''
  }
  if ('productId' in data && !data.productId) return { error: 'El plan necesita un producto' }
  return { data }
}
