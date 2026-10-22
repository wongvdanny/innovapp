import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Faq, { faqJsonLd, type FaqItem } from '../components/Faq'
import { WHATSAPP_NUMBER } from '../components/WhatsAppBubble'

// Servicio de desarrollo para tiendas PrestaShop y WooCommerce. Sin testimonios ni logos
// de clientes (empresa nueva): el contenido se ciñe a qué hacemos y cómo trabajamos.

const NARANJA = '#ee7528'
const NEGRO = '#1e1e1e'
const TEXTO = '#4a6572'
const DEGRADADO = 'linear-gradient(135deg,#f4a15c,#ee7528)'

const SERVICIOS: [string, string, string][] = [
  ['🛍️', 'Desarrollo de tiendas online', 'Creamos tu tienda con PrestaShop o WooCommerce, según lo que vendes y cómo trabajas: catálogo, pagos, envíos, impuestos y el diseño de tu marca.'],
  ['🧩', 'Módulos y plugins a medida', 'Cuando ningún módulo de PrestaShop o plugin de WooCommerce hace lo que necesitas, lo programamos: integraciones con tu ERP o tu almacén, reglas de precios, procesos propios.'],
  ['⬆️', 'Migración y actualización de PrestaShop', 'Llevamos tu tienda de PrestaShop 1.6 o 1.7 a PrestaShop 8 o 9, con productos, clientes y pedidos, y resolvemos los módulos y el tema que no sean compatibles.'],
  ['🔄', 'Actualización de WooCommerce y PHP', 'Ponemos al día WooCommerce, WordPress, los plugins y la versión de PHP del servidor, comprobando antes que todo sigue funcionando.'],
  ['🛠️', 'Mantenimiento y corrección de errores', 'Errores en el checkout, pedidos que no llegan, conflictos entre módulos o plugins, avisos tras una actualización: los localizamos y los corregimos.'],
  ['⚡', 'Rendimiento', 'Revisamos qué hace lenta tu tienda (consultas, imágenes, caché, módulos que sobran) y lo optimizamos para que cargue más rápido.'],
]

const PASOS: [string, string, string][] = [
  ['1', 'Revisamos tu tienda', 'Versión de PrestaShop o WooCommerce, PHP, módulos o plugins, tema y servidor. Así sabemos qué hay que tocar antes de dar un precio.'],
  ['2', 'Propuesta y presupuesto detallado antes de empezar', 'Te explicamos qué vamos a hacer, cuánto cuesta y qué riesgos vemos, en lenguaje claro. Sin compromiso.'],
  ['3', 'Trabajamos sobre una copia', 'Las migraciones y actualizaciones se preparan y se prueban en una copia de tu tienda, sin tocar la que está vendiendo.'],
  ['4', 'Publicamos y revisamos contigo', 'Planificamos el cambio para un momento de poco tráfico y comprobamos juntos pedidos, pagos y envíos.'],
]

const RIESGOS: [string, string][] = [
  ['Seguridad', 'Las versiones antiguas de PrestaShop, WooCommerce y PHP dejan de recibir parches de seguridad.'],
  ['Compatibilidad', 'Los módulos, plugins y pasarelas de pago nuevos dejan de funcionar con versiones antiguas.'],
  ['Servidor', 'Los proveedores de hosting retiran las versiones antiguas de PHP y la tienda puede dejar de funcionar de un día para otro.'],
  ['Velocidad', 'Las versiones actuales aprovechan mejor PHP y el servidor; una tienda lenta vende menos.'],
]

const FAQ: FaqItem[] = [
  {
    pregunta: '¿Se pierde algo al migrar de PrestaShop 1.6 o 1.7 a PrestaShop 8 o 9?',
    respuesta:
      'Los productos, las categorías, los clientes y los pedidos se migran a la nueva versión. Lo que suele necesitar trabajo son los módulos y el tema: algunos tienen versión compatible, otros hay que sustituirlos o adaptarlos. Lo revisamos antes de empezar y te lo dejamos claro en la propuesta.',
  },
  {
    pregunta: '¿Mi tienda estará cerrada durante la migración o la actualización?',
    respuesta:
      'No mientras trabajamos: preparamos y probamos todo en una copia de la tienda. Solo el paso final requiere un corte breve, que planificamos contigo para un momento de poco tráfico.',
  },
  {
    pregunta: '¿Actualizáis también WordPress, los plugins y PHP?',
    respuesta:
      'Sí. En una tienda WooCommerce actualizamos WooCommerce, WordPress, los plugins y la versión de PHP del servidor, comprobando la compatibilidad antes de cada paso.',
  },
  {
    pregunta: '¿Hacéis módulos de PrestaShop y plugins de WooCommerce a medida?',
    respuesta:
      'Sí. Si necesitas una función que ningún módulo o plugin del mercado resuelve bien, como una integración con tu ERP o tu almacén o un proceso propio de tu tienda, la desarrollamos a medida.',
  },
  {
    pregunta: '¿Cuánto cuesta?',
    respuesta:
      'Depende de la tienda: versión, número de módulos o plugins, tema y servidor. Primero la revisamos y te damos un presupuesto detallado antes de empezar, sin compromiso.',
  },
  {
    pregunta: '¿Trabajáis con tiendas de toda España?',
    respuesta:
      'Sí. Estamos en Oviedo (Asturias) y trabajamos en remoto con tiendas de toda España.',
  },
]

const MENSAJE_WHATSAPP = encodeURIComponent('Hola, quiero información sobre desarrollo o actualización de mi tienda PrestaShop / WooCommerce.')

