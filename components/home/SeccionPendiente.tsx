import type { ReactNode } from 'react'

// Envoltorio mínimo de las secciones de la home que aún no tienen contenido: título, ancla
// y una línea. Se sustituye por el componente definitivo cuando haya contenido.
export default function SeccionPendiente({ id, titulo, fondo = 'white', children = 'Próximamente.' }: {
  id: string
  titulo: string
  fondo?: string
  children?: ReactNode
}) {
  return (
    <section id={id} style={{ padding: 'clamp(48px,8vw,72px) 16px', background: fondo }}>
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 12px' }}>{titulo}</h2>
        <div style={{ fontSize: 16, color: 'var(--gris-600)', lineHeight: 1.7 }}>{children}</div>
      </div>
    </section>
  )
}
