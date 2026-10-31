import { useCallback, useEffect, useRef } from 'react'

// reCAPTCHA v2 (casilla «No soy un robot») de los formularios públicos. La verificación en el
// servidor es recaptchaValido() de lib/formulario-publico.ts.
//
// Público a propósito (NEXT_PUBLIC_*): es la site key, diseñada para ir en el HTML del
// cliente. Sin ella no se carga nada y el servidor tampoco exige el token.
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string }) => number
      getResponse: (widgetId?: number) => string
      reset: (widgetId?: number) => void
    }
    __recaptchaListo?: () => void
  }
}

// El script se carga una sola vez por página, con render explícito: el widget se pinta en
// cada montaje del formulario (también tras «Enviar otro mensaje»).
let carga: Promise<void> | null = null

function cargarScript(): Promise<void> {
  if (carga) return carga
  carga = new Promise<void>((resolve, reject) => {
    window.__recaptchaListo = () => resolve()
    const s = document.createElement('script')
    s.src = 'https://www.google.com/recaptcha/api.js?onload=__recaptchaListo&render=explicit'
    s.async = true
    s.defer = true
    s.onerror = () => {
      carga = null
      s.remove()
      reject(new Error('No se ha podido cargar reCAPTCHA'))
    }
    document.head.appendChild(s)
  })
  return carga
}

/**
 * Carga perezosa: el script de Google solo se pide cuando el widget entra en pantalla o
 * cuando se llama a `cargar` (p. ej. en el onFocus del formulario), no al cargar la página.
 * `widget` va dentro del formulario; `token()` y `reset()` se usan al enviar.
 */
export function useRecaptcha() {
  const el = useRef<HTMLDivElement | null>(null)
  const widgetId = useRef<number | null>(null)
  const obs = useRef<IntersectionObserver | null>(null)

  const cargar = useCallback(() => {
    if (!RECAPTCHA_SITE_KEY || widgetId.current !== null) return
    cargarScript()
      .then(() => {
        const nodo = el.current
        // Puede haberse desmontado mientras cargaba, o haberlo pintado otra llamada
        if (!nodo || !nodo.isConnected || widgetId.current !== null || !window.grecaptcha) return
        widgetId.current = window.grecaptcha.render(nodo, { sitekey: RECAPTCHA_SITE_KEY })
      })
      .catch(err => console.error('[recaptcha]', err))
  }, [])

  // Callback ref y no useEffect: el formulario se desmonta y se vuelve a montar dentro del
  // mismo componente (vista de éxito → «Enviar otro»), y cada nodo nuevo necesita su widget.
  const ref = useCallback((nodo: HTMLDivElement | null) => {
    obs.current?.disconnect()
    obs.current = null
    el.current = nodo
    widgetId.current = null
    if (!nodo) return
    if (typeof IntersectionObserver === 'undefined') { cargar(); return }
    obs.current = new IntersectionObserver(entradas => {
      if (entradas.some(e => e.isIntersecting)) { obs.current?.disconnect(); cargar() }
    }, { rootMargin: '200px' })
    obs.current.observe(nodo)
  }, [cargar])

  useEffect(() => () => obs.current?.disconnect(), [])

  /** Token de la casilla, o '' si no está marcada o el widget no ha llegado a pintarse. */
  const token = useCallback(() => {
    if (!RECAPTCHA_SITE_KEY || widgetId.current === null) return ''
    return window.grecaptcha?.getResponse(widgetId.current) ?? ''
  }, [])

  // El token es de un solo uso: hay que resetear tras cada envío, vaya bien o mal.
  const reset = useCallback(() => {
    if (widgetId.current !== null) window.grecaptcha?.reset(widgetId.current)
  }, [])

  const widget = RECAPTCHA_SITE_KEY ? <div ref={ref} style={{ minHeight: 78 }} /> : null

  return { activo: !!RECAPTCHA_SITE_KEY, widget, cargar, token, reset }
}
