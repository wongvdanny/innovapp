import Link from 'next/link'
import {
  Bot, Building2, ChartColumn, Code, Gauge, GraduationCap, Inbox, LifeBuoy, Lock, Megaphone, MessageCircle,
  PencilOff, Phone, RefreshCw, Search, SearchX, ShieldCheck, ShoppingCart, Smartphone, Store, Workflow, Zap,
  type LucideIcon,
} from 'lucide-react'
import Seo from '../../components/Seo'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Faq, { faqJsonLd, type FaqItem } from '../../components/Faq'
import Icono from '../../components/Icono'
import { COMMERCIAL_PHONE, telLink, waLink } from '../../lib/constants'

const MENSAJE_WHATSAPP = 'Hola, me interesa una web o un desarrollo a medida para mi negocio'

const PROBLEMAS: [LucideIcon, string, string][] = [
  [Gauge, 'Tu web es lenta', 'Si tarda en cargar, el visitante se va antes de ver lo que ofreces, y Google también lo tiene en cuenta.'],
  [SearchX, 'No apareces en Google', 'Sin una base técnica de SEO, quien busca tus servicios encuentra antes a la competencia.'],
  [Inbox, 'No genera contactos', 'Hay visitas, pero no se convierten en llamadas, mensajes ni pedidos porque no está claro qué hacer.'],
  [PencilOff, 'Es imposible de actualizar', 'Cada cambio depende de otra persona o de un sistema que ya nadie sabe tocar.'],
  [ShoppingCart, 'Tu tienda online se ha quedado atrás', 'Versiones antiguas de PrestaShop o WooCommerce, módulos que fallan y un proceso de compra que pierde ventas.'],
]

const SERVICIOS: { icono: LucideIcon; titulo: string; texto: string; enlace?: [string, string] }[] = [
  { icono: Building2, titulo: 'Webs corporativas', texto: 'Una web clara que explica qué haces, transmite confianza y lleva al visitante a contactar contigo.' },
  { icono: Megaphone, titulo: 'Landing pages para campañas', texto: 'Páginas con un único objetivo, preparadas para Google Ads y redes sociales, con la medición lista desde el primer día.' },
  { icono: Store, titulo: 'Tiendas online PrestaShop y WooCommerce', texto: 'Tiendas pensadas para tu catálogo y tu forma de vender: pagos, envíos y el diseño de tu marca.', enlace: ['/desarrollo-prestashop-woocommerce', 'Ver tiendas PrestaShop y WooCommerce'] },
  { icono: RefreshCw, titulo: 'Migraciones y actualizaciones', texto: 'Llevamos tu tienda PrestaShop o WooCommerce a versiones actuales sin perder productos, clientes ni pedidos.', enlace: ['/desarrollo-prestashop-woocommerce', 'Ver migraciones y actualizaciones'] },
  { icono: Code, titulo: 'Desarrollo a medida', texto: 'Aplicaciones web, paneles de gestión e integraciones con tus programas o con servicios externos mediante API.' },
  { icono: LifeBuoy, titulo: 'Mantenimiento y soporte', texto: 'Actualizaciones, seguridad, corrección de errores y pequeños cambios para que tu web siga funcionando bien.' },
]

const INCLUIDO: [LucideIcon, string, string][] = [
  [Search, 'SEO técnico', 'Estructura, metadatos, datos estructurados y sitemap para que Google entienda tu web.'],
  [Smartphone, 'Diseño responsive', 'Se ve y se usa bien en el móvil, que es desde donde llega la mayoría de visitas.'],
  [Gauge, 'Velocidad', 'Optimizada para las Core Web Vitals de Google: carga rápida y sin saltos.'],
  [ShieldCheck, 'RGPD y textos legales', 'Banner de cookies con consentimiento, aviso legal y política de privacidad.'],
  [ChartColumn, 'Analítica', 'Google Analytics 4 y Google Tag Manager configurados para medir contactos y ventas.'],
  [Lock, 'Certificado SSL', 'Tu web siempre en https, sin avisos de seguridad en el navegador.'],
  [GraduationCap, 'Formación', 'Te enseñamos a gestionar los contenidos para que no dependas de nadie en el día a día.'],
]

const PASOS: [string, string][] = [
  ['Reunión', 'Nos cuentas tu negocio, tus objetivos y lo que no te funciona de tu web actual.'],
  ['Propuesta', 'Te enviamos qué vamos a hacer, en qué plazo y con qué presupuesto, cerrado y por escrito.'],
  ['Diseño', 'Preparamos el diseño de las páginas clave y lo ajustamos contigo antes de programar.'],
  ['Desarrollo', 'Construimos la web, cargamos los contenidos y la probamos en móvil y ordenador.'],
  ['Lanzamiento y seguimiento', 'La publicamos, comprobamos que todo se mide bien y te acompañamos en las primeras semanas.'],
]

