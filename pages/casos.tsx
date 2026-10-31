import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import CaseCard from '../components/CaseCard'
import { CASES } from '../data/cases'

export default function CasosPage() {
  return (
    <>
      <Seo
        title="Casos: productos propios y demos | Innovapp"
        description="Lo que ha construido Innovapp: Servix (TPV y gestión para restaurantes), GymStack (gestión de gimnasios) y la demo de un agente de IA para peluquería por WhatsApp y teléfono."
        canonical="/casos"
      />
      <Nav />
      <main style={{ background: '#f8fafb', padding: 'clamp(110px,16vw,140px) 16px clamp(56px,10vw,90px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 'clamp(30px,5vw,48px)', fontWeight: 800, letterSpacing: -1.5, color: '#1e1e1e', margin: '0 0 14px' }}>Casos</h1>
            <p style={{ fontSize: 17, color: '#4a6572', lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
              Innovapp es una empresa nueva: aquí tienes nuestros productos propios y las demos que puedes probar.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
            {CASES.map(c => <CaseCard key={c.slug} caso={c} titulo="h2" />)}
          </div>
          <p style={{ textAlign: 'center', fontSize: 16, color: '#4a6572', margin: '40px 0 0' }}>
            ¿Quieres algo parecido para tu negocio?{' '}
            <Link href="/#contacto" style={{ color: '#b2561a', fontWeight: 700 }}>Pide presupuesto →</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
