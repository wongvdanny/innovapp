import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#07111a', padding: '64px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48, maxWidth: 1100, margin: '0 auto 48px' }}>
        <div>
          <img src="/logo.webp" alt="innovapp" style={{ height: 28, filter: 'brightness(0) invert(1) opacity(.6)', marginBottom: 16 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', lineHeight: 1.75, maxWidth: 240 }}>
            Desarrollamos software especializado para el sector de la restauración y la hostelería.
          </p>
        </div>
        {[
          { title: 'Empresa', links: [['#empresa','Quiénes somos'],['mailto:hola@innovapp.es','Contacto']] },
          { title: 'Servix', links: [['#funciones','Funciones'],['#precios','Precios'],['https://servix.innovapp.es','Acceder']] },
          { title: 'Legal', links: [['/privacidad','Privacidad'],['/terminos','Términos'],['/cookies','Cookies']] },
        ].map(col => (
          <div key={col.title}>
            <h5 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</h5>
            {col.links.map(([href, label]) => (
              <a key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 10, transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#2ab3aa')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.35)')}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>© 2025 <span style={{ color: '#2ab3aa' }}>innovapp</span> · Todos los derechos reservados</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>Hecho con ❤️ para la hostelería española</p>
      </div>
    </footer>
  )
}
