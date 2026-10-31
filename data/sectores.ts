// Landings sectoriales de Agentes IA (components/sector/SectorLanding.tsx) y registro de los
// orígenes de lead que acepta /api/lead (también restaurantes, que tiene su propia página).
// Contenido centrado en el problema del negocio. Sin precios, testimonios, cifras ni logos de
// terceros. Lo que se afirma del agente debe existir en agentes (citas en la agenda del panel,
// recordatorios por WhatsApp, paso a una persona, agente de voz como extra).
import type { FaqItem } from '../components/Faq'
import type { NombreIcono } from '../components/Icono'

export type MensajeChat = { de: 'cliente' | 'asistente'; texto: string; hora: string }

export type Sector = {
  slug: 'peluquerias' | 'clinicas' | 'talleres'
  /** Nombre del sector en títulos y tarjetas («Peluquerías y estética»). */
  nombre: string
  tituloSeo: string
  metaDescription: string
  h1: string
  subtitulo: string
  problemas: { titulo: string; texto: string }[]
  funciones: { icono: NombreIcono; titulo: string; texto: string }[]
  /** Bloque destacado opcional tras las funciones (clínicas: sin consejo médico y RGPD). */
  aviso?: { titulo: string; texto: string }
  /** Nombre del negocio de ejemplo en el mockup de WhatsApp. */
  nombreChat: string
  conversacion: MensajeChat[]
  faq: FaqItem[]
  /** Mensaje prerrellenado del CTA «Pide una demo» (WhatsApp comercial). */
  mensajeWhatsApp: string
  /** Foto del hero, 4:5 (scripts/gen-sector-images.mjs). Si no hay foto, es el placeholder neutro. */
  imagen: string
  /** Texto alternativo de la foto. */
  imagenAlt: string
  /** Captura opcional de la conversación con el agente, en un marco de móvil sobre la foto. */
  imagenChat?: { src: string; alt: string; ancho: number; alto: number }
  /** Etiqueta del campo «negocio» del formulario. */
  etiquetaNegocio: string
  /** Para el email de respuesta automática y el JSON-LD Service. */
  servicio: string
}

const SIN_CAMBIAR_NUMERO: FaqItem = {
  pregunta: '¿Tengo que cambiar de número?',
  respuesta: 'No. Conectamos el WhatsApp Business de tu negocio: tus clientes siguen escribiendo al número de siempre y el agente contesta desde él.',
}
const SIN_PERMANENCIA: FaqItem = {
  pregunta: '¿Hay permanencia?',
  respuesta: 'Sin permanencia: puedes darte de baja cuando quieras con 30 días de preaviso.',
}
const NO_SABE: FaqItem = {
  pregunta: '¿Y si le preguntan algo que el agente no sabe?',
  respuesta: 'No se lo inventa: te pasa la conversación con un aviso en el móvil para que contestes tú. Todas las conversaciones quedan en tu panel.',
}

