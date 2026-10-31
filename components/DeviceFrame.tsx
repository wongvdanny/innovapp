import Image from 'next/image'

type Props = {
  src: string
  alt: string
  /** Tamaño real de la captura (para next/image y la proporción). */
  width: number
  height: number
  variante?: 'escritorio' | 'movil'
  sizes?: string
}

/**
 * Marco de dispositivo para capturas de producto (public/casos/). «escritorio» pinta una ventana
 * de navegador con la captura completa; «movil» un teléfono que muestra la parte izquierda de la
 * captura recortada en vertical (en un panel, el menú lateral y el principio del contenido).
 */
export default function DeviceFrame({ src, alt, width, height, variante = 'escritorio', sizes }: Props) {
  if (variante === 'movil') {
    return (
      <div style={{ width: '100%', maxWidth: 260, margin: '0 auto', padding: 10, borderRadius: 36, background: '#1e1e1e', boxShadow: 'var(--sombra-lg)' }}>
        <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', aspectRatio: '9 / 19.5', background: '#000' }}>
          <Image src={src} alt={alt} fill sizes={sizes ?? '260px'} style={{ objectFit: 'cover', objectPosition: 'left top' }} />
          <div aria-hidden style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 22, borderRadius: 12, background: '#1e1e1e' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 'var(--radio-md)', overflow: 'hidden', background: 'white', border: '1px solid var(--gris-200)', boxShadow: 'var(--sombra-md)' }}>
      <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', background: 'var(--gris-100)', borderBottom: '1px solid var(--gris-200)' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
      </div>
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes ?? '(max-width: 700px) 100vw, 360px'}
        style={{ width: '100%', height: 'auto', aspectRatio: '16 / 10', objectFit: 'cover', objectPosition: 'left top', display: 'block' }} />
    </div>
  )
}
