import SeccionPendiente from './SeccionPendiente'
import { SECCIONES_HOME } from './sections'

// TODO: quién está detrás de innovapp. Sustituye a la antigua sección #empresa.
export default function SobreMi() {
  if (!SECCIONES_HOME.sobreMi) return null
  return <SeccionPendiente id="sobre-mi" titulo="Quién está detrás" fondo="#f8fafb" />
}
