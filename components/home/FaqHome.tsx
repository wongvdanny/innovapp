import SeccionPendiente from './SeccionPendiente'
import { SECCIONES_HOME } from './sections'

// TODO: preguntas frecuentes. Cuando las haya, usar components/Faq.tsx (lista + JSON-LD FAQPage)
// con el id="faq" en su sección.
export default function FaqHome() {
  if (!SECCIONES_HOME.faq) return null
  return <SeccionPendiente id="faq" titulo="Preguntas frecuentes" fondo="#f8fafb" />
}
