'use client'
import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import Icono from './Icono'
import Link from 'next/link'
import Logo from './Logo'
import { MENUS, type MenuSeccion } from '../data/menu'
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [movilAbierto, setMovilAbierto] = useState<string | null>(null)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  const links = [['/','Inicio']]
  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,30,30,0.07)', boxShadow: scrolled ? '0 4px 32px rgba(30,30,30,0.1)' : 'none', transition: 'box-shadow .3s' }}>
        <Link href="/"><Logo variant="light" height={60} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-desktop">
          {links.map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 15, fontWeight: 600, color: 'var(--gris-600)', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1e1e1e')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--gris-600)')}>{label}</a>
          ))}
          <a href="/servix" style={{ fontSize: 15, fontWeight: 600, color: '#ee7528', transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c85f1b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#ee7528')}>Servix</a>
          <a href="/gymstack" style={{ fontSize: 15, fontWeight: 600, color: '#a855f7', transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a855f7')}>GymStack</a>
          {MENUS.map(m => <Desplegable key={m.clave} menu={m} />)}
          <Link href="/blog" style={{ fontSize: 15, fontWeight: 600, color: 'var(--gris-600)', transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1e1e1e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--gris-600)')}>Blog</Link>
          <Link href="/contacto" style={{ fontSize: 15, fontWeight: 600, color: 'var(--gris-600)', transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1e1e1e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--gris-600)')}>Contacto</Link>
        </div>
        <div style={{ display: 'flex', gap: 10 }} className="nav-desktop">
          <Link href="/login" style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid var(--gris-200)', fontSize: 14, fontWeight: 600, color: '#1e1e1e', background: 'var(--gris-50)', textDecoration: 'none' }}>Entrar</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="nav-mobile" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} style={{ background: 'none', border: '1px solid var(--gris-200)', borderRadius: 8, padding: '8px 10px', cursor:'pointer', color: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icono icono={open ? X : Menu} />
        </button>
      </nav>
      {open && (
        <div className="nav-mobile" style={{ position: 'fixed', top: 82, left: 0, right: 0, zIndex: 99, background: 'white', borderBottom: '1px solid var(--gris-200)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#1e1e1e', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="/servix" onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#ee7528', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>Servix</a>
          <a href="/gymstack" onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#a855f7', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>GymStack</a>
          {MENUS.map(m => {
            const abierto = movilAbierto === m.clave
            return (
              <div key={m.clave}>
                <button type="button" aria-expanded={abierto} aria-controls={`submenu-movil-${m.clave}`} onClick={() => setMovilAbierto(abierto ? null : m.clave)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', borderBottom: '1px solid #f0f4f6', padding: '12px 0', fontSize: 16, fontWeight: 600, color: m.color, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
                  {m.etiqueta}<span aria-hidden style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                </button>
                <div id={`submenu-movil-${m.clave}`} hidden={!abierto}>
                  {[{ href: m.href, texto: `Ver todo ${m.etiqueta}` }, ...m.items].map(({ href, texto }) => (
                    <a key={href} href={href} onClick={() => setOpen(false)} style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--gris-600)', padding: '12px 0 12px 20px', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>{texto}</a>
                  ))}
                </div>
              </div>
            )
          })}
          <Link href="/blog" onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#1e1e1e', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>Blog</Link>
          <Link href="/contacto" onClick={() => setOpen(false)} style={{ fontSize: 16, fontWeight: 600, color: '#1e1e1e', padding: '12px 0', borderBottom: '1px solid #f0f4f6', textDecoration: 'none' }}>Contacto</Link>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--gris-200)', fontSize: 14, fontWeight: 600, color: '#1e1e1e', background: 'var(--gris-50)', textDecoration: 'none', textAlign: 'center' }}>Entrar</Link>
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

// Submenú de escritorio: se abre con hover o con el botón (clic, toque, Enter o Espacio) y se
// cierra al salir con el ratón o el foco, con Esc (devuelve el foco al botón) o con un clic fuera.
function Desplegable({ menu }: { menu: MenuSeccion }) {
  const [abierto, setAbierto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  // Si se abrió por hover, el clic siguiente no debe cerrarlo (ratón y tablets con toque)
  const porHover = useRef(false)
  const id = `submenu-${menu.clave}`

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAbierto(false); boton.current?.focus() } }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', esc) }
  }, [abierto])

  return (
    <div ref={raiz} style={{ position: 'relative' }}
      onMouseEnter={() => { porHover.current = true; setAbierto(true) }}
      onMouseLeave={() => { porHover.current = false; setAbierto(false) }}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setAbierto(false) }}>
      <button ref={boton} type="button" aria-expanded={abierto} aria-controls={id}
        onClick={() => { if (porHover.current) { porHover.current = false; return } setAbierto(a => !a) }}
        style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: abierto ? menu.colorActivo : menu.color, transition: 'color .2s' }}>
        {menu.etiqueta} <span aria-hidden>▾</span>
      </button>
      <div id={id} hidden={!abierto} style={{ position: 'absolute', top: '100%', left: -16, paddingTop: 14, minWidth: 240 }}>
        <div style={{ background: 'white', border: '1px solid var(--gris-200)', borderRadius: 12, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          {[{ href: menu.href, texto: `Ver todo ${menu.etiqueta}` }, ...menu.items].map(({ href, texto }) => (
            <a key={href} href={href} style={{ display: 'block', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--gris-600)', textDecoration: 'none', transition: 'background .2s, color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gris-50)'; e.currentTarget.style.color = '#1e1e1e' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gris-600)' }}>{texto}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
