import SeccionPendiente from './SeccionPendiente'
import { SECCIONES_HOME } from './sections'

// TODO: pasos de cómo trabajamos.
export default function Proceso() {
  if (!SECCIONES_HOME.proceso) return null
  return <SeccionPendiente id="proceso" titulo="Cómo trabajamos" />
}
