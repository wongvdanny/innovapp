import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Gift, X } from 'lucide-react'
import Icono from '../Icono'
import { MAX_WEBS, promoCerrada } from '../../lib/promo/config'

// Aviso de la promoción /webgratis en el hero de la home, hasta PROMO_END. Se puede cerrar
// (se recuerda en este navegador).
const CLAVE = 'innovapp_banner_webgratis_cerrado'

export default function BannerPromo() {
  const [visible, setVisible] = useState(!promoCerrada())
  useEffect(() => {
    try { if (localStorage.getItem(CLAVE) === '1') setVisible(false) } catch { /* sin localStorage */ }
  }, [])
  if (!visible) return null
  const cerrar = () => {
    setVisible(false)
    try { localStorage.setItem(CLAVE, '1') } catch { /* sin localStorage */ }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(238,117,40,.16)', border: '1px solid rgba(238,117,40,.45)', borderRadius: 14, padding: '10px 10px 10px 14px', margin: '0 0 22px', maxWidth: 640 }}>
      <span style={{ color: '#f4a15c' }}><Icono icono={Gift} size={20} /></span>
      <Link href="/webgratis" style={{ flex: 1, color: 'white', fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
        {MAX_WEBS} webs gratis + IA para negocios. <span style={{ color: '#f4a15c', textDecoration: 'underline' }}>Inscríbete antes del 15/12</span>
      </Link>
      <button type="button" onClick={cerrar} aria-label="Cerrar aviso de la promoción"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.8)', cursor: 'pointer', padding: 6, display: 'flex' }}>
        <Icono icono={X} size={18} />
      </button>
    </div>
  )
}
