import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { CalendarCheck, CircleX, Instagram, Lightbulb, Palette, PencilLine, Sparkles, Store, UserCheck, Users, type LucideIcon } from 'lucide-react'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Faq, { type FaqItem } from '../components/Faq'
import Icono from '../components/Icono'
import ConversacionWhatsApp from '../components/sector/ConversacionWhatsApp'
import FormularioPromo, { abrirBases } from '../components/promo/FormularioPromo'
import { prisma } from '../lib/prisma'
import { BASES, BASES_INTRO, BASES_TITULO } from '../lib/promo/bases'
import {
  CUOTA_MANTENIMIENTO, DIAS_ACEPTAR, DIAS_MATERIAL, INSTAGRAM_HANDLE, INSTAGRAM_URL, MAX_SUPLENTES, MAX_WEBS,
  MIN_INSCRIPCIONES_VISIBLES, PERMANENCIA_MESES, PRECIO_IA_DESDE, PROMO_END, PROMO_SLUG, RESULTADOS_PUBLICADOS, promoCerrada,
} from '../lib/promo/config'
import type { MensajeChat } from '../data/sectores'

type Seleccionado = { businessName: string; instagram: string; substituteOrder: number | null }
type Props = { inscripciones: number; cerradaAlCargar: boolean; resultados: { ganadores: Seleccionado[]; suplentes: Seleccionado[] } | null }

const INCLUYE: [LucideIcon, string, string][] = [
  [Store, 'Web de una página', 'Presentación, servicios o productos, precios, galería, ubicación, horario, botón de WhatsApp y formulario de contacto.'],
  [Palette, 'Diseño a tu medida, pensado para el móvil', 'Personalizado con tu logo, colores, textos y fotos.'],
  [PencilLine, 'Una ronda de cambios', 'Tras el primer diseño, ajustamos lo que necesites.'],
  [Sparkles, '2 meses gratis de reservas online o asistente con IA', 'Tú eliges cuál de los dos.'],
]

const CHAT: MensajeChat[] = [
  { de: 'cliente', texto: 'Hola, ¿tenéis hueco mañana por la tarde para un corte?', hora: '21:47' },
  { de: 'asistente', texto: '¡Hola! 👋 Mañana tengo libre a las 17:00 o a las 18:30. ¿Cuál te viene mejor?', hora: '21:47' },
  { de: 'cliente', texto: 'A las 18:30', hora: '21:48' },
  { de: 'asistente', texto: 'Perfecto. ¿A nombre de quién la reservo?', hora: '21:48' },
  { de: 'cliente', texto: 'Lucía', hora: '21:48' },
  { de: 'asistente', texto: '✅ Listo, Lucía: mañana a las 18:30, corte. Te enviaremos un recordatorio antes de la cita.', hora: '21:48' },
]

const REQUISITOS = [
  'Autónomo, comercio, pyme o profesional con actividad en España.',
  'Titular o representante legal, mayor de edad.',
  `Seguir a @${INSTAGRAM_HANDLE} durante toda la promoción.`,
  'Una inscripción por negocio.',
]

const CRITERIOS: [LucideIcon, string][] = [
  [CircleX, 'Sin web o con una web desactualizada'],
  [Sparkles, 'Interés en reservas online o automatización con IA'],
  [Lightbulb, 'Claridad al explicar tu negocio'],
  [Users, 'Visibilidad del negocio'],
  [CalendarCheck, 'Disponibilidad para colaborar en los plazos'],
]