export const SECTORES: Record<Sector['slug'], Sector> = {
  peluquerias: {
    slug: 'peluquerias',
    nombre: 'Peluquerías y estética',
    tituloSeo: 'Agente de WhatsApp para peluquerías y centros de estética | Citas 24 h | Innovapp',
    metaDescription:
      'Un agente de IA en el WhatsApp de tu peluquería o centro de estética: da, cambia y cancela citas en tu agenda a cualquier hora, recuerda la cita al cliente y responde servicios, horarios y precios.',
    h1: 'Tu peluquería da citas por WhatsApp aunque tengas las manos ocupadas',
    subtitulo:
      'Un agente que contesta el WhatsApp de tu salón las 24 horas: da, cambia y cancela citas en tu agenda, recuerda la cita al cliente y responde dudas de servicios, horarios y precios.',
    problemas: [
      { titulo: 'Las manos ocupadas, el móvil sonando', texto: 'Con un color a medias no puedes contestar. El mensaje se queda sin respuesta y ese cliente pide cita en otro sitio.' },
      { titulo: 'Huecos que se quedan vacíos', texto: 'Una cancelación de última hora o un cliente que no viene es una hora de trabajo perdida.' },
      { titulo: 'Siempre las mismas preguntas', texto: '¿Cuánto cuestan unas mechas? ¿Abrís el sábado? Contestarlas una y otra vez se come el día.' },
      { titulo: 'Llamadas que nadie coge', texto: 'Mientras atiendes, el teléfono suena y esa llamada se pierde.' },
    ],
    funciones: [
      { icono: 'CalendarCheck', titulo: 'Citas 24/7 en tu agenda', texto: 'Pregunta el servicio, el día y la hora, comprueba la disponibilidad real y reserva la cita en tu agenda, sin dobles reservas. También cambia y cancela citas por WhatsApp.' },
      { icono: 'BellRing', titulo: 'Recordatorios antes de la cita', texto: 'Envía un recordatorio por WhatsApp antes de cada cita para que no se olvide, y si el cliente no puede venir, te avisa con tiempo para llenar el hueco.' },
      { icono: 'CalendarDays', titulo: 'Te ofrece los huecos libres', texto: 'Si la hora que piden está ocupada, propone las que tienes libres en lugar de un «no hay sitio».' },
      { icono: 'MessageCircle', titulo: 'Servicios, horarios y precios', texto: 'Responde con la información que tú le das: servicios, duración, precios y horarios. No se inventa un precio.' },
      { icono: 'PhoneIncoming', titulo: 'Llamadas perdidas, atendidas', texto: 'Con el agente de voz (opcional), las llamadas que no puedes coger también se atienden: informa y da cita.' },
      { icono: 'Hand', titulo: 'Tú decides cuándo intervenir', texto: 'Lo que necesita a una persona pasa a ti con un aviso en el móvil, y todas las conversaciones quedan en tu panel.' },
    ],
    nombreChat: 'Peluquería Demo',
    conversacion: [
      { de: 'cliente', texto: '¡Hola! ¿Tenéis hueco para corte y color el viernes por la tarde?', hora: '11:02' },
      { de: 'asistente', texto: '¡Hola! 👋 El viernes por la tarde tengo libre a las 16:30 o a las 18:00 para corte y color. ¿Cuál te viene mejor?', hora: '11:02' },
      { de: 'cliente', texto: 'A las 16:30 💇‍♀️', hora: '11:03' },
      { de: 'asistente', texto: '¡Perfecto! ¿A nombre de quién la reservo?', hora: '11:03' },
      { de: 'cliente', texto: 'Laura', hora: '11:03' },
      { de: 'asistente', texto: '✅ Listo, Laura: viernes a las 16:30, corte y color. Te mandaremos un recordatorio antes de la cita. Si necesitas cambiarla, escríbenos por aquí.', hora: '11:03' },
    ],
    faq: [
      SIN_CAMBIAR_NUMERO,
      {
        pregunta: '¿Las citas se apuntan solas en mi agenda?',
        respuesta: 'Sí. El agente comprueba la disponibilidad real y reserva la cita en la agenda de tu panel, sin dobles reservas. Si ya usas otro programa de citas, cuéntanoslo en la visita y vemos cómo encajarlo.',
      },
      {
        pregunta: '¿Puede dar precios?',
        respuesta: 'Sí, los que tú configures para cada servicio. Si un precio depende de cómo venga el pelo o del tratamiento, puede decirlo así y pasarte la conversación.',
      },
      NO_SABE,
      SIN_PERMANENCIA,
    ],
    mensajeWhatsApp: 'Hola, quiero ver la demo del agente para peluquerías',
    imagen: '/sectores/peluquerias.webp',
    imagenAlt: 'Esteticista con mascarilla haciendo un tratamiento facial a una clienta tumbada en la camilla',
    etiquetaNegocio: 'Peluquería o centro',
    servicio: 'el agente de WhatsApp para peluquerías y centros de estética',
  },

  clinicas: {
    slug: 'clinicas',
    nombre: 'Clínicas',
    tituloSeo: 'Agente de WhatsApp para clínicas dentales, de fisioterapia y veterinarias | Innovapp',
    metaDescription:
      'Un agente de IA en el WhatsApp de tu clínica: citas y cambios a cualquier hora, preguntas frecuentes, recordatorios y paso a una persona de urgencias y consultas clínicas. No da consejo médico.',
    h1: 'Tu clínica atiende el WhatsApp aunque la recepción esté llena',
    subtitulo:
      'Para clínicas dentales, de fisioterapia y veterinarias: un agente que da y cambia citas en tu agenda, responde horarios, tratamientos y aseguradoras, y pasa a tu equipo las urgencias y las consultas clínicas.',
    problemas: [
      { titulo: 'Recepción saturada', texto: 'Entre el paciente que llega, el que paga y el teléfono, el WhatsApp se queda para luego.' },
      { titulo: 'Citas olvidadas', texto: 'Un paciente que olvida su cita deja un hueco que ya no se puede llenar.' },
      { titulo: 'Las mismas preguntas cada día', texto: 'Horarios, si trabajáis con su aseguradora, cuánto dura una sesión: respuestas que ya sabes.' },
      { titulo: 'Lo urgente, mezclado con lo rutinario', texto: 'Una urgencia no puede esperar detrás de veinte mensajes para pedir cita.' },
    ],
    funciones: [
      { icono: 'CalendarCheck', titulo: 'Citas y cambios a cualquier hora', texto: 'Da, cambia y cancela citas en tu agenda comprobando la disponibilidad real, también fuera del horario de recepción.' },
      { icono: 'MessageCircle', titulo: 'Preguntas frecuentes', texto: 'Horarios, tratamientos que ofrecéis, aseguradoras con las que trabajáis y cómo llegar, con la información que tú configuras.' },
      { icono: 'BellRing', titulo: 'Recordatorios de cita', texto: 'Recuerda la cita por WhatsApp antes de que llegue, para que el paciente no la olvide o avise si no puede venir.' },
      { icono: 'Hand', titulo: 'Urgencias y consultas clínicas, a una persona', texto: 'Si alguien describe una urgencia o hace una consulta clínica, el agente no responde por su cuenta: pasa la conversación a tu equipo y te avisa en el móvil.' },
    ],
    aviso: {
      titulo: 'El agente no da consejo médico',
      texto:
        'No hace diagnósticos, no recomienda tratamientos ni interpreta síntomas: gestiona citas y responde información práctica de la clínica. Todo lo clínico lo atiende una persona de tu equipo. Los datos de tus pacientes se tratan conforme al RGPD: tu clínica es la responsable del tratamiento e Innovapp actúa como encargado, siguiendo tus instrucciones y con su contrato de encargado del tratamiento.',
    },
    nombreChat: 'Clínica Demo',
    conversacion: [
      { de: 'cliente', texto: 'Buenas, quería cita de fisio, tengo molestias en la espalda', hora: '19:41' },
      { de: 'asistente', texto: 'Hola 😊 Te busco cita. Tengo el martes a las 10:00 o el miércoles a las 17:30. ¿Cuál prefieres?', hora: '19:41' },
      { de: 'cliente', texto: 'El miércoles. ¿Cuánto dura la sesión?', hora: '19:42' },
      { de: 'asistente', texto: 'Unos 45 minutos. ¿Me dices tu nombre y apellidos para la cita?', hora: '19:42' },
      { de: 'cliente', texto: 'Marta Ruiz', hora: '19:43' },
      { de: 'asistente', texto: '✅ Cita reservada: miércoles a las 17:30, fisioterapia, a nombre de Marta Ruiz. Te mandaremos un recordatorio antes. Sobre las molestias, el fisioterapeuta te valorará en consulta.', hora: '19:43' },
    ],
    faq: [
      {
        pregunta: '¿El agente da consejo médico?',
        respuesta: 'No. No diagnostica, no recomienda tratamientos ni interpreta síntomas. Gestiona citas y responde información práctica; las consultas clínicas y las urgencias pasan a una persona de tu equipo.',
      },
      {
        pregunta: '¿Cómo se tratan los datos de los pacientes?',
        respuesta: 'Conforme al RGPD: tu clínica es la responsable del tratamiento e Innovapp actúa como encargado, siguiendo tus instrucciones y con su contrato de encargado del tratamiento. Los detalles están en nuestra política de privacidad.',
      },
      {
        pregunta: '¿Sirve para clínicas veterinarias?',
        respuesta: 'Sí. Funciona igual: citas, recordatorios y preguntas frecuentes, y las urgencias de los animales pasan a una persona.',
      },
      SIN_CAMBIAR_NUMERO,
      SIN_PERMANENCIA,
    ],
    mensajeWhatsApp: 'Hola, quiero ver la demo del agente para clínicas',
    imagen: '/sectores/clinicas.webp',
    imagenAlt: 'Dentista con bata blanca revisando una radiografía sentado a la mesa de su consulta',
    etiquetaNegocio: 'Clínica',
    servicio: 'el agente de WhatsApp para clínicas',
  },

  talleres: {
    slug: 'talleres',
    nombre: 'Talleres',
    tituloSeo: 'Agente de WhatsApp para talleres mecánicos | Citas de revisión, ITV y neumáticos | Innovapp',
    metaDescription:
      'Un agente de IA en el WhatsApp de tu taller: da cita para revisión, pre-ITV, neumáticos o diagnosis, responde servicios y horarios, recuerda la cita y te pasa los presupuestos.',
    h1: 'Tu taller da citas por WhatsApp mientras estás debajo de un coche',
    subtitulo:
      'Un agente que contesta el WhatsApp de tu taller: da cita para revisión, puesta a punto para la ITV, neumáticos o diagnosis, responde servicios y horarios, y te pasa los presupuestos.',
    problemas: [
      { titulo: 'Las manos llenas de grasa', texto: 'Con un coche en el elevador no puedes contestar, y el cliente escribe a otro taller.' },
      { titulo: 'Preguntas que interrumpen', texto: '¿Abrís el sábado? ¿Cambiáis neumáticos? Cada interrupción te saca del trabajo.' },
      { titulo: 'Citas apuntadas en cualquier sitio', texto: 'Entre la libreta, los mensajes y las llamadas, se escapan citas y se solapan coches.' },
      { titulo: 'Clientes que se olvidan de venir', texto: 'Un hueco reservado que nadie ocupa es una mañana perdida.' },
    ],
    funciones: [
      { icono: 'CalendarCheck', titulo: 'Cita para revisión, pre-ITV, neumáticos o diagnosis', texto: 'Pregunta qué necesita y qué vehículo es, comprueba tu disponibilidad y reserva la cita en tu agenda sin solapar coches.' },
      { icono: 'MessageCircle', titulo: 'Servicios y horarios', texto: 'Responde qué servicios hacéis, los horarios y cómo llegar, con la información que tú configuras.' },
      { icono: 'BellRing', titulo: 'Recordatorio de la cita', texto: 'Envía un recordatorio por WhatsApp antes de la cita, para que el cliente no se olvide o avise si no puede venir.' },
      { icono: 'Receipt', titulo: 'Presupuestos, a una persona', texto: 'El agente no da precios de reparaciones: recoge lo que le pasa al coche y te pasa la conversación para que hagas tú el presupuesto.' },
      { icono: 'Hand', titulo: 'Todo en tu panel', texto: 'Ves todas las conversaciones y entras en cualquiera cuando quieras, con aviso en el móvil.' },
    ],
    nombreChat: 'Taller Demo',
    conversacion: [
      { de: 'cliente', texto: 'Hola, el mes que viene me toca la ITV y quería una revisión antes', hora: '08:12' },
      { de: 'asistente', texto: 'Hola 👋 Claro. ¿Qué coche es y qué día te viene bien?', hora: '08:12' },
      { de: 'cliente', texto: 'Un diésel de 2016. El jueves por la mañana si puede ser', hora: '08:13' },
      { de: 'asistente', texto: 'El jueves tengo hueco a las 9:00 o a las 11:30 para la revisión pre-ITV. ¿Cuál te va mejor?', hora: '08:13' },
      { de: 'cliente', texto: 'A las 9. ¿Cuánto me va a costar?', hora: '08:14' },
      { de: 'asistente', texto: 'El precio depende de lo que haya que hacer, así que te lo dirá el mecánico 🔧 ¿A nombre de quién dejo la cita?', hora: '08:14' },
      { de: 'cliente', texto: 'Javier', hora: '08:14' },
      { de: 'asistente', texto: '✅ Hecho, Javier: jueves a las 9:00, revisión pre-ITV. Te mandaremos un recordatorio antes de la cita.', hora: '08:15' },
    ],
    faq: [
      {
        pregunta: '¿El agente da precios de reparaciones?',
        respuesta: 'No. El precio de una reparación depende de cada coche, así que el agente recoge lo que le pasa y te pasa la conversación para que hagas tú el presupuesto.',
      },
      {
        pregunta: '¿Puede dar cita para la ITV?',
        respuesta: 'Da cita en tu taller para la revisión previa a la ITV. La cita en la estación de ITV la pide el cliente en la propia estación.',
      },
      SIN_CAMBIAR_NUMERO,
      NO_SABE,
      SIN_PERMANENCIA,
    ],
    mensajeWhatsApp: 'Hola, quiero ver la demo del agente para talleres',
    imagen: '/sectores/talleres.webp',
    imagenAlt: 'Mecánico revisando la rueda de un coche elevado en el taller',
    etiquetaNegocio: 'Taller',
    servicio: 'el agente de WhatsApp para talleres',
  },
}

