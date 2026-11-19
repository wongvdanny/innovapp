import { SectionTabs, useTab } from '../AdminLayout'
import Suscriptores from '../newsletter/Suscriptores'
import Campanas from '../newsletter/Campanas'

const VISTAS: [string, string][] = [['suscriptores', 'Suscriptores'], ['campanas', 'Campañas']]

// Newsletter con doble opt-in: suscriptores (con la prueba de su consentimiento) y campañas.
export default function Newsletter() {
  const vista = useTab(VISTAS.map(v => v[0]), 'suscriptores', 'vista')
  return (
    <>
      <SectionTabs tabs={VISTAS} current={vista} param="vista" />
      {vista === 'campanas' ? <Campanas /> : <Suscriptores />}
    </>
  )
}
