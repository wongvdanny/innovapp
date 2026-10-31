import Head from 'next/head'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Hero from '../components/home/Hero'
import Servicios from '../components/home/Servicios'
import Demo from '../components/home/Demo'
import Productos from '../components/home/Productos'
import Testimonials from '../components/home/Testimonials'
import Stats from '../components/home/Stats'
import Proceso from '../components/home/Proceso'
import SobreMi from '../components/home/SobreMi'
import Precios from '../components/home/Precios'
import FaqHome from '../components/home/FaqHome'
import Contacto from '../components/home/Contacto'
import Newsletter from '../components/home/Newsletter'

export default function Home() {
  return (
    <>
      <Seo
        title="innovapp — Agentes de IA y automatización a medida para tu negocio"
        description="Innovapp desarrolla Agentes de IA que atienden tu WhatsApp 24 horas y automatiza a medida cualquier proceso repetitivo de tu negocio: reservas, pedidos, presupuestos y seguimientos. También ofrecemos Servix (TPV para restaurantes) y GymStack (gestión de gimnasios)."
        canonical="/"
      />
      <Head><meta name="author" content="innovapp" /></Head>

      <Nav />

      <main>
        <Hero />
        <Servicios />
        <Stats />
        <Demo />
        <Productos />
        <Testimonials />
        <Proceso />
        <SobreMi />
        <Precios />
        <FaqHome />
        <Contacto />
        <Newsletter />
      </main>

      <Footer />

      {/* Las anclas de la home no quedan debajo del Nav fijo */}
      <style>{`main section[id] { scroll-margin-top: 80px; }`}</style>
    </>
  )
}
