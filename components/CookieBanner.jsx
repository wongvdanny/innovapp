/**
 * Banner de consentimiento de cookies, integrado con Google Consent Mode v2.
 *
 * Bloques de consentimiento que maneja este componente:
 *   - "necesarias"  -> siempre activas, no requieren consentimiento (sesión, seguridad,
 *                      preferencias básicas). No corresponden a ninguna señal de Consent
 *                      Mode -- no se envía ningún gtag('consent', ...) por ellas.
 *   - "analiticas"  -> controla la señal `analytics_storage` (medición/analítica, p.ej.
 *                      Google Analytics dentro del contenedor GTM).
 *   - "publicidad"  -> controla las tres señales de anuncios de Consent Mode v2 juntas:
 *                      `ad_storage`, `ad_user_data` y `ad_personalization`. Se agrupan en
 *                      un único toggle "Publicidad" porque para el usuario son la misma
 *                      decisión ("¿permites anuncios/remarketing?"), y es como Google Ads
 *                      necesita las tres señales para registrar conversiones correctamente.
 *
 * Los valores por defecto ("denied" para las cuatro señales) se fijan en
 * pages/_document.tsx, ANTES de que cargue el script de GTM -- este componente solo
 * actualiza esas señales a "granted" después de una acción explícita del usuario, tal
 * como exige Consent Mode v2. Como esos defaults se re-fijan a "denied" en cada carga
 * completa de página, este componente también reaplica (gtag('consent','update', ...))
 * cualquier consentimiento ya otorgado en una visita anterior, leído de localStorage.
 */
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'innovapp_cookie_consent'
export const COOKIE_SETTINGS_EVENT = 'innovapp:cookie-settings:open'

function leerConsentimientoGuardado() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return { analiticas: !!parsed.analiticas, publicidad: !!parsed.publicidad }
  } catch {
    return null
  }
}

function guardarConsentimiento(prefs) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        timestamp: new Date().toISOString(),
        analiticas: prefs.analiticas,
        publicidad: prefs.publicidad,
      })
    )
  } catch {
    // localStorage puede fallar (modo privado, cuota agotada, etc.). El default
    // "denied" de _document.tsx ya está aplicado, así que no pasa nada grave si la
    // decisión no se puede persistir -- simplemente se volverá a preguntar la próxima vez.
  }
}

function actualizarConsentGtag(prefs) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: prefs.analiticas ? 'granted' : 'denied',
    ad_storage: prefs.publicidad ? 'granted' : 'denied',
    ad_user_data: prefs.publicidad ? 'granted' : 'denied',
    ad_personalization: prefs.publicidad ? 'granted' : 'denied',
  })
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState({ analiticas: false, publicidad: false })

  // Primera carga: si no hay decisión guardada, muestra el banner. Si ya hay una,
  // no se vuelve a mostrar, pero se reaplica a gtag (los defaults se resetean a
  // "denied" en cada carga de página -- ver pages/_document.tsx).
  useEffect(() => {
    const guardado = leerConsentimientoGuardado()
    if (!guardado) {
      setVisible(true)
      return
    }
    setPrefs(guardado)
    if (guardado.analiticas || guardado.publicidad) {
      actualizarConsentGtag(guardado)
    }
  }, [])

  // El footer dispara este evento en "Gestionar cookies" para reabrir el panel.
  useEffect(() => {
    const abrirConfiguracion = () => {
      const guardado = leerConsentimientoGuardado()
      if (guardado) setPrefs(guardado)
      setExpanded(true)
      setVisible(true)
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, abrirConfiguracion)
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, abrirConfiguracion)
  }, [])

  const cerrar = () => {
    setVisible(false)
    setExpanded(false)
  }

  const aceptarTodo = () => {
    const nuevo = { analiticas: true, publicidad: true }
    guardarConsentimiento(nuevo)
    actualizarConsentGtag(nuevo)
    setPrefs(nuevo)
    cerrar()
  }

  const rechazar = () => {
    const nuevo = { analiticas: false, publicidad: false }
    guardarConsentimiento(nuevo)
    // Sin llamada a gtag('consent','update', ...): los defaults ya son 'denied'
    // (pages/_document.tsx), así que rechazar no cambia nada a nivel de gtag.
    setPrefs(nuevo)
    cerrar()
  }

  const guardarPreferencias = () => {
    guardarConsentimiento(prefs)
    actualizarConsentGtag(prefs)
    cerrar()
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        background: 'rgba(22,22,22,.96)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,.1)',
        color: '#ece9e2',
        padding: '20px 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <p style={{ flex: '1 1 380px', fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,.75)', margin: 0 }}>
            Usamos cookies necesarias para que el sitio funcione y, si nos das permiso, cookies
            de analítica y publicidad para entender el uso del sitio y medir nuestras
            campañas. Puedes aceptar todas, rechazarlas o elegir qué categorías permitir.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,.25)', borderRadius: 10,
                color: '#ece9e2', fontSize: 13, fontWeight: 600, padding: '11px 18px', cursor: 'pointer',
              }}
            >
              Configurar
            </button>
            <button
              onClick={rechazar}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,.25)', borderRadius: 10,
                color: '#ece9e2', fontSize: 13, fontWeight: 600, padding: '11px 18px', cursor: 'pointer',
              }}
            >
              Rechazar
            </button>
            <button
              onClick={aceptarTodo}
              style={{
                background: '#ee7528', border: 'none', borderRadius: 10,
                color: '#161616', fontSize: 13, fontWeight: 700, padding: '11px 20px', cursor: 'pointer',
              }}
            >
              Aceptar todo
            </button>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TogglePreferencia
              label="Necesarias"
              descripcion="Imprescindibles para que el sitio funcione. Siempre activas."
              checked
              disabled
            />
            <TogglePreferencia
              label="Analíticas"
              descripcion="Nos ayudan a entender cómo se usa el sitio (analytics_storage)."
              checked={prefs.analiticas}
              onChange={v => setPrefs(p => ({ ...p, analiticas: v }))}
            />
            <TogglePreferencia
              label="Publicidad"
              descripcion="Miden y personalizan anuncios, incluidas conversiones de Google Ads (ad_storage, ad_user_data, ad_personalization)."
              checked={prefs.publicidad}
              onChange={v => setPrefs(p => ({ ...p, publicidad: v }))}
            />
            <div>
              <button
                onClick={guardarPreferencias}
                style={{
                  background: '#ee7528', border: 'none', borderRadius: 10,
                  color: '#161616', fontSize: 13, fontWeight: 700, padding: '11px 20px', cursor: 'pointer',
                }}
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          [role="dialog"][aria-label="Preferencias de cookies"] > div > div:first-child {
            flex-direction: column;
            align-items: stretch;
          }
          [role="dialog"][aria-label="Preferencias de cookies"] button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

function TogglePreferencia({ label, descripcion, checked, disabled, onChange }) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange && onChange(e.target.checked)}
        style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: '#ee7528' }}
      />
      <span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#ece9e2' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginTop: 2 }}>
          {descripcion}
        </span>
      </span>
    </label>
  )
}
