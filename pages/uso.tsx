import Seo from '../components/Seo'
import Link from 'next/link'
import Logo from '../components/Logo'
import LegalIdentity from '../components/LegalIdentity'
import { CONTACT_EMAIL, LEGAL_OWNER, LEGAL_TRADE_NAME, LEGAL_NIF, LEGAL_ADDRESS, LEGAL_PHONE } from '../lib/constants'

// Párrafo, lista o párrafo con encabezado en negrita
type Bloque = string | string[] | { n: string; t: string }

const SECCIONES: Array<[string, Bloque[]]> = [
  ['1. Quién presta los servicios', [
    `Los servicios de ${LEGAL_TRADE_NAME} los presta ${LEGAL_OWNER}, trabajador autónomo, con NIF ${LEGAL_NIF} y domicilio en ${LEGAL_ADDRESS} ("${LEGAL_TRADE_NAME}", "nosotros"). Contacto: ${CONTACT_EMAIL} · ${LEGAL_PHONE}. ${LEGAL_TRADE_NAME} es un nombre comercial, no una sociedad.`,
  ]],
  ['2. Objeto y aceptación', [
    `Estos términos regulan el uso de todos los servicios de ${LEGAL_TRADE_NAME} (los "Servicios"). Al registrarte, contratar o usar cualquiera de ellos los aceptas íntegramente; si actúas en nombre de un negocio, declaras que tienes capacidad para obligarlo. Si no estás de acuerdo, no uses los Servicios.`,
    'Junto con estos términos se aplican el Aviso Legal, la Política de Privacidad y la Política de Cookies. Si para un Servicio existen condiciones particulares, un presupuesto aceptado o un contrato firmado, estos prevalecen en lo que difieran.',
  ]],
  ['3. Servicios cubiertos', [
    [
      'Servix: software de gestión y punto de venta para hostelería.',
      'GymStack: software de gestión para gimnasios y centros deportivos.',
      'Agentes IA: asistentes automáticos basados en inteligencia artificial que atienden a los clientes de tu negocio por WhatsApp, incluidas las integraciones con tiendas online (PrestaShop, WooCommerce).',
      'Agentes de voz: asistentes automáticos basados en inteligencia artificial que atienden llamadas telefónicas de tu negocio.',
      'News: resúmenes de noticias en audio generados con inteligencia artificial.',
      'Desarrollo a medida: proyectos de software, web o comercio electrónico. Se rigen por su presupuesto o contrato; estos términos se aplican en lo no previsto en ellos.',
      'Cualquier otro producto que se incorpore en el futuro a la plataforma.',
    ],
  ]],
  ['4. Registro y cuenta', [
    'Debes registrarte con datos verídicos y mantenerlos actualizados, ser mayor de edad y custodiar tus credenciales. Eres responsable de todo lo que se haga con tu cuenta, incluido el uso por tus empleados o colaboradores, y debes avisarnos de inmediato de cualquier acceso no autorizado.',
  ]],
  ['5. Planes, precios y pagos', [
    [
      'Cada precio publicado en la web indica si incluye o no el IVA. Los presupuestos indican el IVA por separado.',
      'La suscripción se paga por adelantado al inicio de cada periodo (mensual o anual), a través de nuestros proveedores de pago. Emitimos factura de cada cobro.',
      'Los planes gratuitos tienen funciones y límites reducidos. Podemos modificarlos o retirarlos avisando con 30 días de antelación.',
      'Algunos Servicios incluyen consumos variables (por ejemplo, mensajes de WhatsApp, minutos de llamada o uso de inteligencia artificial). Sus límites y el precio del exceso figuran en el plan o presupuesto; al alcanzarlos podemos limitar el Servicio hasta el siguiente periodo o facturar el exceso según lo acordado.',
      'Podemos cambiar los precios avisando por email con al menos 30 días de antelación. El cambio se aplica a partir del siguiente periodo; si no estás de acuerdo puedes cancelar antes.',
      'Si un pago no se completa, te avisaremos. Pasados 7 días sin regularizarlo podremos suspender el Servicio y, pasados 30 días, cancelarlo.',
    ],
  ]],
  ['6. Duración, cancelación y reembolsos', [
    [
      'No hay permanencia, salvo que se pacte expresamente. Puedes cancelar en cualquier momento; la cancelación surte efecto al final del periodo ya pagado.',
      'No se realizan reembolsos por el periodo en curso ni por la parte no disfrutada de un plan anual, salvo incumplimiento grave por nuestra parte o cuando la ley lo exija.',
      `Consumidores: si contratas como consumidor (no para tu actividad empresarial o profesional), puedes desistir en 14 días naturales desde la contratación, sin indicar el motivo, escribiendo a ${CONTACT_EMAIL}. Te devolveremos lo pagado, descontando la parte proporcional del servicio ya prestado si pediste que empezara de inmediato.`,
    ],
  ]],
  ['7. Uso aceptable', [
    'No está permitido:',
    [
      'usar los Servicios para actividades ilegales o para enviar comunicaciones no solicitadas (spam);',
      'acceder o intentar acceder a datos de otros clientes, o eludir medidas de seguridad;',
      'realizar ingeniería inversa, copiar o revender los Servicios sin autorización escrita;',
      'introducir malware o sobrecargar deliberadamente la plataforma;',
      'suplantar a otra persona u organización, o cargar contenidos ilícitos o que vulneren derechos de terceros;',
      'configurar los agentes de IA para engañar a las personas sobre su naturaleza automatizada o para manipularlas.',
    ],
  ]],
  ['8. Condiciones específicas de los servicios con inteligencia artificial', [
    'Se aplican a Agentes IA, Agentes de voz, News y a cualquier función de IA de los demás Servicios.',
    { n: '8.1. Cómo funcionan.', t: 'Estos servicios generan respuestas de forma automática con modelos de inteligencia artificial de terceros. Sus respuestas pueden contener errores, omisiones o información inexacta, y pueden variar ante una misma pregunta. No garantizamos que sean correctas o completas, ni un resultado concreto (ventas, citas, reservas o ahorro de tiempo).' },
    { n: '8.2. Lo que depende de ti.', t: `Eres responsable de que la información de tu negocio que configuras (horarios, precios, servicios, disponibilidad, políticas) sea veraz y esté actualizada; de revisar periódicamente las conversaciones, transcripciones y citas generadas; y de mantener un canal de atención humana. Lo que el agente comunique o acuerde con tus clientes a partir de lo que has configurado se entiende hecho por tu negocio, no por ${LEGAL_TRADE_NAME}.` },
    { n: '8.3. Usos no permitidos.', t: 'Los agentes no prestan asesoramiento médico, jurídico, financiero ni profesional de ningún tipo y no deben configurarse para ello. No deben usarse para tomar decisiones con efectos jurídicos o similares sobre las personas sin intervención humana. El agente de voz no sustituye a los servicios de emergencia (112) ni debe usarse en líneas de urgencias.' },
    { n: '8.4. Transparencia con tus clientes.', t: 'Debes informar a tus clientes de que hablan o escriben con un asistente automático, y no puedes configurar el agente para ocultarlo. En las llamadas, debes informar además de que se transcriben o graban y cumplir la normativa aplicable.' },
    { n: '8.5. WhatsApp, telefonía y otros terceros.', t: 'Estos servicios dependen de plataformas y operadores ajenos (como Meta/WhatsApp, operadores de telefonía y proveedores de modelos de IA y de voz). Debes cumplir sus políticas, en especial las de WhatsApp Business (consentimiento de los destinatarios, uso de plantillas y política de comercio). No respondemos de la suspensión, bloqueo o limitación de tu número o cuenta, de los cambios de tarifas o condiciones, ni de las interrupciones que decidan o sufran esos terceros.' },
    { n: '8.6. Datos e IA.', t: 'Para generar las respuestas, el contenido de las conversaciones y llamadas se envía a nuestros proveedores de IA y de voz, que actúan como encargados del tratamiento. No utilizamos tus datos ni los de tus clientes para entrenar modelos de inteligencia artificial. Los detalles están en la Política de Privacidad.' },
    { n: '8.7. Uso razonable.', t: 'Podemos aplicar límites técnicos o suspender temporalmente un agente ante usos anómalos o abusivos, avisándote.' },
    { n: '8.8. News.', t: 'Los resúmenes se generan automáticamente a partir de fuentes de terceros, con finalidad meramente informativa. Pueden contener errores y no constituyen asesoramiento. La información original pertenece a sus respectivos medios.' },
  ]],
  ['9. Tus datos y contenidos', [
    [
      'Los datos que introduces en los Servicios son tuyos. Nos concedes únicamente el permiso necesario para alojarlos y tratarlos con el fin de prestarte el Servicio. No los vendemos.',
      'Protección de datos: respecto de los datos personales de tus clientes, empleados o socios, tú eres el responsable del tratamiento y nosotros el encargado, en los términos de la Política de Privacidad. Garantizas que cuentas con base legal para tratarlos y para comunicarte con ellos.',
      'Hacemos copias de seguridad periódicas, pero te recomendamos exportar regularmente la información crítica para tu negocio.',
      'Al cancelar una suscripción dispones de 30 días para exportar tus datos; después se eliminan, salvo los que debamos conservar por obligación legal.',
      'Los Servicios son herramientas de gestión. El cumplimiento de las obligaciones legales de tu negocio (fiscales, laborales, de consumo, sanitarias, de facturación u otras) es responsabilidad tuya.',
    ],
  ]],
  ['10. Propiedad intelectual', [
    `El software, los diseños, la marca ${LEGAL_TRADE_NAME} y los nombres de los Servicios son de su titular o de sus licenciantes. Durante la vigencia de tu suscripción te concedemos una licencia de uso no exclusiva e intransferible, limitada a tu propio negocio. En los desarrollos a medida, la titularidad del resultado se rige por el presupuesto o contrato. Si nos envías sugerencias, podemos usarlas libremente para mejorar los Servicios.`,
  ]],
  ['11. Disponibilidad y soporte', [
    'Nuestro objetivo es una disponibilidad del 99 % mensual en cada Servicio, sin contar el mantenimiento programado (que avisaremos siempre que sea posible) ni las incidencias por causas ajenas a nosotros (proveedores, operadores, tu conexión o fuerza mayor). El soporte se presta por email en días laborables. No garantizamos un funcionamiento ininterrumpido ni libre de errores.',
  ]],
  ['12. Limitación de responsabilidad', [
    [
      'Los Servicios se prestan "tal cual" y según disponibilidad.',
      'En la medida que permita la ley, no respondemos del lucro cesante, la pérdida de ingresos, clientes, datos o reputación, ni de los daños indirectos; tampoco de los daños derivados de: (a) respuestas o actuaciones de los agentes de IA; (b) la información que tú configuras o introduces; (c) fallos, cambios o decisiones de terceros; (d) el uso contrario a estos términos; o (e) causas de fuerza mayor.',
      'Nuestra responsabilidad total por cualquier concepto queda limitada al importe que hayas pagado por el Servicio afectado en los 12 meses anteriores al hecho que la origine.',
      'Nada de lo anterior limita la responsabilidad por dolo o negligencia grave, ni los derechos que la ley reconoce de forma imperativa a los consumidores.',
    ],
  ]],
  ['13. Indemnidad', [
    'Si usas los Servicios para tu actividad empresarial o profesional, nos mantendrás indemnes frente a reclamaciones de terceros (incluidos tus clientes y las autoridades) derivadas de tus contenidos, de la configuración de tus agentes, de tus comunicaciones comerciales o del incumplimiento por tu parte de estos términos o de la normativa aplicable.',
  ]],
  ['14. Suspensión y resolución', [
    'Podemos suspender o cancelar tu acceso, total o parcialmente, en caso de impago, incumplimiento de estos términos, riesgo para la seguridad o para otros clientes, o requerimiento de una autoridad. Te avisaremos con antelación salvo que la urgencia lo impida. Tú puedes resolver el contrato si incumplimos gravemente nuestras obligaciones y no lo corregimos en un plazo razonable tras tu aviso.',
  ]],
  ['15. Cambios en los Servicios y en estos términos', [
    'Los Servicios evolucionan: podemos añadir, modificar o retirar funciones. Cualquier cambio en estos términos se notificará por email con al menos 30 días de antelación. Si no estás de acuerdo, puedes cancelar antes de su entrada en vigor; seguir usando los Servicios después supone su aceptación.',
  ]],
  ['16. Disposiciones generales', [
    'Si alguna cláusula resultara nula, el resto seguirá vigente. No ejercer un derecho no supone renunciar a él. Podemos ceder el contrato a quien continúe la actividad, avisándote. Las comunicaciones se harán por email a la dirección de tu cuenta.',
  ]],
  ['17. Ley aplicable y jurisdicción', [
    'Estos términos se rigen por la ley española. Las partes se someten a los juzgados y tribunales de Oviedo (Asturias). Si contratas como consumidor, serán competentes los de tu domicilio.',
  ]],
  ['18. Contacto', [
    `${CONTACT_EMAIL} · ${LEGAL_PHONE}`,
  ]],
]

