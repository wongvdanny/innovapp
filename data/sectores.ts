// Landings sectoriales de Agentes IA (components/sector/SectorLanding.tsx) y registro de los
// orígenes de lead que acepta /api/lead (también restaurantes, que tiene su propia página).
// Contenido centrado en el problema del negocio. Sin precios, testimonios, cifras ni logos de
// terceros. Lo que se afirma del agente debe existir en agentes (citas en la agenda del panel,
// recordatorios por WhatsApp, paso a una persona, agente de voz como extra).
import type { FaqItem } from '../components/Faq'
import type { NombreIcono } from '../components/Icono'
import { DEMO_INMOBILIARIA_WHATSAPP } from '../lib/constants'

export type MensajeChat = { de: 'cliente' | 'asistente'; texto: string; hora: string }

export type Sector = {
  slug: 'peluquerias' | 'clinicas' | 'talleres' | 'inmobiliarias'
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
  /**
   * Demo con número propio (inmobiliarias): el CTA principal abre ese WhatsApp con
   * mensajeWhatsApp y el secundario lleva al formulario, en lugar de «Pide una demo» al
   * comercial y «Llámanos».
   */
  demo?: { numero: string; textoBoton: string; textoFormulario: string }
  /** Sección opcional tras las funciones (inmobiliarias: «Tu cartera conectada»). */
  cartera?: { titulo: string; texto: string; puntos: { titulo: string; texto: string }[]; enlace?: { href: string; texto: string } }
  /** Textos propios de las secciones comunes; si faltan, los genéricos de la plantilla. */
  ejemplo?: { titulo: string; texto: string }
  pasos?: { intro: string; items: { title: string; description: string }[] }
  cierre?: { titulo: string; texto: string }
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
  // Lo que se afirma sale de agentes (módulo inmobiliaria): buscar_inmuebles y ficha_inmueble
  // solo con inmuebles disponibles de la cartera y sin dirección; visitas en la agenda del
  // negocio (no por comercial); cartera por plugin de WordPress o CSV. Sin avisos de inmuebles
  // nuevos, sin recordatorios de visita y sin integración con portales.
  inmobiliarias: {
    slug: 'inmobiliarias',
    nombre: 'Inmobiliarias',
    tituloSeo: 'Agente IA para inmobiliarias en WhatsApp | Innovapp',
    metaDescription:
      'Agente IA para inmobiliarias en WhatsApp: responde a todos los leads al momento, busca en tu cartera real y agenda visitas, también en fin de semana.',
    h1: 'Agente IA para inmobiliarias: responde a cada lead al momento y agenda visitas',
    subtitulo:
      'Un chatbot de WhatsApp para inmobiliarias que atiende a cada interesado en segundos y a cualquier hora: le pregunta qué busca, le enseña los inmuebles de tu cartera que encajan y le da cita para la visita.',
    problemas: [
      { titulo: 'Leads que llegan a deshora', texto: 'Los contactos de los portales y de tu web entran por la noche y en fin de semana. Si contestas el lunes, ese interesado ya ha hablado con otra agencia.' },
      { titulo: 'Siempre las mismas preguntas', texto: '¿Sigue disponible? ¿Cuántas habitaciones tiene? ¿Tiene garaje? Atender leads inmobiliarios uno a uno se come la mañana.' },
      { titulo: 'Visitas que cuesta cuadrar', texto: 'Mensajes de ida y vuelta para encontrar una hora que le vaya bien al cliente y a tu equipo.' },
      { titulo: 'Comerciales en la calle', texto: 'Mientras enseñan un piso no pueden contestar el móvil, y el interesado se enfría.' },
    ],
    funciones: [
      { icono: 'Search', titulo: 'Cualifica a cada interesado', texto: 'Pregunta si quiere comprar o alquilar, la zona, el presupuesto, las habitaciones y si necesita financiación, con una conversación natural y sin interrogatorios.' },
      { icono: 'Store', titulo: 'Busca en tu cartera real', texto: 'Enseña solo los inmuebles disponibles que encajan, con su referencia, sus datos y el enlace a la ficha. Nunca se inventa un inmueble ni un precio.' },
      { icono: 'CalendarCheck', titulo: 'Agenda visitas automáticamente', texto: 'Propone horas libres y deja la visita en la agenda de tu inmobiliaria, sin dobles reservas. La dirección exacta la envía tu comercial cuando la visita está confirmada.' },
      { icono: 'KeyRound', titulo: 'Captación de propietarios', texto: 'Si escribe alguien que quiere vender o alquilar su vivienda, recoge sus datos y le da cita para la valoración.' },
      { icono: 'Hand', titulo: 'Pasa a una persona cuando hace falta', texto: 'Negociaciones, dudas que no puede resolver o un cliente que prefiere hablar con alguien: te pasa la conversación con un aviso en el móvil. Todas quedan en tu panel.' },
      { icono: 'PhoneIncoming', titulo: 'También por teléfono (opcional)', texto: 'Con el agente de voz, las llamadas que no puedes coger también se atienden: pregunta qué busca el cliente y le informa de los inmuebles de tu cartera.' },
    ],
    cartera: {
      titulo: 'Tu cartera, conectada al agente',
      texto: 'El agente solo habla de los inmuebles que tú tienes. Así se los damos:',
      puntos: [
        { titulo: 'Plugin para WordPress', texto: 'Gestionas los inmuebles en tu web, con su ficha, galería de fotos, filtros y botón de WhatsApp, y el agente recibe cada cambio al momento: lo que vendes, alquilas o retiras deja de ofrecerlo.' },
        { titulo: 'Importación desde CSV', texto: '¿Tu web no es WordPress? Subes tu cartera desde una hoja de cálculo en tu panel y la actualizas cuando quieras.' },
        { titulo: 'Otros programas, a medida', texto: 'Si trabajas con un CRM inmobiliario, estudiamos cómo conectarlo a tu caso.' },
      ],
      enlace: { href: '/contacto', texto: 'Cuéntanos qué programa usas' },
    },
    nombreChat: 'Inmobiliaria Demo',
    conversacion: [
      { de: 'cliente', texto: 'Hola, busco un piso de 3 habitaciones en Oviedo para comprar, hasta unos 250.000 €', hora: '22:14' },
      { de: 'asistente', texto: '¡Hola! Te ayudo encantado. ¿Tienes alguna zona preferida de Oviedo? ¿Y necesitarás financiación?', hora: '22:14' },
      { de: 'cliente', texto: 'Mejor por el centro. Sí, con hipoteca', hora: '22:15' },
      { de: 'asistente', texto: 'Tengo dos que encajan: 🏠 Ref. OV-112, piso de 3 hab. y 2 baños, 95 m², 235.000 €. 🏠 Ref. OV-087, piso de 3 hab. con terraza, 88 m², 248.000 €. ¿Te paso las fichas o quieres verlos?', hora: '22:15' },
      { de: 'cliente', texto: 'Me gustaría ver el OV-112', hora: '22:16' },
      { de: 'asistente', texto: 'Perfecto. Puedo darte visita el jueves a las 17:00 o a las 18:30. ¿Cuál te viene mejor?', hora: '22:16' },
      { de: 'cliente', texto: 'Jueves a las 18:30', hora: '22:17' },
      { de: 'asistente', texto: '✅ Visita confirmada: jueves a las 18:30 para la Ref. OV-112. Nuestro comercial te enviará la dirección exacta.', hora: '22:17' },
    ],
    ejemplo: {
      titulo: 'Así atiende a un interesado a las diez de la noche',
      texto: 'Pregunta lo justo para entender qué busca, le enseña los inmuebles de tu cartera que encajan y deja la visita en tu agenda. Tú lo ves todo en tu panel a la mañana siguiente.',
    },
    pasos: {
      intro: 'Cómo funciona: en tres pasos, tu inmobiliaria atiende a todos los leads.',
      items: [
        { title: 'Nos cuentas cómo trabajas', description: 'Qué operaciones llevas, cómo organizas las visitas y qué debe pasar siempre a una persona.' },
        { title: 'Lo configuramos con tu cartera y tu WhatsApp', description: 'Cargamos tus inmuebles y conectamos el WhatsApp Business de tu inmobiliaria. Puedes seguir usando la app de WhatsApp Business.' },
        { title: 'Empieza a atender', description: 'El agente contesta a cada lead, busca en tu cartera y agenda las visitas. Tú entras en cualquier conversación cuando quieras.' },
      ],
    },
    cierre: {
      titulo: 'Prueba la demo: escribe a nuestra inmobiliaria de ejemplo',
      texto: 'Es un agente real con una cartera de ejemplo. Escríbele como lo haría un cliente y mira cómo cualifica, busca en la cartera y te propone una visita.',
    },
    faq: [
      { pregunta: '¿El agente se inventa inmuebles?', respuesta: 'No. Solo ofrece inmuebles disponibles de tu cartera, con su referencia. Si nada encaja, lo dice y propone ampliar la zona, el presupuesto o las habitaciones.' },
      { pregunta: '¿Da la dirección exacta del inmueble?', respuesta: 'No. Habla de la zona, pero nunca da la calle ni el número. La dirección exacta la envía tu comercial cuando la visita está confirmada.' },
      { pregunta: '¿Puedo seguir usando mi WhatsApp?', respuesta: 'Sí. Conectamos el WhatsApp Business de tu inmobiliaria y puedes seguir usando la app como siempre: tus clientes escriben al número de siempre y el agente contesta desde él.' },
      { pregunta: '¿Qué pasa si el cliente quiere hablar con una persona?', respuesta: 'El agente te pasa la conversación con un aviso en el móvil y deja de contestar en ella hasta que lo hagas tú. Todas las conversaciones quedan en tu panel.' },
      { pregunta: '¿Funciona con mi web?', respuesta: 'Si tu web es WordPress, instalamos un plugin que publica tu cartera con fichas, galería, filtros y botón de WhatsApp, y la mantiene sincronizada con el agente. Si no, cargamos la cartera desde un CSV o estudiamos cómo conectar tu programa.' },
      { pregunta: '¿Cuánto tarda la puesta en marcha?', respuesta: 'Depende sobre todo de cómo tengas la cartera. Cuando vemos cómo trabajas te damos una fecha concreta.' },
      { pregunta: '¿Cuánto cuesta?', respuesta: 'Te hacemos un presupuesto personalizado según tu volumen de contactos y cómo tengas la cartera. Sin permanencia: puedes darte de baja cuando quieras con 30 días de preaviso.' },
    ],
    mensajeWhatsApp: 'Hola, busco un piso de 3 habitaciones en Oviedo para comprar, hasta unos 250.000 €',
    imagen: '/sectores/inmobiliarias.webp',
    // Placeholder (ilustración) hasta tener foto: storage/originales/sectores/inmobiliarias.jpg + scripts/gen-sector-images.mjs, y cambiar este alt.
    imagenAlt: 'Ilustración de un chat de WhatsApp en el que un agente IA de una inmobiliaria envía la ficha de un piso',
    etiquetaNegocio: 'Inmobiliaria',
    servicio: 'el agente de WhatsApp para inmobiliarias',
    demo: { numero: DEMO_INMOBILIARIA_WHATSAPP, textoBoton: 'Prueba tu demo por WhatsApp', textoFormulario: 'Pide tu presupuesto' },
  },
}

