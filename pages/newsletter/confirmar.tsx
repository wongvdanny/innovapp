import { GetServerSideProps } from 'next'
import Link from 'next/link'
import AuthCard, { Mensaje, estiloEnlace } from '../../components/AuthCard'
import { confirmar, ResultadoConfirmacion } from '../../lib/newsletter/suscriptores'

const TEXTOS: Record<ResultadoConfirmacion, [string, string, 'ok' | 'error']> = {
  confirmado: ['¡Suscripción confirmada!', 'A partir de ahora recibirás las novedades de Innovapp. Puedes darte de baja desde cualquier correo.', 'ok'],
  ya_confirmado: ['Ya estabas suscrito', 'Tu suscripción ya estaba confirmada. No hace falta hacer nada más.', 'ok'],
  caducado: ['El enlace ha caducado', 'El enlace de confirmación dura 7 días. Vuelve a suscribirte y te enviaremos uno nuevo.', 'error'],
  no_valido: ['Enlace no válido', 'Este enlace no es válido o ya no se puede usar. Si quieres recibir las novedades, vuelve a suscribirte.', 'error'],
}

export default function Confirmar({ resultado }: { resultado: ResultadoConfirmacion }) {
  const [titulo, texto, tipo] = TEXTOS[resultado]
  return (
    <AuthCard titulo={titulo} subtitulo="Novedades de Innovapp" seoTitulo="Confirmar suscripción — innovapp" canonical="/newsletter/confirmar"
      pie={<Link href="/" style={estiloEnlace}>Ir a innovapp.es →</Link>}>
      <Mensaje tipo={tipo}>{texto}</Mensaje>
    </AuthCard>
  )
}

// Se confirma al abrir el enlace del correo (es la acción que pide el propio correo).
export const getServerSideProps: GetServerSideProps = async ctx => {
  ctx.res.setHeader('Referrer-Policy', 'no-referrer')
  ctx.res.setHeader('Cache-Control', 'no-store')
  const ip = (String(ctx.req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || ctx.req.socket.remoteAddress) ?? null
  return { props: { resultado: await confirmar(ctx.query.t, ip) } }
}