const FAQ: FaqItem[] = [
  { pregunta: '¿De verdad es gratis?', respuesta: `El diseño y el desarrollo de la web, sí. Pagas el dominio y el alojamiento y mantenimiento (${CUOTA_MANTENIMIENTO} €/mes + IVA).` },
  { pregunta: '¿Por qué el alojamiento tiene que ser con vosotros?', respuesta: 'Así garantizamos que la web funcione, esté segura y actualizada, e incluye soporte.' },
  { pregunta: '¿El dominio es mío?', respuesta: 'Sí, se registra a tu nombre.' },
  { pregunta: `¿Qué pasa si me doy de baja tras los ${PERMANENCIA_MESES} meses?`, respuesta: 'Conservas tu dominio y tus contenidos; el código y la plantilla son de Innovapp y no se entregan salvo compra aparte.' },
  { pregunta: '¿Qué pasa al acabar los 2 meses de IA?', respuesta: `Decides si la mantienes. El precio se ajusta a tu negocio (desde ${PRECIO_IA_DESDE} €/mes + IVA) y te lo presupuestamos antes de que acabe el periodo gratis; si no la quieres, se desactiva sin coste.` },
  { pregunta: '¿Es un sorteo?', respuesta: 'No, es una selección según los criterios publicados.' },
  { pregunta: '¿Cómo elegís a los ganadores?', respuesta: `Según los criterios de las bases, favoreciendo la variedad de sectores. Elegimos ${MAX_WEBS} ganadores y ${MAX_SUPLENTES} suplentes.` },
  { pregunta: '¿Qué pasa si me eligen?', respuesta: `Te avisamos por email. Tienes ${DIAS_ACEPTAR} días para aceptar y ${DIAS_MATERIAL} para enviarnos el dominio y la información de tu negocio. Si no, la plaza pasa a un suplente.` },
  { pregunta: '¿Se publicará mi nombre?', respuesta: 'Si resultas ganador o suplente, publicaremos el nombre comercial de tu negocio y tu cuenta de Instagram.' },
  { pregunta: '¿Hasta cuándo puedo inscribirme?', respuesta: 'Hasta el 15 de diciembre de 2026 a las 12:00 (hora peninsular).' },
  { pregunta: '¿Cuándo sabré si me han elegido?', respuesta: 'El 15 de diciembre de 2026, por email y en nuestras redes.' },
  { pregunta: '¿Puedo participar si no estoy en Asturias?', respuesta: 'Sí, en toda España.' },
  { pregunta: 'Si no me eligen, ¿qué?', respuesta: 'Si aceptaste recibir comunicaciones, te enviaremos una oferta especial para participantes.' },
]

