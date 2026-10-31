// Animación de entrada al hacer scroll (CSS en styles/globals.css). Solo se marcan las
// secciones que empiezan fuera de pantalla: lo visible al cargar (hero, LCP) nunca se oculta.
// Sin IntersectionObserver o con prefers-reduced-motion no se hace nada.

const ZONAS_PRIVADAS = ['/admin', '/dashboard', '/gestor', '/checkout', '/registro', '/login', '/bienvenida']

export function iniciarReveal(pathname: string): () => void {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return () => {}
  if (ZONAS_PRIVADAS.some(z => pathname.startsWith(z))) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const secciones = Array.from(document.querySelectorAll<HTMLElement>('section'))
    .filter(s => s.getBoundingClientRect().top > window.innerHeight)

  const obs = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue
      const el = e.target as HTMLElement
      el.classList.add('reveal-hecho')
      el.classList.remove('reveal-pendiente')
      obs.unobserve(el)
    }
  }, { rootMargin: '0px 0px -8% 0px' })

  for (const s of secciones) {
    s.classList.add('reveal-pendiente')
    obs.observe(s)
  }

  return () => {
    obs.disconnect()
    for (const s of secciones) s.classList.remove('reveal-pendiente', 'reveal-hecho')
  }
}
