import Link from 'next/link'
import Seo from '../../components/Seo'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { MENUS } from '../../data/menu'
import { waLink } from '../../lib/constants'

// Hub de la sección «Desarrollo»: las tarjetas salen de los ítems del submenú (data/menu.ts).
const DESARROLLO = MENUS.find(m => m.clave === 'desarrollo')!

export default function DesarrolloHub() {
  return (
    <>
      <Seo
        title="Desarrollo web y a medida | Innovapp"
        description="Desarrollo web a medida, tiendas online PrestaShop y WooCommerce y aplicaciones para tu negocio, desde Asturias para toda España. Cuéntanos tu proyecto."
        canonical="/desarrollo"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://innovapp.es/' },
            { '@type': 'ListItem', position: 2, name: 'Desarrollo', item: 'https://innovapp.es/desarrollo' },
          ],
        }}
      />
      <Nav />
      <main>
        <section style={{ background: 'linear-gradient(160deg,#1e1e1e 0%,#1e1e1e 60%,#33261c 100%)', padding: 'clamp(120px,16vw,160px) 16px clamp(56px,8vw,80px)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(30px,5.5vw,52px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, color: 'white', margin: '0 0 18px' }}>
              Desarrollo <span style={{ color: '#f4a15c' }}>web y a medida</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', color: 'rgba(255,255,255,.75)', lineHeight: 1.6, margin: 0 }}>
              Webs, tiendas online y aplicaciones hechas para tu forma de trabajar. +10 años desarrollando webs y aplicaciones, ahora con IA.
            </p>
          </div>
        </section>

        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--gris-50)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', textAlign: 'center', margin: '0 0 32px' }}>Qué podemos hacer por ti</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
              {DESARROLLO.items.map(item => (
                <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid var(--gris-200)', borderRadius: 'var(--radio-lg)', padding: 26, boxShadow: 'var(--sombra-sm)' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e1e1e', margin: '0 0 10px' }}>{item.texto}</h3>
                  <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 0 16px', flex: 1 }}>{item.descripcion}</p>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-brand-orange-texto)' }}>Ver {item.texto.toLowerCase()} →</span>
                </Link>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 16, color: 'var(--gris-600)', margin: '36px 0 0' }}>
              ¿No sabes por dónde empezar?{' '}
              <a href={waLink('Hola, me interesa una web o un desarrollo a medida para mi negocio')} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-orange-texto)', fontWeight: 700, textDecoration: 'underline' }}>Escríbenos por WhatsApp</a>
              {' '}o <Link href="/contacto" style={{ color: 'var(--color-brand-orange-texto)', fontWeight: 700, textDecoration: 'underline' }}>usa el formulario de contacto</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
