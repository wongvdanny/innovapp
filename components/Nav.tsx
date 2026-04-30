import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '25px 64px',
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(26,61,79,0.07)',
      boxShadow: scrolled ? '0 4px 32px rgba(13,31,45,0.1)' : 'none',
      transition: 'box-shadow .3s',
    }}>
      <Link href="/">
        <img src="/logo.webp" alt="innovapp" style={{ height: 32, width: 'auto' }} />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="nav-links">
        {[
          ['#empresa', 'Empresa'],
          ['#servix', 'Servix'],
          ['#funciones', 'Funciones'],
          ['#precios', 'Precios'],
          ['#contacto', 'Contacto'],
        ].map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 18, fontWeight: 600, color: '#193746', transition: 'color .2s', letterSpacing: '-0.2px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a3d4f')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a6572')}>
            {label}
          </a>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/login" style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #eef1f4', fontSize: 16, fontWeight: 600, color: '#1a3d4f', background: '#f8fafb' }}>
          Entrar
        </Link>
        <Link href="/registro" style={{ padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 16, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', boxShadow: '0 4px 14px rgba(42,179,170,.3)' }}>
          Empezar →
        </Link>
      </div>
      <style>{`@media(max-width:768px){.nav-links{display:none}}`}</style>
    </nav>
  )
}
