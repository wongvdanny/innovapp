import { FacturacionError } from '../facturacion/errores'
import { esSector, Sector } from './tipos'
import { variablesDesconocidas } from './contenido'

/** Campos editables de una campaña (nunca req.body tal cual). */
export function normalizarCampana(b: any): { asunto: string; cuerpo_md: string; sectores: Sector[] } {
  const asunto = typeof b?.asunto === 'string' ? b.asunto.trim().slice(0, 200) : ''
  if (!asunto) throw new FacturacionError('DATOS_INVALIDOS', 'La campaña necesita un asunto')
  const cuerpo_md = typeof b?.cuerpo_md === 'string' ? b.cuerpo_md.slice(0, 100_000) : ''
  const malas = variablesDesconocidas(`${asunto}\n${cuerpo_md}`)
  if (malas.length) throw new FacturacionError('DATOS_INVALIDOS', `Variable no válida: ${malas.join(', ')}. Solo se admiten {{nombre}} y {{empresa}} (también con alternativa, p. ej. {{empresa|la tuya}})`)
  const sectores = Array.isArray(b?.sectores) ? Array.from(new Set(b.sectores.filter(esSector))) as Sector[] : []
  return { asunto, cuerpo_md, sectores }
}
