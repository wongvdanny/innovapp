import Link from 'next/link'
import { Heart } from 'lucide-react'
import Icono from './Icono'
import Logo from './Logo'
import LegalIdentity from './LegalIdentity'
import { COOKIE_SETTINGS_EVENT } from './CookieBanner'

const linkStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, color: 'rgba(255,255,255,.62)',
  marginBottom: 10, textDecoration: 'none', transition: 'color .2s',
}
const hoverIn = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = '#ee7528' }
const hoverOut = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,.62)' }

export default function Footer() {
  return (
    <footer style={{ background: '#161616', padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="footer-grid" style={{ marginBottom: 40 }}>
          <div>
            <Logo variant="dark" height={36} style={{ marginBottom: 14, opacity: 0.6 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.62)', lineHeight: 1.75, maxWidth: 240 }}>
              Innovapp desarrolla software para negocios: agentes de IA para WhatsApp, Servix para hostelería y GymStack para gimnasios.
            </p>
          </div>
          {[
            { title: 'Empresa', links: [['/contacto','Contacto'],['/baja','Solicitar baja']] },
            { title: 'Servix',  links: [['/servix','Ver producto'],['/servix#precios','Precios'],['https://servix.innovapp.es','Acceder']] },
            { title: 'GymStack', links: [['/gymstack','Ver producto'],['/gymstack#precios','Precios'],['https://gymstack.innovapp.es','Acceder']] },
            { title: 'Agentes IA', links: [['/agentes-ia','Ver producto'],['/agentes-ia-prestashop','Para PrestaShop'],['/agentes-ia-woocommerce','Para WooCommerce']] },
            { title: 'Legal',   links: [['/aviso-legal','Aviso legal'],['/privacidad','Política de privacidad'],['/cookies','Cookies'],['/uso','Términos de Uso']] },
          ].map(col => (
            <div key={col.title}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</h2>
              {col.links.map(([href, label]) => (
                href.startsWith('/') ? (
                  <Link key={href} href={href} style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{label}</Link>
                ) : (
                  <a key={href} href={href} style={linkStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{label}</a>
                )
              ))}
            </div>
          ))}
        </div>
        <LegalIdentity tono="oscuro" />
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.58)', margin: 0 }}>© {new Date().getFullYear()} <span style={{ color: '#ee7528' }}>Innovapp</span> · Todos los derechos reservados</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT))}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'rgba(255,255,255,.58)', cursor: 'pointer', textDecoration: 'underline' }}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              Gestionar cookies
            </button>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.58)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Hecho con <Icono icono={Heart} size={14} color="#ee7528" /><span className="sr-only">amor</span> en España</p>
          </div>
        </div>
      </div>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 40px;
        }
        @media(max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media(max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      `}</style>
    </footer>
  )
}
