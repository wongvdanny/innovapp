import { useState, useEffect } from 'react'

const CONVERSACION = [
  { rol: 'cliente', texto: 'Hola! Tenéis hueco para un tinte esta semana?' },
  { rol: 'agente', texto: '¡Hola! 👋 Sí, tenemos hueco el jueves a las 17:00 o el viernes a las 11:00. ¿Cuál te viene mejor?' },
  { rol: 'cliente', texto: 'El jueves a las 17 perfecto' },
  { rol: 'agente', texto: 'Genial, te reservo tinte el jueves 17:00 ✅ ¿Me confirmas tu nombre?' },
]

export default function ChatDemo() {
  const [visibles, setVisibles] = useState(0)

  useEffect(() => {
    if (visibles >= CONVERSACION.length) return
    const t = setTimeout(() => setVisibles(v => v + 1), visibles === 0 ? 600 : 1300)
    return () => clearTimeout(t)
  }, [visibles])

  return (
    <div style={{ background: '#1c1f27', border: '1px solid #2e333f', borderRadius: 18, padding: 20, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #2e333f', marginBottom: 4 }}>
        <img src="/agentes-ia-logo.svg" alt="" width={22} height={22} />
        <div>
          <div style={{ fontSize: 14, color: '#ece9e2', fontWeight: 600 }}>Peluquería Demo</div>
          <div style={{ fontSize: 11, color: '#6fcf87' }}>en línea</div>
        </div>
      </div>
      {CONVERSACION.slice(0, visibles).map((m, i) => (
        <div key={i} style={{ alignSelf: m.rol === 'cliente' ? 'flex-start' : 'flex-end', maxWidth: '82%', background: m.rol === 'cliente' ? '#242832' : '#3a2f14', color: '#ece9e2', padding: '9px 13px', borderRadius: 10, fontSize: 13, lineHeight: 1.4 }}>
          {m.texto}
        </div>
      ))}
    </div>
  )
}
