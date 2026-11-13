// Bases legales de la promoción «4 webs gratis + IA» (/webgratis#bases). Las cifras, fechas y la
// cuenta de Instagram salen de lib/promo/config.ts y los datos del organizador de lib/constants.ts,
// para que coincidan con la página y los emails.
import { CONTACT_EMAIL, LEGAL_ADDRESS_ES, LEGAL_NIF, LEGAL_OWNER, LEGAL_TRADE_NAME } from '../constants'
import { CUOTA_MANTENIMIENTO, DIAS_ACEPTAR, DIAS_MATERIAL, INSTAGRAM_HANDLE, MAX_SUPLENTES, MAX_WEBS, PERMANENCIA_MESES, PRECIO_IA_DESDE } from './config'

export const BASES_TITULO = `Bases de la promoción «${MAX_WEBS} webs gratis + IA para negocios»`

export const BASES_INTRO = 'Es una selección por criterios entre todos los participantes, no un sorteo de azar.'

/** Puntos de las bases, en orden; el número («1.», «2.»…) se añade al pintarlos. */
export const BASES: { titulo: string; texto: string[] }[] = [
  { titulo: 'Organizador', texto: [`${LEGAL_OWNER}, con nombre comercial ${LEGAL_TRADE_NAME}, NIF ${LEGAL_NIF}, domicilio en ${LEGAL_ADDRESS_ES}, ${CONTACT_EMAIL}.`] },
  { titulo: 'Objeto', texto: [`${LEGAL_TRADE_NAME} diseñará y desarrollará gratuitamente la página web de ${MAX_WEBS} negocios seleccionados entre todos los participantes, en las condiciones de estas bases.`] },
  { titulo: 'Ámbito y quién puede participar', texto: ['Autónomos, comercios, pymes y profesionales de cualquier sector con actividad en España. La solicitud la presenta el titular o representante legal, mayor de edad.'] },
  { titulo: 'Plazo', texto: [`Inscripciones desde la publicación de estas bases en innovapp.es/webgratis hasta el 15 de diciembre de 2026 a las 12:00 (hora peninsular). Los ${MAX_WEBS} seleccionados se anunciarán ese mismo 15 de diciembre de 2026 en las redes de ${LEGAL_TRADE_NAME} y se les avisará por email.`] },
  {
    titulo: 'Requisitos para participar',
    texto: [
      'Cumplir los dos pasos, en el plazo:',
      `1. Seguir la cuenta de Instagram @${INSTAGRAM_HANDLE} durante toda la promoción.`,
      '2. Rellenar el formulario de innovapp.es/webgratis con datos veraces, incluido el usuario de Instagram y una breve explicación del negocio (a qué se dedica y qué le gustaría mejorar o automatizar).',
      `Una inscripción por negocio. ${LEGAL_TRADE_NAME} comprobará que se cumplen ambos requisitos antes de la selección.`,
    ],
  },
  { titulo: 'Criterios de selección', texto: [`${LEGAL_TRADE_NAME} seleccionará ${MAX_WEBS} negocios ganadores y ${MAX_SUPLENTES} suplentes entre los participantes que cumplan los requisitos. Valorará: ausencia de web o web desactualizada, interés en reservas online o automatización con IA, claridad de la explicación del negocio, visibilidad del negocio y disponibilidad para colaborar en los plazos. Para elegir entre candidaturas similares se favorecerá la variedad de sectores, de modo que, siempre que sea posible, no haya dos ganadores del mismo sector. La decisión corresponde a ${LEGAL_TRADE_NAME} y no es recurrible.`] },
  { titulo: 'Ganadores y suplentes', texto: [`Los ${MAX_SUPLENTES} suplentes se ordenan del 1 al ${MAX_SUPLENTES}. Si un ganador renuncia, no responde o incumple los plazos, su lugar pasa al primer suplente disponible, y así sucesivamente.`] },
  {
    titulo: 'Plazos para los seleccionados',
    texto: [
      `• Aceptar la selección y las condiciones respondiendo al email de aviso en un máximo de ${DIAS_ACEPTAR} días naturales.`,
      `• Aportar en un máximo de ${DIAS_MATERIAL} días naturales desde la aceptación: el dominio (registrado a su nombre, o los datos de acceso para que ${LEGAL_TRADE_NAME} gestione el alta) y la información para el desarrollo (logo, textos, fotos y lista de servicios o productos con precios).`,
      `Si no se cumple alguno de estos plazos, ${LEGAL_TRADE_NAME} podrá dar por perdida la plaza y asignarla al siguiente suplente, sin derecho a compensación.`,
    ],
  },
  { titulo: 'Publicación de seleccionados', texto: [`El 15 de diciembre de 2026 ${LEGAL_TRADE_NAME} publicará en sus redes sociales y en innovapp.es/webgratis el nombre comercial del negocio y la cuenta de Instagram de los ${MAX_WEBS} ganadores y de los ${MAX_SUPLENTES} suplentes (indicando su orden), y les avisará por email. Al inscribirse, los participantes autorizan esta publicación en caso de resultar seleccionados.`] },
  {
    titulo: 'Qué incluye (gratis)',
    texto: [
      '• Web de una página: presentación, servicios o productos, precios, galería, ubicación, horario, botón de WhatsApp y formulario de contacto.',
      `• Diseño adaptado a móvil, partiendo de una plantilla de ${LEGAL_TRADE_NAME} personalizada con logo, colores, textos y fotos aportados por el negocio.`,
      '• Una ronda de cambios tras la entrega del primer diseño.',
      '• 2 meses sin coste de reservas online o asistente con IA (a elegir).',
    ],
  },
  { titulo: 'Qué no incluye', texto: ['Dominio, textos y fotografías profesionales, tienda online, páginas adicionales, más rondas de cambios o funcionalidades a medida. Se presupuestan aparte.'] },
  { titulo: 'Coste a cargo del negocio', texto: [`El dominio corre por cuenta del negocio: se registra y se paga a su nombre (${LEGAL_TRADE_NAME} puede gestionar el alta si se le facilita el acceso). La web se aloja obligatoriamente en los servidores de ${LEGAL_TRADE_NAME}; alojamiento y mantenimiento: ${CUOTA_MANTENIMIENTO} €/mes + IVA, con permanencia mínima de ${PERMANENCIA_MESES} meses desde la publicación. Pasados los 2 meses gratis, la herramienta de IA o reservas se presupuesta según las necesidades de cada negocio, desde ${PRECIO_IA_DESDE} €/mes + IVA, si el negocio quiere mantenerla; si no, se desactiva sin coste.`] },
  { titulo: 'Compromisos del negocio seleccionado', texto: [`Entregar logo, textos, fotos y lista de servicios o productos en un máximo de 15 días; dar su opinión (testimonio escrito o en vídeo) y una reseña en Google si queda satisfecho; autorizar a ${LEGAL_TRADE_NAME} a mostrar la web y el nombre del negocio como caso de éxito; mantener el texto «Web hecha por ${LEGAL_TRADE_NAME}» en el pie.`] },
  { titulo: 'Propiedad', texto: [`El dominio y los contenidos aportados son del negocio. La plantilla y el código son de ${LEGAL_TRADE_NAME} y se ceden en uso mientras esté vigente el alojamiento con ${LEGAL_TRADE_NAME}. Si el negocio lo da de baja tras la permanencia, conserva su dominio y sus contenidos; el código y la plantilla no se entregan, salvo compra aparte.`] },
  { titulo: 'Redes sociales', texto: [`Esta promoción no está patrocinada, avalada ni administrada por Instagram, Facebook ni Meta, ni asociada a ellas. Los participantes liberan a Meta de toda responsabilidad, y los datos se facilitan a ${LEGAL_TRADE_NAME}, no a Meta.`] },
  { titulo: 'Protección de datos', texto: [`Responsable: ${LEGAL_OWNER} (${LEGAL_TRADE_NAME}). Finalidad: gestionar la inscripción y la selección; si se consiente expresamente, enviar comunicaciones comerciales sobre desarrollo web, aplicaciones y automatización con IA; y, en caso de resultar ganador o suplente, publicar el nombre comercial del negocio y su cuenta de Instagram. Legitimación: consentimiento y gestión de la inscripción. No se ceden datos a terceros salvo proveedores tecnológicos con contrato de encargo. Derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en ${CONTACT_EMAIL}; reclamación ante la AEPD. Más información en https://innovapp.es/privacidad.`] },
  { titulo: 'Modificación y cancelación', texto: [`${LEGAL_TRADE_NAME} puede modificar o cancelar la promoción por causas justificadas, avisando en innovapp.es.`] },
  { titulo: 'Aceptación', texto: ['Inscribirse implica aceptar estas bases.'] },
]
