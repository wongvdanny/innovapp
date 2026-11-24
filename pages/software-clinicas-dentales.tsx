import Link from 'next/link'
import {
  BellRing, Bot, CalendarClock, ChartColumn, ClipboardList, Database, DatabaseBackup, FileCheck, FileSpreadsheet,
  FileText, FlaskConical, Globe, KeyRound, ListOrdered, Lock, Mail, MessageCircle, PenLine, Percent, Phone, Puzzle,
  Receipt, Repeat, RotateCcw, Server, UserCog,
  type LucideIcon,
} from 'lucide-react'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Faq, { type FaqItem } from '../components/Faq'
import Icono from '../components/Icono'
import { COMMERCIAL_PHONE, telLink, waLink } from '../lib/constants'
import { track } from '../lib/track'

const RUTA = '/software-clinicas-dentales'
// El mismo texto que usa la burbuja de WhatsApp en esta ruta (components/WhatsAppBubble.tsx)
const MENSAJE_WHATSAPP_DENTAL = 'Hola, me interesa un software de gestión a medida para mi clínica dental'

const TITULO = 'Software de gestión a medida para clínicas dentales | Innovapp'
const DESCRIPCION = 'Software propio para tu clínica dental: agenda en tiempo real, ficha y odontograma, presupuestos, firma en tablet y migración de datos.'

const PROBLEMAS: [LucideIcon, string, string][] = [
  [Repeat, 'Una suscripción que no termina nunca', 'Pagas cada mes por un programa que nunca será tuyo, y el coste sigue mientras tengas la clínica abierta.'],
  [Database, 'Tus datos, en manos del proveedor', 'Pacientes, historias e informes viven en un sistema ajeno. Sacarlos para cambiar de programa suele ser lento, incompleto o depender de su voluntad.'],
  [Puzzle, 'Funciones que no encajan con tu clínica', 'Te adaptas tú al programa: pasos que sobran, datos que faltan y cambios que el proveedor no va a hacer solo para ti.'],
]

const INCLUYE: [LucideIcon, string, string][] = [
  [CalendarClock, 'Agenda en tiempo real', 'Por profesional y gabinete, con huecos de 15 minutos, estados de cita, lista de espera y urgencias. Lo que cambia en recepción se ve al instante en todos los equipos.'],
  [ClipboardList, 'Ficha del paciente y odontograma', 'Historia médica con alertas, odontograma por pieza, evolución de los tratamientos, documentos, cobros y deuda pendiente en una sola ficha.'],
  [FileText, 'Presupuestos que pasan a plan de tratamiento', 'Con tarifas particulares y por aseguradora. Cuando el paciente acepta, el presupuesto se convierte en su plan de tratamiento sin volver a teclearlo.'],
  [PenLine, 'Firma de consentimientos en tablet', 'El paciente firma en la tablet tras escanear un código QR y el PDF firmado se guarda en su ficha.'],
  [Receipt, 'Facturación y caja', 'Facturas, recibos, cierre de caja, control de deudores y tesorería.'],
  [Percent, 'Liquidación de profesionales', 'Cálculo de lo que corresponde a cada profesional según su porcentaje sobre lo trabajado.'],
  [FlaskConical, 'Laboratorio e implantes', 'Seguimiento de los trabajos de laboratorio y registro de implantes con marca, lote y pieza.'],
  [UserCog, 'Usuarios, roles y seguridad', 'Permisos por rol, verificación en dos pasos y registro de accesos para saber quién ha consultado o cambiado qué.'],
  [Globe, 'Cita online desde tu web', 'Tus pacientes piden cita en tu web viendo los huecos reales de la agenda.'],
  [FileSpreadsheet, 'Exportación a Excel', 'Saca listados de pacientes, citas, cobros o deudas cuando los necesites.'],
]

const IA: [LucideIcon, string, string][] = [
  [Bot, 'Asistente de WhatsApp', 'Da, cambia y cancela citas en la agenda de la clínica a cualquier hora, y pasa a tu equipo lo clínico y lo urgente.'],
  [BellRing, 'Recordatorios con respuesta', 'El paciente recibe el recordatorio y confirma o cancela con un toque; la agenda se actualiza sola.'],
  [ListOrdered, 'Lista de espera automática', 'Cuando se libera un hueco, se ofrece a quien estaba esperando.'],
  [RotateCcw, 'Reactivación de pacientes', 'Avisos a pacientes que llevan tiempo sin venir o tienen una revisión pendiente.'],
  [ChartColumn, 'Panel de métricas', 'Citas, cancelaciones, ausencias y mensajes atendidos, de un vistazo.'],
]

