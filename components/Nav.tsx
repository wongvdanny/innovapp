'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  const links = [['#empresa','Empresa'],['#productos','Productos'],['#precios','Precios'],['#contacto','Contacto']]
  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(26,61,79,0.07)', boxShadow: scrolled ? '0 4px 32px rgba(13,31,45,0.1)' : 'none', transition: 'box-shadow .3s' }}>
        <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 36, width: 'auto' }} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-desktop">
          {links.map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 15, fontWeight: 600, color: '#4a6572', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1a3d4f')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a6572')}>{label}</a>
          ))}
          <a href="/servix" style={{ fontSize: 15, fontWeight: 600, color: '#2ab3aa', transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a8a84')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2ab3aa')}>Servix</a>
        </div>
        <div style={{ display: 'flex', gap: 10 }} className="nav-desktop">
          <Link href="/login" style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #eef1f4', fontSize: 14, fontWeight: 600, color: '#1a3d4f', background: '#f8fafb', textDecoration: 'none' }}>Entrar</Link>
          <Link href="/registro?plan=free" style={{ padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', textDecoration: 'none', boxShadow: '0 4px 14px rgba(42,179,170,.3)' }}>Empezar gratis →</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="nav-mobile" style={{ background: 'none', border: '1px solid #eef1f4', borderRadius: 8, padding: '8px 10px', cursor:'pointer', fontSize: 18 }}>
          {open ? '✕' : '☰'}
        </button>
      </nav>
      {open && (
        <div className="nav-mobile" style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99, background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#1a3d4f', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="/servix" onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#2ab3aa', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>Servix</a>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #eef1f4', fontSize: 14, fontWeight: 600, color: '#1a3d4f', background: '#f8fafb', textDecoration: 'none', textAlign: 'center' }}>Entrar</Link>
            <Link href="/registro?plan=free" onClick={() => setOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', textDecoration: 'none', textAlign: 'center' }}>Empezar gratis →</Link>
          </div>
        </div>
      )}
    <style>{`
      @media(max-width: 768px) { .nav-desktop { display: none !important; } }
      @media(min-width: 769px) { .nav-mobile { display: none !important; } }
    `}</style>
    </>
  )
}
