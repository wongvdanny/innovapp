import { useEffect, useState } from 'react'

// Métodos de pago del checkout público. El orden es el de los botones del selector.
export type MetodoPago = 'redsys' | 'stripe' | 'transferencia'

export const ETIQUETA_METODO: Record<MetodoPago, string> = {
  redsys: '💳 Tarjeta (Redsys)',
  stripe: '💜 Tarjeta (Stripe)',
  transferencia: '🏦 Transferencia',
}

const ORDEN: MetodoPago[] = ['redsys', 'stripe', 'transferencia']

/** Lee /api/payment-providers; si solo hay un método activo, lo deja seleccionado. */
export function useMetodosPago() {
  const [disponibles, setDisponibles] = useState<MetodoPago[]>([])
  const [metodo, setMetodo] = useState<MetodoPago | ''>('')
  useEffect(() => {
    fetch('/api/payment-providers')
      .then(r => r.json())
      .then((d: Record<string, boolean>) => {
        const activos = ORDEN.filter(m => d[m])
        setDisponibles(activos)
        if (activos.length === 1) setMetodo(activos[0])
      })
      .catch(() => {})
  }, [])
  return { disponibles, metodo, setMetodo, elegir: disponibles.length > 1 }
}

/** Tras /api/subscriptions/checkout: Redsys necesita un POST de formulario; el resto, redirección. */
export function irAlPago(data: { provider: string; url: string; body?: Record<string, string> }) {
  if (data.provider !== 'redsys') { window.location.href = data.url; return }
  const frm = document.createElement('form')
  frm.method = 'POST'; frm.action = data.url
  Object.entries(data.body || {}).forEach(([k, v]) => {
    const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; frm.appendChild(i)
  })
  document.body.appendChild(frm); frm.submit()
}
