// Eventos de conversión para GTM (GTM-W97PXTN9): todo pasa por window.dataLayer y GTM
// decide qué etiquetas disparar. Seguro en SSR: en el servidor no hace nada.

declare global {
  interface Window {
    // Mismo array que crea el snippet de Consent Mode en _document.tsx
    dataLayer?: unknown[]
  }
}

export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

/** Evento según el destino del enlace, o null si no es de contacto. */
function eventoDeEnlace(href: string): string | null {
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return 'click_whatsapp'
  if (/^tel:/i.test(href)) return 'click_tel'
  if (/^mailto:/i.test(href)) return 'click_email'
  return null
}

/**
 * Un solo listener en document para click_whatsapp / click_tel / click_email: cubre la
 * burbuja, los botones de cada página, el pie y los enlaces que vengan en el markdown del
 * blog, sin tener que acordarse de añadir onClick en cada enlace nuevo. Fase de captura,
 * para que un stopPropagation de un componente no se lo coma. Devuelve la limpieza.
 */
export function trackContactClicks(): () => void {
  const onClick = (e: MouseEvent) => {
    const enlace = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!enlace) return
    const evento = eventoDeEnlace(enlace.getAttribute('href') || '')
    if (!evento) return
    track(evento, {
      page_path: window.location.pathname,
      // data-cta="llamada-voz-demo" (VozDemo, agentes-voz) distingue el número de demo
      ...(enlace.dataset.cta ? { cta: enlace.dataset.cta } : {}),
    })
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}

/** sign_up una sola vez por suscripción (registro gratis y /bienvenida tras pagar). */
export function trackSignUpOnce(subscriptionId: string, product: string): void {
  const clave = `ia_signup_${subscriptionId}`
  try {
    if (localStorage.getItem(clave)) return
    localStorage.setItem(clave, '1')
  } catch {
    // Sin localStorage (modo privado estricto): se envía igualmente
  }
  track('sign_up', { product })
}

// --- Tráfico interno ---
// Marca en localStorage que _document.tsx lee ANTES de cargar GTM y convierte en
// dataLayer.push({ traffic_type: 'internal' }), para que GA4 lo filtre como tráfico interno.
export const INTERNAL_TRAFFIC_KEY = 'ia_internal'

export function isInternalBrowser(): boolean {
  try {
    return localStorage.getItem(INTERNAL_TRAFFIC_KEY) === '1'
  } catch {
    return false
  }
}

export function setInternalBrowser(interno: boolean): void {
  try {
    if (interno) localStorage.setItem(INTERNAL_TRAFFIC_KEY, '1')
    else localStorage.removeItem(INTERNAL_TRAFFIC_KEY)
  } catch {
    // Sin localStorage no hay marca posible
  }
}