/** Mensaje prerrellenado de la demo de restaurantes (página propia, /agentes-ia-restaurantes). */
export const MENSAJE_DEMO_RESTAURANTE = 'Hola, quiero ver una demo del agente para restaurantes'

/** Orígenes de lead que acepta /api/lead: restaurantes y las landings sectoriales. */
/** numeroDemo: WhatsApp de la demo si no es el comercial (inmobiliarias). */
export type FuenteLead = { ruta: string; servicio: string; etiquetaNegocio: string; mensajeDemo: string; numeroDemo?: string }

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
      numeroDemo: s.demo?.numero,
    }]),
  ),
}

/** Tarjetas «Por sector» (/agentes-ia#por-sector) y enlaces de la tarjeta Agentes IA de la home. */
export const TARJETAS_SECTOR: { clave: string; nombre: string; nombreCorto: string; icono: NombreIcono; texto: string; enlaces: [string, string][] }[] = [
  { clave: 'restaurantes', nombre: 'Restaurantes', nombreCorto: 'Restaurantes', icono: 'UtensilsCrossed', texto: 'Reservas de mesa 24 h, menú del día con sus alérgenos y registro de jornada del equipo.', enlaces: [['/agentes-ia-restaurantes', 'Agente para restaurantes']] },
  { clave: 'peluquerias', nombre: 'Peluquerías y estética', nombreCorto: 'Peluquerías', icono: 'Scissors', texto: 'Citas, cambios y cancelaciones a cualquier hora, recordatorios y los huecos libres ofrecidos al momento.', enlaces: [['/agentes-ia-peluquerias', 'Agente para peluquerías']] },
  { clave: 'clinicas', nombre: 'Clínicas', nombreCorto: 'Clínicas', icono: 'Stethoscope', texto: 'Dentales, de fisioterapia y veterinarias: citas, recordatorios y preguntas frecuentes; lo clínico, a una persona.', enlaces: [['/agentes-ia-clinicas', 'Agente para clínicas']] },
  { clave: 'talleres', nombre: 'Talleres', nombreCorto: 'Talleres', icono: 'Wrench', texto: 'Citas de revisión, pre-ITV, neumáticos o diagnosis, y los presupuestos, a una persona.', enlaces: [['/agentes-ia-talleres', 'Agente para talleres']] },
  { clave: 'inmobiliarias', nombre: 'Inmobiliarias', nombreCorto: 'Inmobiliarias', icono: 'KeyRound', texto: 'Responde a cada lead al momento, busca en tu cartera real, envía fichas y agenda las visitas.', enlaces: [['/agentes-ia-inmobiliarias', 'Agente para inmobiliarias']] },
  { clave: 'ecommerce', nombre: 'Tiendas online', nombreCorto: 'E-commerce', icono: 'ShoppingCart', texto: 'Catálogo real, estado de los pedidos y enlace de pago por WhatsApp, conectado a tu tienda.', enlaces: [['/agentes-ia-prestashop', 'PrestaShop'], ['/agentes-ia-woocommerce', 'WooCommerce']] },
]
