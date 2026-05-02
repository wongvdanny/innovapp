import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#07111a', padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="footer-grid" style={{ marginBottom: 40 }}>
          <div>
            <img src="/logo.webp" alt="innovapp" style={{ height: 36, filter: 'brightness(0) invert(1) opacity(.6)', marginBottom: 14 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', lineHeight: 1.75, maxWidth: 240 }}>
              Desarrollamos software para el sector de la restauración y hostelería.
            </p>
          </div>
          {[
            { title: 'Empresa', links: [['#empresa','Quiénes somos'],['mailto:hola@innovapp.es','Contacto']] },
            { title: 'Servix',  links: [['#funciones','Funciones'],['#precios','Precios'],['https://servix.innovapp.es','Acceder']] },
            { title: 'Legal',   links: [['/privacidad','Privacidad'],['/aviso-legal','Aviso Legal'],['/cookies','Cookies'],['/uso','Términos de Uso']] },
          ].map(col => (
            <div key={col.title}>
              <h5 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</h5>
              {col.links.map(([href, label]) => (
                <a key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 10, textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#2ab3aa')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.35)')}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', margin: 0 }}>© 2025 <span style={{ color: '#2ab3aa' }}>innovapp</span> · Todos los derechos reservados</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', margin: 0 }}>Hecho con ❤️ para la hostelería española</p>
        </div>
      </div>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
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