const TECNOLOGIAS = ['Next.js', 'React', 'PrestaShop', 'WooCommerce / WordPress', 'Node.js', 'PostgreSQL']

const FAQ: FaqItem[] = [
  {
    pregunta: '¿Cuánto se tarda en tener la web lista?',
    respuesta: 'Depende del alcance: una landing o una web corporativa sencilla se hace antes que una tienda online o una aplicación a medida. En la propuesta te damos un plazo concreto, antes de empezar, y el desarrollo con IA nos ayuda a acortarlo.',
  },
  {
    pregunta: '¿La web será mía?',
    respuesta: 'Sí. El dominio y los contenidos son tuyos y te entregamos los accesos a la web. Si algún día quieres cambiar de proveedor, puedes llevártela.',
  },
  {
    pregunta: '¿Ofrecéis mantenimiento?',
    respuesta: 'Sí, de forma opcional: actualizaciones, seguridad, corrección de errores y pequeños cambios. Lo acordamos según lo que necesite tu web.',
  },
  {
    pregunta: '¿La web estará preparada para aparecer en Google?',
    respuesta: 'Sí. El SEO técnico va incluido de serie: estructura, metadatos, datos estructurados, velocidad y sitemap. El posicionamiento continuado (contenidos, enlaces) es un trabajo aparte que también podemos hacer contigo.',
  },
  {
    pregunta: '¿Podré editar la web yo mismo?',
    respuesta: 'Sí. Te dejamos un gestor de contenidos para cambiar textos, imágenes o productos sin tocar código, y te enseñamos a usarlo.',
  },
  {
    pregunta: 'Ya tengo una web, ¿podéis migrarla?',
    respuesta: 'Sí. Migramos los contenidos a la nueva web y redirigimos las direcciones antiguas a las nuevas para no perder el posicionamiento que ya tienes.',
  },
  {
    pregunta: '¿Cuánto cuesta una web a medida?',
    respuesta: 'Cada proyecto es distinto, así que el presupuesto se da a medida tras una llamada para entender qué necesitas. Lo recibes cerrado y por escrito antes de empezar.',
  },
]

const POSTS: [string, string][] = [
  ['/blog/automatizar-consultas-repetitivas-whatsapp', 'Deja de perder horas en WhatsApp: automatiza la gestión de consultas repetitivas'],
  ['/blog/negocio-pierde-clientes-fuera-horario', 'Cómo no perder clientes fuera de horario con un agente de IA en WhatsApp'],
]

const DESCRIPCION_SERVICIO = 'Desarrollo web a medida en Asturias y toda España: webs rápidas que posicionan y venden, con IA para reducir plazos. Escríbenos por WhatsApp.'

