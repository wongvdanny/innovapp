import { useEffect, useState } from 'react'
import { Check, CircleCheck, Copy, Facebook, Instagram, MessageCircle } from 'lucide-react'
import Seo from '../../components/Seo'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Icono from '../../components/Icono'
import { track } from '../../lib/track'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, MAX_WEBS } from '../../lib/promo/config'

const URL_PROMO = 'https://innovapp.es/webgratis'
const TEXTO_COMPARTIR = `${MAX_WEBS} webs gratis + asistente IA para negocios de toda España. Inscríbete aquí: ${URL_PROMO}`

const boton: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 12,
  fontWeight: 700, fontSize: 15, border: '1.5px solid var(--gris-300)', background: 'white', color: '#1e1e1e', cursor: 'pointer', fontFamily: 'inherit',
}

export default function Gracias() {
  const [copiado, setCopiado] = useState(false)
  // Una vez por carga; sin datos personales (GTM dispara el píxel de Meta «CompleteRegistration» según el consentimiento)
  useEffect(() => { track('promo_registro', { promo: 'webgratis' }) }, [])

  const copiar = async () => {
    try { await navigator.clipboard.writeText(URL_PROMO); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch { /* sin portapapeles */ }
  }

  return (
    <>
      <Seo title="¡Inscripción confirmada! | Innovapp" description="Tu inscripción en la promoción «4 webs gratis + IA» está confirmada." canonical="/webgratis/gracias" noindex />
      <Nav />
      <main style={{ background: 'var(--gris-50)', padding: 'clamp(120px,16vw,150px) 16px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: 'white', border: '1px solid var(--gris-200)', borderRadius: 24, padding: 'clamp(24px,6vw,44px)', textAlign: 'center' }}>
          <div style={{ color: '#15803d', display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Icono icono={CircleCheck} size={56} /></div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 14px' }}>¡Inscripción confirmada!</h1>
          <p style={{ fontSize: 17, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 0 24px' }}>
            Ya participas. El 15 de diciembre de 2026 elegiremos {MAX_WEBS} negocios y les avisaremos por email.
            Recuerda seguir a <strong style={{ color: '#1e1e1e' }}>@{INSTAGRAM_HANDLE}</strong> en Instagram durante toda la promoción: es un requisito.
          </p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
            style={{ ...boton, border: 'none', background: 'linear-gradient(135deg,#f4a15c,#ee7528)', fontSize: 16, padding: '15px 26px' }}>
            <Icono icono={Instagram} size={20} /> Seguir a @{INSTAGRAM_HANDLE}
          </a>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', margin: '36px 0 14px' }}>¿Conoces otro negocio al que le vendría bien? Compártelo</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {/* Botón y no enlace a wa.me: un <a href="https://wa.me/…"> contaría como click_whatsapp (conversión de Ads) */}
            <button type="button" style={boton} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(TEXTO_COMPARTIR)}`, '_blank', 'noopener')}>
              <Icono icono={MessageCircle} size={18} /> WhatsApp
            </button>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_PROMO)}`} target="_blank" rel="noopener noreferrer" style={boton}>
              <Icono icono={Facebook} size={18} /> Facebook
            </a>
            <button type="button" style={boton} onClick={copiar} aria-live="polite">
              <Icono icono={copiado ? Check : Copy} size={18} /> {copiado ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
