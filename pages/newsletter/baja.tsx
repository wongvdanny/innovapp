import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import AuthCard, { Mensaje, estiloEnlace } from '../../components/AuthCard'

type Estado = 'procesando' | 'baja' | 'ya_estaba' | 'no_valido' | 'error'

/**
 * Baja con un clic. La baja se tramita con una petición POST al cargar la página: los escáneres
 * de enlaces del correo (que solo hacen GET) no dan de baja a nadie sin querer.
 */
export default function Baja({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>(token ? 'procesando' : 'no_valido')
  useEffect(() => {
    if (!token) return
    fetch('/api/newsletter/baja', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token }) })
      .then(async r => setEstado(r.status === 404 ? 'no_valido' : r.ok ? ((await r.json()).resultado as Estado) : 'error'))
      .catch(() => setEstado('error'))
  }, [token])

  const [titulo, texto, tipo]: [string, string, 'ok' | 'error' | null] = {
    procesando: ['Dándote de baja…', '', null],
    baja: ['Te has dado de baja', 'No volverás a recibir las novedades de Innovapp. Si cambias de idea, puedes volver a suscribirte desde la web.', 'ok'],
    ya_estaba: ['Ya estabas dado de baja', 'No recibes las novedades de Innovapp. No hace falta hacer nada más.', 'ok'],
    no_valido: ['Enlace no válido', 'Este enlace de baja no es válido. Si sigues recibiendo correos, responde a cualquiera de ellos y te damos de baja a mano.', 'error'],
    error: ['No se ha podido completar', 'Ha habido un problema al darte de baja. Recarga la página para intentarlo de nuevo.', 'error'],
  }[estado] as [string, string, 'ok' | 'error' | null]

  return (
    <AuthCard titulo={titulo} subtitulo="Novedades de Innovapp" seoTitulo="Darse de baja — innovapp" canonical="/newsletter/baja"
      pie={<Link href="/" style={estiloEnlace}>Ir a innovapp.es →</Link>}>
      {tipo ? <Mensaje tipo={tipo}>{texto}</Mensaje> : <p style={{ fontSize: 14, color: '#5f6b7a' }} role="status">Un momento…</p>}
    </AuthCard>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  ctx.res.setHeader('Referrer-Policy', 'no-referrer')
  ctx.res.setHeader('Cache-Control', 'no-store')
  return { props: { token: typeof ctx.query.t === 'string' && /^[0-9a-f]{64}$/.test(ctx.query.t) ? ctx.query.t : '' } }
}
