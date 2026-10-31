import SeccionPendiente from './SeccionPendiente'
import { SECCIONES_HOME } from './sections'

// TODO: casos reales cuando los haya. No inventar clientes ni resultados (content/verified-facts.md).
export default function Casos() {
  if (!SECCIONES_HOME.casos) return null
  return <SeccionPendiente id="casos" titulo="Casos" fondo="#f8fafb" />
}