/** Mensaje prerrellenado de la demo de restaurantes (página propia, /agentes-ia-restaurantes). */
export const MENSAJE_DEMO_RESTAURANTE = 'Hola, quiero ver una demo del agente para restaurantes'

/** Orígenes de lead que acepta /api/lead: restaurantes y las landings sectoriales. */
export type FuenteLead = { ruta: string; servicio: string; etiquetaNegocio: string; mensajeDemo: string }

export const FUENTES_LEAD: Record<string, FuenteLead> = {
  restaurantes: {
    ruta: '/agentes-ia-restaurantes',
    servicio: 'el asistente de WhatsApp para restaurantes',
    etiquetaNegocio: 'Restaurante',
    mensajeDemo: MENSAJE_DEMO_RESTAURANTE,
  },
  ...Object.fromEntries(
    Object.values(SECTORES).map(s => [s.slug, {
      ruta: `/agentes-ia-${s.slug}`,
      servicio: s.servicio,
      etiquetaNegocio: s.etiquetaNegocio,
      mensajeDemo: s.mensajeWhatsApp,
    }]),
  ),
}

/** Tarjetas «Por sector» (/agentes-ia#por-sector) y enlaces de la tarjeta Agentes IA de la home. */
export const TARJETAS_SECTOR: { clave: string; nombre: string; nombreCorto: string; icono: NombreIcono; texto: string; enlaces: [string, string][] }[] = [
  { clave: 'restaurantes', nombre: 'Restaurantes', nombreCorto: 'Restaurantes', icono: 'UtensilsCrossed', texto: 'Reservas de mesa 24 h, menú del día con sus alérgenos y registro de jornada del equipo.', enlaces: [['/agentes-ia-restaurantes', 'Agente para restaurantes']] },
  { clave: 'peluquerias', nombre: 'Peluquerías y estética', nombreCorto: 'Peluquerías', icono: 'Scissors', texto: 'Citas, cambios y cancelaciones a cualquier hora, recordatorios y los huecos libres ofrecidos al momento.', enlaces: [['/agentes-ia-peluquerias', 'Agente para peluquerías']] },
  { clave: 'clinicas', nombre: 'Clínicas', nombreCorto: 'Clínicas', icono: 'Stethoscope', texto: 'Dentales, de fisioterapia y veterinarias: citas, recordatorios y preguntas frecuentes; lo clínico, a una persona.', enlaces: [['/agentes-ia-clinicas', 'Agente para clínicas']] },
  { clave: 'talleres', nombre: 'Talleres', nombreCorto: 'Talleres', icono: 'Wrench', texto: 'Citas de revisión, pre-ITV, neumáticos o diagnosis, y los presupuestos, a una persona.', enlaces: [['/agentes-ia-talleres', 'Agente para talleres']] },
  { clave: 'ecommerce', nombre: 'Tiendas online', nombreCorto: 'E-commerce', icono: 'ShoppingCart', texto: 'Catálogo real, estado de los pedidos y enlace de pago por WhatsApp, conectado a tu tienda.', enlaces: [['/agentes-ia-prestashop', 'PrestaShop'], ['/agentes-ia-woocommerce', 'WooCommerce']] },
]