const DATOS: [LucideIcon, string, string][] = [
  [Server, 'Servidores en la Unión Europea', 'El sistema funciona en la nube, en servidores situados en la UE.'],
  [Lock, 'Cifrado', 'Conexiones cifradas y datos protegidos en el servidor.'],
  [DatabaseBackup, 'Copias diarias en otra ubicación', 'Una copia de seguridad cada día, guardada fuera del servidor principal.'],
  [FileCheck, 'Contrato de encargado del tratamiento', 'Firmamos el contrato del artículo 28 del RGPD: la clínica es la responsable de los datos y nosotros los tratamos solo siguiendo sus instrucciones.'],
  [KeyRound, 'A nombre de la clínica', 'El servidor y las cuentas de los servicios se contratan a nombre de la clínica, no al nuestro.'],
]

const MIGRACION: [string, string][] = [
  ['Exportación', 'Sacamos los datos de tu programa actual: pacientes, citas, historias, presupuestos, cobros y documentos.'],
  ['Mapa de campos', 'Decidimos contigo dónde va cada dato en el sistema nuevo, para que no se quede nada por el camino.'],
  ['Ensayo completo', 'Hacemos una migración de prueba y cuadramos pacientes, citas y deudas con el programa antiguo antes de dar nada por bueno.'],
  ['Cambio definitivo', 'La migración final se hace en fin de semana: el viernes cierras con el programa antiguo y el lunes abres con el nuevo.'],
]

const PASOS: [string, string][] = [
  ['Análisis', 'Vemos cómo trabaja tu clínica, qué usas de tu programa actual y qué echas en falta. Con eso preparamos la propuesta por escrito.'],
  ['Desarrollo por fases', 'Construimos el sistema por partes y te entregamos cada una para que la pruebes y la valides antes de seguir.'],
  ['Migración y formación online', 'Pasamos tus datos con el ensayo previo y formamos a tu equipo por videollamada.'],
  ['Acompañamiento', 'Estamos contigo en los primeros días de uso y seguimos mejorando el sistema cuando lo necesites.'],
]

const FAQ: FaqItem[] = [
  {
    pregunta: '¿Cuánto tarda?',
    respuesta: 'Depende de los módulos que necesite tu clínica y de cómo sea la migración desde tu programa actual. Tras el análisis te damos un plan por fases con un plazo concreto para cada entrega, y empiezas a usar cada parte en cuanto la validas.',
  },
  {
    pregunta: '¿Puedo migrar los datos de mi programa actual?',
    respuesta: 'Sí. Exportamos los datos de tu programa actual, preparamos un mapa de campos y hacemos un ensayo completo en el que cuadramos pacientes, citas y deudas antes del cambio definitivo, que se hace en fin de semana.',
  },
  {
    pregunta: '¿Dónde se guardan los datos?',
    respuesta: 'En servidores situados en la Unión Europea, cifrados y con copias diarias en otra ubicación. El servidor y las cuentas se contratan a nombre de la clínica, y firmamos el contrato de encargado del tratamiento del artículo 28 del RGPD.',
  },
  {
    pregunta: '¿El código es mío?',
    respuesta: 'Sí. El código fuente es de la clínica, igual que los datos. El pago se hace por hitos entregados, y cada entrega queda en tus manos.',
  },
  {
    pregunta: '¿Funciona en tablet?',
    respuesta: 'Sí. Se usa desde el navegador en ordenador y tablet, sin instalar nada. La tablet sirve también para que el paciente firme los consentimientos.',
  },
  {
    pregunta: '¿Se puede conectar con WhatsApp?',
    respuesta: 'Sí, como ampliación con IA: un asistente de WhatsApp que da, cambia y cancela citas en la agenda, recordatorios con confirmar o cancelar, lista de espera automática y reactivación de pacientes.',
  },
  {
    pregunta: '¿Qué pasa si quiero cambiar de proveedor?',
    respuesta: 'Puedes hacerlo cuando quieras. El código, los datos, el servidor y las cuentas son de la clínica, así que otro equipo puede seguir con el sistema sin empezar de cero.',
  },
  {
    pregunta: '¿Cómo empezamos?',
    respuesta: 'Escríbenos por WhatsApp o desde el formulario de contacto y cuéntanos cómo trabaja tu clínica y qué programa usas hoy. A partir de ahí hacemos el análisis y te enviamos la propuesta por escrito.',
  },
]