const h2: React.CSSProperties = { fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 14px', textAlign: 'center' }
const intro: React.CSSProperties = { fontSize: 16, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 auto 32px', maxWidth: 640, textAlign: 'center' }
const tarjeta: React.CSSProperties = { background: 'white', border: '1px solid var(--gris-200)', borderRadius: 'var(--radio-lg)', padding: 24 }
const icono: React.CSSProperties = { width: 46, height: 46, borderRadius: 'var(--radio-md)', background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, flexShrink: 0 }
const seccion = (fondo: string): React.CSSProperties => ({ padding: 'var(--seccion-y) 16px', background: fondo })

const FIN = new Date(PROMO_END).getTime()
const restante = () => Math.max(0, FIN - Date.now())

/** Cuenta atrás hasta PROMO_END. Avisa una vez cuando llega a cero. */
function CuentaAtras({ alTerminar }: { alTerminar: () => void }) {
  const [ms, setMs] = useState<number | null>(null) // null en el servidor: evita desajustes de hidratación
  useEffect(() => {
    const tick = () => {
      const r = restante()
      setMs(r)
      if (r === 0) { alTerminar(); clearInterval(id) }
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [alTerminar])
  const s = Math.floor((ms ?? restante()) / 1000)
  const partes: [number, string][] = [[Math.floor(s / 86400), 'días'], [Math.floor((s % 86400) / 3600), 'horas'], [Math.floor((s % 3600) / 60), 'min'], [s % 60, 'seg']]
  return (
    <div role="timer" aria-live="off" aria-label={`Quedan ${partes[0][0]} días, ${partes[1][0]} horas y ${partes[2][0]} minutos para cerrar las inscripciones`}
      style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '0 0 28px' }}>
      {partes.map(([n, u]) => (
        <div key={u} aria-hidden style={{ minWidth: 64, padding: '10px 6px', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', textAlign: 'center' }}>
          <div suppressHydrationWarning style={{ fontSize: 'clamp(22px,5vw,30px)', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', textTransform: 'uppercase', letterSpacing: 1 }}>{u}</div>
        </div>
      ))}
    </div>
  )
}

const AVISO_CIERRE = 'Inscripciones cerradas. Anunciaremos a los 4 seleccionados hoy, 15 de diciembre, por email y en nuestras redes'

export default function WebGratis({ inscripciones, cerradaAlCargar, resultados }: Props) {
  const [cerrada, setCerrada] = useState(cerradaAlCargar)
  const cerrar = useState(() => () => setCerrada(true))[0]
  // Llegar con #bases (enlace de los emails) abre el desplegable de las bases
  useEffect(() => {
    const abrir = () => { if (window.location.hash === '#bases') abrirBases() }
    abrir()
    window.addEventListener('hashchange', abrir)
    return () => window.removeEventListener('hashchange', abrir)
  }, [])

  return (
    <>
      <Seo
        title="4 webs gratis + IA para tu negocio | Innovapp"
        description={`Te hacemos la web gratis y te damos 2 meses de reservas online o asistente con IA. Solo ${MAX_WEBS} negocios de toda España. Inscríbete antes del 15/12/2026.`}
        canonical="/webgratis"
        ogImage="/og/webgratis.png"
      />
      <Nav />
      <main>
        {/* 1. Hero */}
        <section style={{ background: 'linear-gradient(160deg,#1e1e1e 0%,#1e1e1e 55%,#33261c 100%)', padding: 'clamp(120px,16vw,160px) 16px clamp(56px,8vw,90px)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(32px,6.5vw,58px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08, color: 'white', margin: '0 0 18px' }}>
              {MAX_WEBS} webs gratis <span style={{ color: '#f4a15c' }}>+ asistente IA</span> para tu negocio
            </h1>
            <p style={{ fontSize: 'clamp(16px,2.4vw,19px)', color: 'rgba(255,255,255,.8)', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 640 }}>
              Te hacemos la web gratis y te damos 2 meses de reservas online o asistente con IA. Solo para {MAX_WEBS} negocios de toda España.
            </p>
            {cerrada ? (
              <p role="status" style={{ fontSize: 18, fontWeight: 700, color: 'white', background: 'rgba(238,117,40,.18)', border: '1px solid rgba(238,117,40,.45)', borderRadius: 14, padding: '18px 20px', margin: 0, lineHeight: 1.5 }}>
                {AVISO_CIERRE}.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', margin: '0 0 12px' }}>Las inscripciones cierran el 15 de diciembre de 2026 a las 12:00</p>
                <CuentaAtras alTerminar={cerrar} />
                <a href="#formulario" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontWeight: 800, fontSize: 17 }}>
                  Quiero participar
                </a>
              </>
            )}
            {inscripciones >= MIN_INSCRIPCIONES_VISIBLES && (
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', margin: '18px 0 0' }}>Inscripciones recibidas: <strong style={{ color: 'white' }}>{inscripciones}</strong></p>
            )}
          </div>
        </section>

        {/* Tras PROMO_END, con RESULTADOS_PUBLICADOS: ganadores y suplentes */}
        {resultados && (
          <section id="seleccionados" style={seccion('var(--color-brand-orange-tint)')}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              <h2 style={h2}>Seleccionados</h2>
              <div className="wg-dos" style={{ padding: 0 }}>
                {([['Ganadores', resultados.ganadores, false], ['Suplentes', resultados.suplentes, true]] as const).map(([titulo, lista, numerados]) => (
                  <div key={titulo} style={tarjeta}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: '#1e1e1e', margin: '0 0 12px' }}>{titulo}</h3>
                    {lista.length === 0 ? <p style={{ margin: 0, color: 'var(--gris-600)' }}>Pendiente de publicar.</p> : (
                      <ol style={{ margin: 0, paddingLeft: numerados ? 22 : 0, listStyle: numerados ? 'decimal' : 'none', display: 'grid', gap: 10 }}>
                        {lista.map(s => (
                          <li key={s.instagram + s.businessName} value={numerados ? s.substituteOrder ?? undefined : undefined} style={{ fontSize: 16, color: '#1e1e1e', lineHeight: 1.5 }}>
                            <strong>{s.businessName}</strong>{' '}
                            <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-orange-texto)', fontWeight: 600 }}>@{s.instagram}</a>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 2. Qué incluye */}
        <section style={seccion('white')}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={h2}>Qué incluye (gratis)</h2>
            <p style={intro}>Todo lo que necesitas para que tus clientes te encuentren y te contacten desde el móvil.</p>
            <div className="wg-grid">
              {INCLUYE.map(([ic, t, d]) => (
                <div key={t} style={{ ...tarjeta, background: 'var(--gris-50)' }}>
                  <div style={icono}><Icono icono={ic} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>{t}</h3>
                  <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: 0 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Bonus IA */}
        <section style={seccion('#12141a')}>
          <div className="wg-bonus">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(var(--agentes-oro-rgb),.14)', border: '1px solid rgba(var(--agentes-oro-rgb),.35)', borderRadius: 100, padding: '6px 16px', marginBottom: 18, color: 'var(--agentes-oro)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                <Icono icono={Sparkles} size={16} /> Bonus IA
              </div>
              <h2 style={{ ...h2, color: '#ece9e2', textAlign: 'left' }}>Responde a tus clientes 24/7, aunque estés ocupado.</h2>
              <p style={{ fontSize: 16, color: '#c9cdd4', lineHeight: 1.7, margin: 0 }}>
                Durante 2 meses, gratis: un asistente con IA que contesta tu WhatsApp y reserva citas en tu agenda, o reservas online desde tu web. Tú eliges.
              </p>
            </div>
            <ConversacionWhatsApp nombre="Tu negocio" mensajes={CHAT} etiqueta="Ejemplo de conversación por WhatsApp: el asistente con IA reserva una cita" />
          </div>
        </section>

        {/* 4. Cómo participar */}
        <section style={seccion('var(--gris-50)')}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ ...h2, marginBottom: 32 }}>Cómo participar</h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
              {[
                <>Sigue a <strong>@{INSTAGRAM_HANDLE}</strong> en Instagram.{' '}
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '10px 18px', borderRadius: 10, background: '#1e1e1e', color: 'white', fontWeight: 700, fontSize: 15 }}>
                    <Icono icono={Instagram} size={18} /> Seguir a @{INSTAGRAM_HANDLE}
                  </a></>,
                <>Rellena el formulario de esta página y cuéntanos brevemente tu negocio (antes del 15/12/2026 a las 12:00).</>,
                <>El 15 de diciembre de 2026 elegimos {MAX_WEBS} negocios entre todos los participantes y les avisamos por email.</>,
              ].map((paso, i) => (
                <li key={i} style={{ ...tarjeta, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-texto)', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: 16, color: '#1e1e1e', lineHeight: 1.6, margin: '8px 0 0' }}>{paso}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Requisitos y 6. Cómo elegimos */}
        <section style={seccion('white')}>
          <div className="wg-dos">
            <div>
              <h2 style={{ ...h2, textAlign: 'left' }}>Requisitos</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
                {REQUISITOS.map(r => (
                  <li key={r} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, color: 'var(--gris-700)', lineHeight: 1.6 }}>
                    <span style={{ color: '#15803d', marginTop: 2 }}><Icono icono={UserCheck} size={20} /></span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 style={{ ...h2, textAlign: 'left' }}>Cómo elegimos</h2>
              <p style={{ fontSize: 16, color: 'var(--gris-600)', lineHeight: 1.6, margin: '0 0 14px' }}>
                No es un sorteo: elegimos según estos criterios. <strong style={{ color: '#1e1e1e' }}>Elegimos {MAX_WEBS} ganadores y {MAX_SUPLENTES} suplentes, favoreciendo la variedad de sectores.</strong>
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
                {CRITERIOS.map(([ic, t]) => (
                  <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16, color: 'var(--gris-700)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-brand-orange-dark)' }}><Icono icono={ic} size={20} /></span>{t}
                  </li>
                ))}
              </ul>
              <div style={{ ...tarjeta, background: 'var(--gris-50)', marginTop: 18 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>Si te eligen</h3>
                <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: 0 }}>
                  Tienes <strong style={{ color: '#1e1e1e' }}>{DIAS_ACEPTAR} días</strong> para aceptar y <strong style={{ color: '#1e1e1e' }}>{DIAS_MATERIAL} días</strong> para enviarnos el dominio y la información de tu negocio. Si no, la plaza pasa al siguiente suplente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Condiciones claras */}
        <section style={seccion('var(--gris-50)')}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <h2 style={h2}>Condiciones claras</h2>
            <p style={intro}>Sin letra pequeña: esto es lo que es gratis y lo que pagas tú.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="wg-tabla">
                <caption className="sr-only">Qué es gratis y qué pagas tú en la promoción</caption>
                <thead>
                  <tr><th scope="col">Gratis</th><th scope="col">Lo que pagas</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <ul>
                        <li>Diseño y desarrollo de la web.</li>
                        <li>1 ronda de cambios.</li>
                        <li>2 meses de IA o reservas online.</li>
                      </ul>
                    </td>
                    <td>
                      <ul>
                        <li>El dominio (a tu nombre).</li>
                        <li>Alojamiento y mantenimiento obligatorio con Innovapp: <strong>{CUOTA_MANTENIMIENTO} €/mes + IVA</strong>, permanencia mínima de {PERMANENCIA_MESES} meses.</li>
                        <li>La herramienta de IA o reservas tras los 2 meses, solo si quieres mantenerla: presupuesto personalizado según tu negocio, <strong>desde {PRECIO_IA_DESDE} €/mes + IVA</strong>.</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="wg-dos" style={{ marginTop: 20, padding: 0 }}>
              <div style={tarjeta}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>No incluye</h3>
                <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: 0 }}>Textos o fotos profesionales, tienda online, páginas extra ni funcionalidades a medida (se presupuestan aparte).</p>
              </div>
              <div style={tarjeta}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>Compromisos del seleccionado</h3>
                <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: 0 }}>Entregar el material en 15 días, testimonio y reseña en Google si queda satisfecho, permiso para mostrar la web como caso de éxito y mantener «Web hecha por Innovapp» en el pie.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Preguntas frecuentes */}
        <Faq items={FAQ} titulo="Preguntas frecuentes" tema="marca" />

        {/* 9. Formulario */}
        <section id="formulario" style={{ ...seccion('white'), scrollMarginTop: 80 }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={h2}>Inscríbete</h2>
            {cerrada ? (
              <p role="status" style={{ ...intro, fontWeight: 700, color: '#1e1e1e' }}>{AVISO_CIERRE}.</p>
            ) : (
              <>
                <p style={intro}>Antes del 15 de diciembre de 2026 a las 12:00. Los campos con * son obligatorios.</p>
                <div style={{ background: 'var(--gris-50)', border: '1px solid var(--gris-200)', borderRadius: 20, padding: 'clamp(20px,5vw,36px)', position: 'relative' }}>
                  <FormularioPromo />
                </div>
              </>
            )}
          </div>
        </section>

        {/* 10. Bases legales */}
        <section style={{ padding: '0 16px var(--seccion-y)', background: 'white' }}>
          <details id="bases" style={{ maxWidth: 760, margin: '0 auto', border: '1px solid var(--gris-200)', borderRadius: 16, padding: '18px 22px', background: 'var(--gris-50)', scrollMarginTop: 80 }}>
            <summary style={{ cursor: 'pointer', fontSize: 17, fontWeight: 700, color: '#1e1e1e' }}>{BASES_TITULO}</summary>
            <div style={{ marginTop: 16, fontSize: 14, color: 'var(--gris-700)', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 14px', fontStyle: 'italic' }}>{BASES_INTRO}</p>
              {BASES.map((b, i) => (
                <div key={b.titulo} style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1e1e', margin: '0 0 4px' }}>{i + 1}. {b.titulo}</h3>
                  {b.texto.map((t, i) => <p key={i} style={{ margin: '0 0 4px' }}>{t}</p>)}
                </div>
              ))}
            </div>
          </details>

          {/* 11. Pie de la sección */}
          <p style={{ maxWidth: 760, margin: '20px auto 0', fontSize: 13, color: 'var(--gris-600)', lineHeight: 1.6, textAlign: 'center' }}>
            Esta promoción no está patrocinada, avalada ni administrada por Instagram, Facebook ni Meta, ni asociada a ellas.
          </p>
        </section>
      </main>
      <Footer />

      <style>{`
        .wg-grid { display: grid; gap: 16px; }
        .wg-bonus { max-width: 1100px; margin: 0 auto; display: grid; gap: 32px; align-items: center; }
        .wg-dos { max-width: 1000px; margin: 0 auto; display: grid; gap: 32px; }
        .wg-tabla { width: 100%; border-collapse: separate; border-spacing: 0; background: white; border: 1px solid var(--gris-200); border-radius: 16px; overflow: hidden; }
        .wg-tabla th { text-align: left; font-size: 16px; padding: 14px 18px; background: var(--color-brand-orange-tint); color: #1e1e1e; }
        .wg-tabla th + th { background: var(--gris-100); }
        .wg-tabla td { vertical-align: top; padding: 14px 18px; font-size: 15px; color: var(--gris-700); line-height: 1.65; border-top: 1px solid var(--gris-200); }
        .wg-tabla td + td, .wg-tabla th + th { border-left: 1px solid var(--gris-200); }
        .wg-tabla ul { margin: 0; padding-left: 18px; display: grid; gap: 8px; }
        @media (min-width: 640px) { .wg-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
        @media (min-width: 900px) {
          .wg-bonus { grid-template-columns: 1fr 1fr; gap: 56px; }
          .wg-dos { grid-template-columns: 1fr 1fr; }
          .wg-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const inscripciones = await prisma.promoEntry.count({ where: { promo: PROMO_SLUG } })
  const cerradaAlCargar = promoCerrada()
  let resultados: Props['resultados'] = null
  if (cerradaAlCargar && RESULTADOS_PUBLICADOS) {
    // Solo lo que autorizan las bases: nombre comercial, cuenta de Instagram y orden del suplente
    const filas = await prisma.promoEntry.findMany({
      where: { promo: PROMO_SLUG, status: { in: ['selected', 'substitute'] } },
      select: { businessName: true, instagram: true, substituteOrder: true, status: true },
      orderBy: [{ substituteOrder: 'asc' }, { businessName: 'asc' }],
    })
    const limpiar = ({ businessName, instagram, substituteOrder }: Seleccionado) => ({ businessName, instagram, substituteOrder })
    resultados = {
      ganadores: filas.filter(f => f.status === 'selected').map(limpiar),
      suplentes: filas.filter(f => f.status === 'substitute').map(limpiar),
    }
  }
  return { props: { inscripciones, cerradaAlCargar, resultados } }
}