export default function Uso() {
  return (
    <>
      <Seo
        title="Términos de Uso — innovapp"
        description="Términos y condiciones de uso de los servicios de innovapp: Servix, GymStack, Agentes IA, Agentes de voz, News y desarrollo a medida."
        canonical="/uso"
      />
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Logo variant="light" height={26} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e1e1e', marginBottom: 8 }}>Términos de Uso</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: octubre 2026</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {SECCIONES.map(([titulo, bloques]) => (
              <div key={titulo} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', marginBottom: 10 }}>{titulo}</h2>
                {bloques.map((b, i) => Array.isArray(b) ? (
                  <ul key={i} style={{ margin: '0 0 12px', paddingLeft: 22 }}>
                    {b.map((li, j) => <li key={j} style={{ marginBottom: 6 }}>{li}</li>)}
                  </ul>
                ) : typeof b === 'string' ? (
                  <p key={i} style={{ margin: '0 0 12px' }}>{b}</p>
                ) : (
                  <p key={i} style={{ margin: '0 0 12px' }}><strong style={{ color: '#1e1e1e' }}>{b.n}</strong> {b.t}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <footer style={{ borderTop: '1px solid #eef1f4', padding: '20px 40px', background: 'white', display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40 }}>
          {[['Aviso Legal','/aviso-legal'],['Privacidad','/privacidad'],['Cookies','/cookies'],['Términos de Uso','/uso']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 12, color: '#88a8b0', textDecoration: 'none' }}>{label}</Link>
          ))}
        </footer>
        <LegalIdentity tono="claro" fondo="white" />
      </div>
    </>
  )
}
