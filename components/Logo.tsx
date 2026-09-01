import type { CSSProperties } from 'react'

/**
 * Wordmark de Innovapp. Dos variantes según el fondo donde se coloca:
 *  - `light`: texto oscuro (#1E1E1E) + acento naranja  → fondos claros / blancos
 *  - `dark` : texto blanco + acento naranja            → fondos oscuros
 *
 * El ratio SIEMPRE es 830:222 (viewBox de los SVG). Para evitar deformaciones
 * accidentales el API acepta SOLO `width` O `height` (nunca ambos): la otra
 * dimensión se deriva por `aspect-ratio` en CSS. Si no se pasa ninguna, el
 * tamaño lo controla `className`/`style` (y el ratio sigue bloqueado).
 */

export const LOGO_RATIO = 830 / 222 // ≈ 3.739

type Variant = 'light' | 'dark'

type SizeProp =
  | { width: number | string; height?: never }
  | { height: number | string; width?: never }
  | { width?: never; height?: never }

type LogoProps = SizeProp & {
  variant?: Variant
  alt?: string
  className?: string
  style?: CSSProperties
}

const SRC: Record<Variant, string> = {
  light: '/brand/logo-light-bg.svg',
  dark: '/brand/logo-dark-bg.svg',
}

export default function Logo({
  variant = 'light',
  alt = 'Innovapp',
  className,
  style,
  ...size
}: LogoProps) {
  const sizeStyle: CSSProperties =
    'width' in size && size.width != null
      ? { width: size.width, height: 'auto' }
      : 'height' in size && size.height != null
        ? { height: size.height, width: 'auto' }
        : {}

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt={alt}
      width={830}
      height={222}
      decoding="async"
      className={className}
      style={{
        display: 'block',
        aspectRatio: '830 / 222',
        ...sizeStyle,
        ...style,
      }}
    />
  )
}