const h2: React.CSSProperties = { fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 14px' }
const intro: React.CSSProperties = { fontSize: 16, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 auto 32px', maxWidth: 640 }
const tarjeta: React.CSSProperties = { background: 'white', border: '1px solid var(--gris-200)', borderRadius: 'var(--radio-lg)', padding: 24 }
const icono: React.CSSProperties = { width: 46, height: 46, borderRadius: 'var(--radio-md)', background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }

function Ctas() {
  return (
    <div className="dw-ctas">
      <a href={waLink(MENSAJE_WHATSAPP)} target="_blank" rel="noopener noreferrer"
        style={{ padding: '15px 26px', borderRadius: 12, background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontWeight: 700, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icono icono={MessageCircle} size={20} />Hablar por WhatsApp
      </a>
      <a href={telLink()}
        style={{ padding: '15px 26px', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.22)', color: 'white', fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icono icono={Phone} size={20} />Llamar ahora <span style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>({COMMERCIAL_PHONE})</span>
      </a>
    </div>
  )
}

export default function DesarrolloWeb() {
  return (
    <>
      <Seo
        title="Desarrollo web a medida: webs rápidas que venden | Innovapp"
        description={DESCRIPCION_SERVICIO}
        canonical="/desarrollo/web"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Desarrollo web a medida',
            serviceType: 'Desarrollo web',
            description: DESCRIPCION_SERVICIO,
            url: 'https://innovapp.es/desarrollo/web',
            provider: { '@id': 'https://innovapp.es/#organization' },
            areaServed: [
              { '@type': 'AdministrativeArea', name: 'Asturias' },
              { '@type': 'Country', name: 'España' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://innovapp.es/' },
              { '@type': 'ListItem', position: 2, name: 'Desarrollo', item: 'https://innovapp.es/desarrollo' },
              { '@type': 'ListItem', position: 3, name: 'Desarrollo web', item: 'https://innovapp.es/desarrollo/web' },
            ],
          },
          faqJsonLd(FAQ),
        ]}
      />
      <Nav />

      <main>
        {/* 1. Hero */}
        <section style={{ background: 'linear-gradient(160deg,#1e1e1e 0%,#1e1e1e 60%,#33261c 100%)', padding: 'clamp(120px,16vw,160px) 16px clamp(56px,8vw,90px)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <nav aria-label="Ruta de navegación" style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 18 }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,.7)' }}>Inicio</Link> ›{' '}
              <Link href="/desarrollo" style={{ color: 'rgba(255,255,255,.7)' }}>Desarrollo</Link> ›{' '}
              <span aria-current="page" style={{ color: 'white' }}>Desarrollo web</span>
            </nav>
            <h1 style={{ fontSize: 'clamp(31px,6vw,56px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, color: 'white', margin: '0 0 18px' }}>
              Desarrollo web a medida: <span style={{ color: '#f4a15c' }}>webs rápidas que posicionan y venden</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', color: 'rgba(255,255,255,.78)', lineHeight: 1.6, maxWidth: 680, margin: '0 0 28px' }}>
              Diseñamos y desarrollamos webs, tiendas online y aplicaciones para negocios de Asturias y de toda España. Desarrollamos con IA para acortar plazos y ajustar el coste, sin renunciar a una web rápida, bien posicionada y fácil de gestionar.
            </p>
            <Ctas />
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', margin: '18px 0 0' }}>
              <strong style={{ color: '#f4a15c' }}>+10 años</strong> desarrollando webs y aplicaciones, ahora con IA.
            </p>
          </div>
        </section>

        {/* 2. Problemas */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>¿Te suena alguno de estos problemas?</h2>
            <p style={intro}>Una web que no trae clientes es un gasto. Estos son los problemas que más vemos y que resolvemos.</p>
            <div className="dw-grid" style={{ textAlign: 'left' }}>
              {PROBLEMAS.map(([ic, titulo, texto]) => (
                <div key={titulo} style={{ ...tarjeta, background: 'var(--gris-50)' }}>
                  <div style={icono}><Icono icono={ic} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>{titulo}</h3>
                  <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: 0 }}>{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Servicios */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--gris-50)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Qué desarrollamos</h2>
            <p style={intro}>Desde una landing para tu próxima campaña hasta una aplicación a medida conectada con tus programas.</p>
            <div className="dw-grid" style={{ textAlign: 'left' }}>
              {SERVICIOS.map(s => (
                <div key={s.titulo} style={{ ...tarjeta, display: 'flex', flexDirection: 'column' }}>
                  <div style={icono}><Icono icono={s.icono} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '0 0 8px' }}>{s.titulo}</h3>
                  <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.65, margin: s.enlace ? '0 0 14px' : 0, flex: 1 }}>{s.texto}</p>
                  {s.enlace && <Link href={s.enlace[0]} style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-brand-orange-texto)' }}>{s.enlace[1]} →</Link>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Desarrollo con IA */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: '#12141a' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...h2, color: '#ece9e2', textAlign: 'center' }}>Desarrollo web con IA: qué ganas tú</h2>
            <p style={{ ...intro, color: '#b4bcc6', textAlign: 'center' }}>La IA no sustituye el criterio: nos quita trabajo repetitivo para dedicar el tiempo a lo que importa en tu web.</p>
            <div className="dw-grid">
              {([
                [Zap, 'Más rapidez', 'Avanzamos más rápido en la parte repetitiva del desarrollo, así que tu web llega antes y el presupuesto lo nota.'],
                [Workflow, 'Automatizaciones', 'Formularios que llegan a tu email o a tu CRM, avisos o informes: lo que hoy haces a mano puede funcionar solo.'],
                [Bot, 'Un agente IA con tu WhatsApp', 'Tu web puede ir acompañada de un agente que contesta tu WhatsApp las 24 horas, da citas y pasa a una persona lo que lo necesita.'],
              ] as [LucideIcon, string, string][]).map(([ic, titulo, texto]) => (
                <div key={titulo} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radio-lg)', padding: 24 }}>
                  <div style={{ marginBottom: 12, color: 'var(--agentes-oro)' }}><Icono icono={ic} size={28} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ece9e2', margin: '0 0 8px' }}>{titulo}</h3>
                  <p style={{ fontSize: 15, color: '#c9cdd4', lineHeight: 1.65, margin: 0 }}>{texto}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 16, color: '#c9cdd4', lineHeight: 1.7, textAlign: 'center', margin: '28px 0 0' }}>
              Mira cómo funcionan nuestros <Link href="/agentes-ia" style={{ color: 'var(--agentes-oro)', fontWeight: 700, textDecoration: 'underline' }}>Agentes IA para WhatsApp</Link> y la{' '}
              IA para tiendas <Link href="/agentes-ia-prestashop" style={{ color: 'var(--agentes-oro)', fontWeight: 700, textDecoration: 'underline' }}>PrestaShop</Link> y{' '}
              <Link href="/agentes-ia-woocommerce" style={{ color: 'var(--agentes-oro)', fontWeight: 700, textDecoration: 'underline' }}>WooCommerce</Link>.
            </p>
            <div style={{ maxWidth: 680, margin: '24px auto 0', fontSize: 15, color: '#c9cdd4' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#ece9e2' }}>Para leer en el blog:</p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                {POSTS.map(([href, titulo]) => (
                  <li key={href}><Link href={href} style={{ color: '#ece9e2', textDecoration: 'underline' }}>{titulo}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Incluido de serie */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Todo incluido de serie</h2>
            <p style={intro}>Lo que una web profesional necesita para funcionar desde el primer día, sin extras escondidos.</p>
            <ul className="dw-grid" style={{ listStyle: 'none', margin: 0, padding: 0, textAlign: 'left' }}>
              {INCLUIDO.map(([ic, titulo, texto]) => (
                <li key={titulo} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', ...tarjeta, background: 'var(--gris-50)' }}>
                  <div style={{ ...icono, marginBottom: 0, flexShrink: 0 }}><Icono icono={ic} /></div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', margin: '0 0 4px' }}>{titulo}</h3>
                    <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.6, margin: 0 }}>{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Proceso */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--gris-50)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ ...h2, textAlign: 'center', marginBottom: 32 }}>Cómo trabajamos</h2>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
              {PASOS.map(([titulo, texto], i) => (
                <li key={titulo} style={{ ...tarjeta, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-texto)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', margin: '0 0 4px' }}>{titulo}</h3>
                    <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.6, margin: 0 }}>{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. Tecnologías */}
        <section style={{ padding: 'clamp(48px,8vw,72px) 16px', background: 'white' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Tecnologías con las que trabajamos</h2>
            <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              {TECNOLOGIAS.map(t => (
                <li key={t} style={{ padding: '9px 16px', borderRadius: 100, border: '1px solid var(--gris-200)', background: 'var(--gris-50)', fontSize: 15, fontWeight: 600, color: '#1e1e1e' }}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8. Local */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--color-brand-orange-tint)' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={h2}>Agencia de desarrollo web en Asturias</h2>
            <p style={{ fontSize: 16, color: 'var(--gris-600)', lineHeight: 1.75, margin: 0 }}>
              Estamos en Oviedo y trabajamos con negocios de Oviedo, Gijón, Avilés y el resto de Asturias, con reuniones en persona cuando hace falta. También hacemos diseño y desarrollo web en remoto para empresas de toda España: la llamada inicial, las revisiones y el seguimiento funcionan igual por videollamada.
            </p>
          </div>
        </section>

        {/* 9. FAQ */}
        <Faq items={FAQ} titulo="Preguntas frecuentes sobre el desarrollo web a medida" tema="marca" />

        {/* 10. CTA final */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'linear-gradient(135deg,#1e1e1e,#33261c)' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ ...h2, color: 'white' }}>¿Hablamos de tu web?</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', lineHeight: 1.7, margin: '0 0 28px' }}>
              Cuéntanos qué necesitas y te preparamos una propuesta a medida, con plazo y presupuesto cerrados.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Ctas /></div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', margin: '20px 0 0' }}>
              ¿Prefieres escribirnos con calma?{' '}
              <Link href="/contacto" style={{ color: '#f4a15c', fontWeight: 700, textDecoration: 'underline' }}>Usa el formulario de contacto</Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .dw-ctas { display: flex; flex-direction: column; gap: 12px; }
        .dw-grid { display: grid; gap: 16px; }
        @media (min-width: 600px) {
          .dw-ctas { flex-direction: row; flex-wrap: wrap; }
          .dw-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (min-width: 960px) {
          .dw-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </>
  )
}
