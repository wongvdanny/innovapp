// Casos de la home (#casos) y de /casos. Innovapp aún no tiene clientes publicados: son
// productos propios y demos. Sin métricas ni nombres, logos o capturas de terceros.
// Un campo con '[RELLENAR]' no se muestra (lib/rellenar.ts).

export type Case = {
  slug: string
  title: string
  sector: string
  challenge: string
  solution: string
  result: string
  /** Ruta en public/ (p. ej. /casos/servix.webp), 1200x750. */
  image: string
  link?: string
}

export const CASES: Case[] = [
  {
    slug: 'servix',
    title: 'Servix',
    sector: 'Restaurantes · Producto propio',
    challenge:
      'En un restaurante, las comandas en papel, las mesas que nadie controla y los cobros a mano se traducen en esperas y errores en hora punta.',
    solution:
      'Un TPV y gestión en la nube para restaurantes: mesas y zonas en tiempo real, carta digital con QR, pantalla de cocina y cobro con tarjeta integrado (Redsys).',
    result:
      'Los pedidos llegan directos a cocina sin papel, el estado de cada mesa se ve al momento y el cobro se hace desde el propio TPV.',
    image: '/casos/servix.webp',
    link: '/servix',
  },
  {
    slug: 'gymstack',
    title: 'GymStack',
    sector: 'Gimnasios · Producto propio',
    challenge:
      'Altas, cuotas, reservas de clases y accesos repartidos entre hojas de cálculo, llamadas y mensajes.',
    solution:
      'Gestión en la nube para gimnasios: socios y cuotas, reservas de clases desde el móvil, control de accesos y rutinas con seguimiento de cada socio.',
    result:
      'Los socios reservan sus clases desde el móvil, las entradas y salidas quedan registradas solas y el gimnasio tiene a cada socio en un solo sitio.',
    image: '/casos/gymstack.webp',
    link: '/gymstack',
  },
  {
    slug: 'agente-ia-peluqueria',
    title: 'Agente IA para peluquería',
    sector: 'Peluquerías · Demo',
    challenge:
      'Con las manos ocupadas, nadie contesta el WhatsApp ni el teléfono, y una cita que no se atiende al momento se va a otro sitio.',
    solution:
      'Un agente de IA que atiende el WhatsApp del salón con sus servicios, horarios y precios reales, y un agente de voz para las llamadas que no se cogen.',
    result:
      'Responde dudas y agenda citas a cualquier hora sin dobles reservas, toma recados y pasa a una persona lo que lo necesita.',
    image: '/casos/peluqueria.webp',
    link: '/agentes-ia',
  },
]