const h2 = { fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: -1, marginBottom: 16, color: NEGRO } as const
const botonPrincipal = { display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: DEGRADADO, color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 24px rgba(238,117,40,.35)' } as const
const botonWhatsapp = { display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' } as const

export default function DesarrolloPrestashopWoocommercePage() {
  return (
    <>
      <Seo
        title="Desarrollo y actualización de PrestaShop y WooCommerce – Innovapp"
        description="Desarrollo de tiendas online, módulos y plugins a medida, migración de PrestaShop 1.6/1.7 a 8 y 9, actualización de WooCommerce y PHP, mantenimiento y rendimiento. Presupuesto detallado antes de empezar."
        canonical="/desarrollo-prestashop-woocommerce"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Desarrollo y actualización de PrestaShop y WooCommerce',
            serviceType: 'Desarrollo, migración, actualización y mantenimiento de tiendas online PrestaShop y WooCommerce',
            description:
              'Desarrollo de tiendas online, módulos y plugins a medida, migración y actualización de PrestaShop (1.6/1.7 a 8/9), actualización de WooCommerce y PHP, mantenimiento, corrección de errores y rendimiento.',
            url: 'https://innovapp.es/desarrollo-prestashop-woocommerce',
            image: 'https://innovapp.es/brand/og-image.png',
            provider: { '@type': 'Organization', name: 'innovapp', url: 'https://innovapp.es' },
            areaServed: 'ES',
            audience: { '@type': 'Audience', audienceType: 'Tiendas online con PrestaShop o WooCommerce' },
          },
          faqJsonLd(FAQ),
        ]}
      />

      <Nav />

      <section style={{ background: `linear-gradient(160deg,${NEGRO} 0%,${NEGRO} 55%,#33261c 100%)`, padding: '150px 24px 90px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(238,117,40,.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(238,117,40,.12)', border: '1px solid rgba(238,117,40,.25)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
            <span style={{ color: '#f4a15c', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ PrestaShop · WooCommerce</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,56px)', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: -1.5, margin: '0 0 22px' }}>
            Desarrollo y actualización de <span style={{ background: DEGRADADO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PrestaShop y WooCommerce</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,.65)', maxWidth: 660, margin: '0 auto 36px', lineHeight: 1.75 }}>
            Creamos tiendas online, programamos módulos y plugins a medida, migramos PrestaShop a las versiones 8 y 9 y mantenemos
            tu WooCommerce al día. Te hablamos claro, con un presupuesto detallado antes de empezar y trabajando sobre una copia de tu tienda.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contacto" style={botonPrincipal}>Pide presupuesto sin compromiso →</Link>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${MENSAJE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={botonWhatsapp}>
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={h2}>Servicios para tu tienda online</h2>
            <p style={{ fontSize: 16, color: TEXTO, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
              Desde una tienda nueva hasta poner al día una que lleva años vendiendo.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {SERVICIOS.map(([icono, titulo, texto]) => (
              <div key={titulo} style={{ background: '#f8fafb', border: '1px solid #eef1f4', borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{icono}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: NEGRO, margin: '0 0 8px' }}>{titulo}</h3>
                <p style={{ fontSize: 14, color: TEXTO, lineHeight: 1.7, margin: 0 }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#fdf0e8' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={h2}>¿Por qué no conviene quedarse en una versión antigua?</h2>
            <p style={{ fontSize: 16, color: TEXTO, maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
              Una tienda con PrestaShop 1.6 o 1.7, o con WooCommerce y PHP sin actualizar, puede seguir vendiendo hoy, pero cada mes acumula riesgo.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {RIESGOS.map(([titulo, texto]) => (
              <div key={titulo} style={{ background: 'white', borderRadius: 18, padding: '24px 22px', border: '1px solid rgba(238,117,40,.12)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NARANJA, margin: '0 0 8px' }}>{titulo}</h3>
                <p style={{ fontSize: 14, color: TEXTO, lineHeight: 1.7, margin: 0 }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={h2}>Cómo trabajamos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {PASOS.map(([n, titulo, texto]) => (
              <div key={titulo} style={{ background: '#f8fafb', border: '1px solid #eef1f4', borderRadius: 18, padding: 24 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: DEGRADADO, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NEGRO, margin: '0 0 6px' }}>{titulo}</h3>
                <p style={{ fontSize: 14, color: TEXTO, lineHeight: 1.7, margin: 0 }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: '#f8fafb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={h2}>Y cuando tu tienda esté al día, ponle IA</h2>
          <p style={{ fontSize: 16, color: TEXTO, maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.75 }}>
            Conectamos a tu tienda un agente de inteligencia artificial que atiende el WhatsApp las 24 horas con tu catálogo real:
            recomienda productos, informa del estado de los pedidos y envía el enlace de pago.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/agentes-ia-prestashop" style={{ padding: '13px 26px', borderRadius: 12, background: 'white', border: `1.5px solid ${NARANJA}`, color: NARANJA, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              IA para PrestaShop →
            </Link>
            <Link href="/agentes-ia-woocommerce" style={{ padding: '13px 26px', borderRadius: 12, background: 'white', border: `1.5px solid ${NARANJA}`, color: NARANJA, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              IA para WooCommerce →
            </Link>
          </div>
        </div>
      </section>

      <Faq items={FAQ} titulo="Preguntas frecuentes sobre desarrollo y actualización de tiendas" tema="marca" />

      <section style={{ background: `linear-gradient(135deg,${NEGRO},#33261c)`, padding: '90px 24px', textAlign: 'center' }}>
        <h2 style={{ ...h2, color: 'white' }}>Cuéntanos cómo es tu tienda</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.75 }}>
          Dinos qué plataforma y versión usas y qué necesitas. Te respondemos con una propuesta clara y sin compromiso.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/contacto" style={botonPrincipal}>Ir al formulario de contacto →</Link>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${MENSAJE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={botonWhatsapp}>
            Escríbenos por WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}