const h2: React.CSSProperties = { fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 14px' }
const intro: React.CSSProperties = { fontSize: 16, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 auto 32px', maxWidth: 660 }
const tarjeta: React.CSSProperties = { background: 'white', border: '1px solid var(--gris-200)', borderRadius: 'var(--radio-lg)', padding: 24 }
const icono: React.CSSProperties = { width: 46, height: 46, borderRadius: 'var(--radio-md)', background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }
const enlaceOro: React.CSSProperties = { color: 'var(--agentes-oro)', fontWeight: 700, textDecoration: 'underline' }

type Cta = 'software_dental_hero' | 'software_dental_cta_final'

// WhatsApp y teléfono los mide lib/track.ts (click_whatsapp / click_tel con «cta»); el enlace
// a /contacto es interno, así que su evento se envía aquí con el mismo formato.
const clickContacto = (cta: Cta) => () => track('click_contacto', { cta, page_path: RUTA })

function Ctas({ cta, llamada = false }: { cta: Cta; llamada?: boolean }) {
  const secundario: React.CSSProperties = { padding: '15px 26px', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.22)', color: 'white', fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
  return (
    <div className="sd-ctas">
      <a href={waLink(MENSAJE_WHATSAPP_DENTAL)} target="_blank" rel="noopener noreferrer" data-cta={cta}
        style={{ padding: '15px 26px', borderRadius: 12, background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontWeight: 700, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icono icono={MessageCircle} size={20} />Hablar por WhatsApp
      </a>
      <Link href="/contacto" data-cta={cta} onClick={clickContacto(cta)} style={secundario}>
        <Icono icono={Mail} size={20} />Escríbenos
      </Link>
      {llamada && (
        <a href={telLink()} data-cta={cta} style={secundario}>
          <Icono icono={Phone} size={20} />Llamar <span style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>({COMMERCIAL_PHONE})</span>
        </a>
      )}
    </div>
  )
}

function Rejilla({ items, fondo }: { items: [LucideIcon, string, string][]; fondo: string }) {
  return (
    <ul className="sd-grid" style={{ listStyle: 'none', margin: 0, padding: 0, textAlign: 'left' }}>
      {items.map(([ic, titulo, texto]) => (
        <li key={titulo} style={{ ...tarjeta, background: fondo }}>
          <div style={icono}><Icono icono={ic} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>{titulo}</h3>
          <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: 0 }}>{texto}</p>
        </li>
      ))}
    </ul>
  )
}

function Pasos({ items }: { items: [string, string][] }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
      {items.map(([titulo, texto], i) => (
        <li key={titulo} style={{ ...tarjeta, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span aria-hidden style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-texto)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', margin: '0 0 4px' }}>{titulo}</h3>
            <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.6, margin: 0 }}>{texto}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function SoftwareClinicasDentales() {
  return (
    <>
      <Seo title={TITULO} description={DESCRIPCION} canonical={RUTA} />
      <Nav />

      <main>
        {/* 1. Hero */}
        <section style={{ background: 'linear-gradient(160deg,#1e1e1e 0%,#1e1e1e 60%,#33261c 100%)', padding: 'clamp(120px,16vw,160px) 16px clamp(56px,8vw,90px)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <nav aria-label="Ruta de navegación" style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 18 }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,.7)' }}>Inicio</Link> ›{' '}
              <span aria-current="page" style={{ color: 'white' }}>Software para clínicas dentales</span>
            </nav>
            <h1 style={{ fontSize: 'clamp(31px,6vw,56px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, color: 'white', margin: '0 0 18px' }}>
              Software de gestión a medida <span style={{ color: '#f4a15c' }}>para clínicas dentales</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', color: 'rgba(255,255,255,.78)', lineHeight: 1.6, maxWidth: 680, margin: '0 0 28px' }}>
              Deja de pagar una suscripción por un programa que no es tuyo. Te desarrollamos un sistema propio para tu clínica, en la nube de la Unión Europea, que se usa desde el navegador en ordenador y tablet.
            </p>
            <Ctas cta="software_dental_hero" />
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', margin: '18px 0 0' }}>
              <strong style={{ color: '#f4a15c' }}>+10 años</strong> desarrollando webs y aplicaciones, ahora con IA.
            </p>
          </div>
        </section>

        {/* 2. El problema */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Por qué un programa propio para tu clínica dental</h2>
            <p style={intro}>El programa de gestión es la herramienta que más usa tu equipo cada día. Estos son los problemas que más se repiten con el software dental por suscripción.</p>
            <Rejilla items={PROBLEMAS} fondo="var(--gris-50)" />
          </div>
        </section>

        {/* 3. Qué incluye */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--gris-50)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Qué incluye tu software de gestión dental a medida</h2>
            <p style={intro}>Partimos de lo que una clínica dental necesita cada día y lo adaptamos a tu forma de trabajar: lo que no uses no estorba, y lo que te falte se añade.</p>
            <Rejilla items={INCLUYE} fondo="white" />
          </div>
        </section>

        {/* 4. Ampliaciones con IA */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: '#12141a' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...h2, color: '#ece9e2', textAlign: 'center' }}>Software dental con WhatsApp e IA</h2>
            <p style={{ ...intro, color: '#b4bcc6', textAlign: 'center' }}>Ampliaciones opcionales que se conectan a la agenda de tu clínica para que recepción dedique el tiempo a los pacientes que tiene delante.</p>
            <ul className="sd-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {IA.map(([ic, titulo, texto]) => (
                <li key={titulo} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radio-lg)', padding: 24 }}>
                  <div style={{ marginBottom: 12, color: 'var(--agentes-oro)' }}><Icono icono={ic} size={28} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ece9e2', margin: '0 0 8px' }}>{titulo}</h3>
                  <p style={{ fontSize: 15, color: '#c9cdd4', lineHeight: 1.65, margin: 0 }}>{texto}</p>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 16, color: '#c9cdd4', lineHeight: 1.7, textAlign: 'center', margin: '28px 0 0' }}>
              Mira cómo funciona el <Link href="/agentes-ia-clinicas" style={enlaceOro}>agente de WhatsApp para clínicas</Link>.
            </p>
          </div>
        </section>

        {/* 5. Datos protegidos */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Tus datos, protegidos</h2>
            <p style={intro}>Una clínica dental trata datos de salud de sus pacientes. Por eso el sistema se monta así desde el primer día.</p>
            <Rejilla items={DATOS} fondo="var(--gris-50)" />
          </div>
        </section>

        {/* 6. Migración */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--color-brand-orange-tint)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ ...h2, textAlign: 'center' }}>Migrar tu software dental sin perder nada</h2>
            <p style={{ ...intro, textAlign: 'center' }}>Cambiar de programa da respeto porque ahí está toda la historia de la clínica. Lo hacemos con un ensayo previo y cuadrando las cifras antes del cambio.</p>
            <Pasos items={MIGRACION} />
          </div>
        </section>

        {/* 7. Cómo trabajamos */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--gris-50)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ ...h2, textAlign: 'center' }}>Cómo trabajamos</h2>
            <p style={{ ...intro, textAlign: 'center' }}>Un programa propio para tu clínica dental, construido contigo paso a paso.</p>
            <Pasos items={PASOS} />
            <p style={{ ...tarjeta, fontSize: 16, color: '#1e1e1e', lineHeight: 1.7, margin: '20px 0 0', textAlign: 'center', borderColor: 'var(--color-brand-orange)' }}>
              <strong>Pagas por hitos entregados</strong> y <strong>el código fuente es de la clínica</strong>.
            </p>
          </div>
        </section>

        {/* 8. FAQ */}
        <Faq items={FAQ} titulo="Preguntas frecuentes sobre el software para clínicas dentales" tema="marca" />

        {/* 9. CTA final */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'linear-gradient(135deg,#1e1e1e,#33261c)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ ...h2, color: 'white' }}>¿Hablamos del programa de tu clínica?</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', lineHeight: 1.7, margin: '0 0 28px' }}>
              Cuéntanos cómo trabajáis y qué programa usáis hoy. Te asesoramos sin compromiso y, si encaja, te enviamos una propuesta por escrito con las fases y los plazos.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Ctas cta="software_dental_cta_final" llamada /></div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .sd-ctas { display: flex; flex-direction: column; gap: 12px; }
        .sd-grid { display: grid; gap: 16px; }
        @media (min-width: 600px) {
          .sd-ctas { flex-direction: row; flex-wrap: wrap; }
          .sd-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (min-width: 960px) {
          .sd-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </>
  )
}
