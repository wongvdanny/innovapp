// Genera un post de blog nuevo con Claude en dos pasadas: (1) generación del borrador,
// obligado a enlazar a una de las páginas de servicio y a ceñirse a
// content/verified-facts.md, y (2) verificación estricta de que el borrador no afirma
// nada que no esté respaldado por ese documento. Si la verificación falla se hace UNA
// reescritura con las violaciones encontradas y se vuelve a verificar; si vuelve a
// fallar, el borrador va a content/blog/.rejected/. Si el texto no enlaza a la página de
// servicio, se añade un CTA final con el enlace (no se rechaza por eso). Solo si pasa se
// escribe content/blog/{slug}.mdx y se actualiza .topics-log.json. Evita repetir temas
// ya usados (content/blog/.topics-log.json).
// Uso: node scripts/generate-blog-post.mjs  (o  npm run blog:generate)
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

try {
  process.loadEnvFile()
} catch {
  // Sin .env local (p.ej. si las variables ya vienen del entorno del proceso) -- no es un error.
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BLOG_DIR = join(ROOT, 'content/blog')
const REJECTED_DIR = join(BLOG_DIR, '.rejected')
const TOPICS_LOG_PATH = join(BLOG_DIR, '.topics-log.json')
const TOPICS_EXCLUDED_PATH = join(BLOG_DIR, '.topics-excluded.json')
const VERIFIED_FACTS_PATH = join(ROOT, 'content/verified-facts.md')
const MODEL = 'claude-haiku-4-5-20251001'
const DIAS_EXCLUSION_TEMPORAL = 7

// Rutas de servicio válidas -- el post DEBE enlazar a una de ellas, en formato markdown
// [texto](ruta). El regex exige que la ruta sea EXACTAMENTE una de estas tres (con
// slash final opcional), no basta con que "/agentes-ia" aparezca como prefijo de las
// otras dos -- así no cuela un enlace a /agentes-ia-prestashop como si fuera el genérico.
// Acepta tanto ruta relativa (/agentes-ia) como URL absoluta del mismo dominio
// (https://innovapp.es/agentes-ia) -- el prompt de generación sigue pidiendo ruta
// relativa como preferencia, pero un post que use la absoluta no debe rechazarse solo
// por el formato del enlace (visto en pruebas reales de la tarea anterior).
const RUTAS_SERVICIO = ['/agentes-ia', '/agentes-ia-prestashop', '/agentes-ia-woocommerce']
const PATRON_ENLACE_SERVICIO = /\]\((?:https:\/\/innovapp\.es)?\/agentes-ia(?:-prestashop|-woocommerce)?\/?\)/

function leerHechosVerificados() {
  if (!existsSync(VERIFIED_FACTS_PATH)) {
    console.error('Error: falta content/verified-facts.md (fuente única de verdad sobre qué hace el producto). No se genera el post sin ella, para evitar que el modelo invente funciones que no existen.')
    process.exit(1)
  }
  return readFileSync(VERIFIED_FACTS_PATH, 'utf8')
}

function leerLogDeTemas() {
  if (!existsSync(TOPICS_LOG_PATH)) return []
  try {
    const contenido = JSON.parse(readFileSync(TOPICS_LOG_PATH, 'utf8'))
    return Array.isArray(contenido) ? contenido : []
  } catch (error) {
    console.error('Error al leer content/blog/.topics-log.json:', error.message)
    process.exit(1)
  }
}

function leerTemasExcluidos() {
  if (!existsSync(TOPICS_EXCLUDED_PATH)) return []
  try {
    const contenido = JSON.parse(readFileSync(TOPICS_EXCLUDED_PATH, 'utf8'))
    return Array.isArray(contenido) ? contenido : []
  } catch (error) {
    console.error('Error al leer content/blog/.topics-excluded.json:', error.message)
    process.exit(1)
  }
}

function guardarTemasExcluidos(temas) {
  writeFileSync(TOPICS_EXCLUDED_PATH, JSON.stringify(temas, null, 2) + '\n', 'utf8')
}

/**
 * Poda las entradas de más de DIAS_EXCLUSION_TEMPORAL días (no se arrastran
 * indefinidamente) y persiste el resultado podado. Devuelve solo las recientes, que son
 * las que se pasan al prompt de esta ejecución.
 */
function podarYObtenerTemasExcluidosRecientes() {
  const todos = leerTemasExcluidos()
  const limite = Date.now() - DIAS_EXCLUSION_TEMPORAL * 24 * 60 * 60 * 1000
  const recientes = todos.filter((t) => new Date(t.rejectedDate).getTime() >= limite)
  guardarTemasExcluidos(recientes)
  return recientes
}

function anadirTemaExcluido(topic) {
  const temas = leerTemasExcluidos()
  temas.push({ topic, rejectedDate: new Date().toISOString().slice(0, 10) })
  guardarTemasExcluidos(temas)
}

function normalizarSlug(slug) {
  return String(slug)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes (marcas diacríticas tras normalize('NFD'))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Si el slug ya existe como archivo (en BLOG_DIR o, opcionalmente, en otro directorio), añade -2, -3, ... hasta encontrar uno libre. */
function resolverSlugSinColision(slugBase, dir = BLOG_DIR, extension = '.mdx') {
  let slug = slugBase
  let intento = 2
  while (existsSync(join(dir, `${slug}${extension}`))) {
    slug = `${slugBase}-${intento}`
    intento++
  }
  return slug
}

/**
 * Extrae y parsea el primer objeto JSON balanceado de la respuesta del modelo: busca
 * el primer '{' y cuenta llaves anidadas (ignorando las que caigan dentro de strings,
 * incluidas las escapadas) hasta encontrar su '}' de cierre correspondiente. Esto es
 * más robusto que un regex de "primer { hasta último }", que se rompe si el modelo
 * añade cualquier cosa después del JSON (una explicación, una llave suelta en un
 * ejemplo, etc.) -- causa real del fallo "Unexpected non-whitespace character after
 * JSON" visto en producción. También tolera que el JSON venga envuelto en backticks de
 * markdown (```json ... ```), aunque el prompt pida explícitamente que no los use.
 */
function extraerJsonBalanceado(texto) {
  const limpio = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const inicio = limpio.indexOf('{')
  if (inicio === -1) {
    throw new Error('No se encontró ningún "{" en la respuesta del modelo')
  }

  let profundidad = 0
  let dentroString = false
  let escapando = false

  for (let i = inicio; i < limpio.length; i++) {
    const c = limpio[i]

    if (escapando) {
      escapando = false
      continue
    }
    if (c === '\\' && dentroString) {
      escapando = true
      continue
    }
    if (c === '"') {
      dentroString = !dentroString
      continue
    }
    if (dentroString) continue

    if (c === '{') {
      profundidad++
    } else if (c === '}') {
      profundidad--
      if (profundidad === 0) {
        return JSON.parse(limpio.slice(inicio, i + 1))
      }
    }
  }

  throw new Error('No se encontró un "}" de cierre balanceado para el JSON en la respuesta del modelo')
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const REINTENTOS_MAXIMOS = 3
const DELAY_ENTRE_REINTENTOS_MS = 2500

async function llamarClaudeUnaVez(anthropic, { system, userContent, maxTokens }) {
  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }],
  })
  const bloqueTexto = respuesta.content.find((b) => b.type === 'text')
  if (!bloqueTexto) {
    throw new Error('La respuesta del modelo no incluye ningún bloque de texto')
  }
  return extraerJsonBalanceado(bloqueTexto.text)
}

/**
 * Llama a Claude con reintento automático si falla la extracción/parseo del JSON de
 * respuesta -- un fallo transitorio del modelo (p.ej. texto extra después del JSON, o
 * un truncamiento puntual), no un problema de la lógica. Hasta REINTENTOS_MAXIMOS
 * intentos totales (osea 2 reintentos además del primero), con una pequeña espera
 * entre cada uno para no golpear la API en ráfaga. Se loguea cada intento fallido con
 * su motivo, para que quede rastro en el log del pipeline aunque el intento siguiente
 * funcione. Si TODOS los intentos fallan, se relanza el último error tal cual -- el
 * llamador aborta como antes, nunca se fuerza una publicación con datos a medias.
 */
async function llamarClaudeConReintento(anthropic, params, etiqueta) {
  let ultimoError
  for (let intento = 1; intento <= REINTENTOS_MAXIMOS; intento++) {
    try {
      return await llamarClaudeUnaVez(anthropic, params)
    } catch (error) {
      ultimoError = error
      const quedan = REINTENTOS_MAXIMOS - intento
      console.error(
        `Intento ${intento}/${REINTENTOS_MAXIMOS} de "${etiqueta}" falló: ${error.message}` +
          (quedan > 0 ? ` -- reintentando en ${DELAY_ENTRE_REINTENTOS_MS / 1000}s...` : ' -- sin más reintentos.')
      )
      if (quedan > 0) {
        await esperar(DELAY_ENTRE_REINTENTOS_MS)
      }
    }
  }
  throw ultimoError
}

// --- Paso 1: generación del borrador ---

/**
 * Extrae de verified-facts.md las viñetas que describen funciones NO implementadas:
 * las que empiezan por "NO" en mayúsculas o dicen "no (está) implementado". Cada viñeta
 * puede ocupar varias líneas (las de continuación van indentadas), así que se agrupan
 * antes de filtrar. La viñeta "NO como plataforma self-service" no entra porque el
 * "NO" va en medio de la frase, no al principio.
 */
function extraerFuncionesNoImplementadas(hechosVerificados) {
  const vinetas = []
  for (const linea of hechosVerificados.split('\n')) {
    if (/^-\s+/.test(linea)) {
      vinetas.push(linea.replace(/^-\s+/, '').trim())
    } else if (/^\s+\S/.test(linea) && vinetas.length > 0) {
      vinetas[vinetas.length - 1] += ' ' + linea.trim()
    }
  }
  return vinetas.filter((v) => /^NO\b/.test(v) || /no (?:está )?implementad[oa]/i.test(v))
}

function construirSystemPromptGeneracion(hechosVerificados) {
  const noImplementadas = extraerFuncionesNoImplementadas(hechosVerificados)
  const bloqueProhibido = noImplementadas.length > 0
    ? `

=== PROHIBIDO ===
Estas funciones NO existen en el producto. NO las menciones ni las sugieras de ninguna forma: ni como función de Innovapp, ni como consejo general o manual para el lector (p.ej. "envía un recordatorio el día antes", "recupera los carritos abandonados con un mensaje"), ni como algo que "se puede hacer" con WhatsApp. Si el tema del artículo te lleva hacia ellas, cambia de ángulo.
${noImplementadas.map((f) => `- ${f}`).join('\n')}
=== FIN DE PROHIBIDO ===`
    : ''

  return `Eres el redactor del blog de Innovapp, una empresa española que desarrolla agentes de IA por WhatsApp para negocios locales (peluquerías, clínicas estéticas, gimnasios, talleres, veterinarias, inmobiliarias) y para tiendas online (PrestaShop, WooCommerce).

El público objetivo del blog son dueños y gestores de estos negocios -- NO son desarrolladores ni gente técnica. Escribe en español de España, con tono profesional pero cercano, centrado en problemas reales del día a día del negocio (perder clientes por no responder WhatsApp a tiempo, huecos de agenda mal aprovechados, automatizar reservas, no perder ventas por falta de atención fuera de horario, etc.), sin tecnicismos innecesarios.

Elige UN tema relevante para ese público que NO esté ya cubierto en la lista de temas ya publicados que se te pasa a continuación. Evita repetir el mismo ángulo de un tema ya tratado.

Longitud objetivo del cuerpo del artículo: 700-1000 palabras, con subtítulos ## donde tenga sentido para que se lea bien.

=== ÚNICA FUENTE DE HECHOS PERMITIDA SOBRE INNOVAPP ===
No afirmes nada sobre lo que hace el producto que no esté en este documento. Si necesitas mencionar una función, usa exactamente cómo está descrita aquí, sin añadir detalles no confirmados. Todo lo marcado como "NO" o "no implementado" (p.ej. recordatorios automáticos de citas, integración con Google Calendar, recuperación automática de carritos abandonados, Instagram Messaging) NUNCA debe mencionarse como función existente, aunque parezca una idea natural para el artículo.

${hechosVerificados}
=== FIN DE LA FUENTE DE HECHOS ===${bloqueProhibido}

ENLACE DE SERVICIO OBLIGATORIO: el post DEBE mencionar y enlazar, en formato markdown [texto del enlace](ruta), a UNA de estas tres páginas -- de forma natural dentro del cuerpo, cerca de donde tenga sentido mencionar el servicio, nunca forzado al final a modo de spam:
- Si el post trata de negocios locales (peluquerías, clínicas, gimnasios, talleres, veterinarias, inmobiliarias) o es un tema general de atención al cliente/WhatsApp → enlaza a /agentes-ia
- Si el post trata específicamente de tiendas PrestaShop → enlaza a /agentes-ia-prestashop
- Si el post trata específicamente de tiendas WooCommerce → enlaza a /agentes-ia-woocommerce
- Si el post trata de e-commerce en general sin mencionar una plataforma concreta, elige la landing (PrestaShop o WooCommerce) que mejor encaje con el ejemplo o caso que uses en el artículo
No inventes ninguna otra ruta -- usa el path EXACTO tal cual aparece arriba.

Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, sin backticks de markdown ni bloques de código, con exactamente esta forma:
{
  "topic": string,
  "title": string,
  "slug": string (kebab-case, sin tildes ni caracteres especiales),
  "description": string (meta description, 150-160 caracteres),
  "contentMarkdown": string (el cuerpo del post en markdown, debe incluir el enlace de servicio),
  "serviceLinkUsed": "/agentes-ia" | "/agentes-ia-prestashop" | "/agentes-ia-woocommerce"
}`
}

function validarPost(post) {
  const camposRequeridos = ['topic', 'title', 'slug', 'description', 'contentMarkdown', 'serviceLinkUsed']
  for (const campo of camposRequeridos) {
    if (typeof post[campo] !== 'string' || !post[campo].trim()) {
      throw new Error(`Falta o está vacío el campo "${campo}" en la respuesta del modelo`)
    }
  }
  if (!RUTAS_SERVICIO.includes(post.serviceLinkUsed)) {
    throw new Error(`serviceLinkUsed "${post.serviceLinkUsed}" no es una de las rutas válidas: ${RUTAS_SERVICIO.join(', ')}`)
  }
}

// --- Paso 2: verificación de hechos ---

const SYSTEM_PROMPT_VERIFICACION = `Eres un verificador de hechos estricto. Te paso un documento de hechos verificados y un borrador de blog post. Tu única tarea es comprobar si CADA afirmación del post sobre lo que hace Innovapp o su producto está respaldada literalmente por el documento de hechos. Si el post afirma algo que no está en el documento, o exagera/generaliza una función (por ejemplo, decir "recupera carritos automáticamente" cuando el documento dice que NO existe esa función), es una violación.

NO incluyas afirmaciones correctas ni comentarios sobre lo que el post hace bien. Si no hay violaciones reales, passed=true y violations=[]. Sugerir al lector una función que el producto no tiene (aunque sea como consejo manual, p.ej. 'envía un recordatorio') cuenta como violación.

Responde ÚNICAMENTE con JSON, sin texto antes ni después, con exactamente esta forma:
{ "passed": boolean, "violations": [{ "cita": string, "motivo": string }] }
donde "cita" es el fragmento EXACTO del post (copiado literalmente, sin parafrasear) que es falso o exagera, y "motivo" es el hecho del documento que lo contradice.`

function validarVerificacion(v) {
  if (typeof v.passed !== 'boolean') {
    throw new Error('Falta o es inválido el campo "passed" en la respuesta de verificación')
  }
  if (!Array.isArray(v.violations)) {
    throw new Error('Falta o es inválido el campo "violations" en la respuesta de verificación')
  }
  for (const [i, violacion] of v.violations.entries()) {
    if (typeof violacion?.cita !== 'string' || typeof violacion?.motivo !== 'string') {
      throw new Error(`La violación #${i + 1} no tiene la forma { "cita": string, "motivo": string }`)
    }
  }
}

function normalizarTexto(texto) {
  return texto.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Descarta las violaciones cuya "cita" no aparece literalmente en el post (el modelo a
 * veces parafrasea o se inventa frases que el borrador no contiene) y recalcula passed
 * a partir de lo que queda -- el passed del modelo se ignora.
 */
function filtrarViolacionesReales(violations, contentMarkdown) {
  const contenido = normalizarTexto(contentMarkdown)
  const reales = []
  for (const v of violations) {
    const cita = normalizarTexto(v.cita)
    if (cita && contenido.includes(cita)) {
      reales.push(v)
    } else {
      console.error(`  (descartada violación con cita que no aparece en el post: "${v.cita}")`)
    }
  }
  return { passed: reales.length === 0, violations: reales }
}

async function verificarPost(anthropic, hechosVerificados, post) {
  const verificacion = await llamarClaudeConReintento(anthropic, {
    system: SYSTEM_PROMPT_VERIFICACION,
    userContent: `DOCUMENTO DE HECHOS VERIFICADOS:\n${hechosVerificados}\n\nBORRADOR DEL POST A VERIFICAR:\n${post.contentMarkdown}`,
    maxTokens: 2048,
  }, 'verificación de hechos')
  validarVerificacion(verificacion)
  return filtrarViolacionesReales(verificacion.violations, post.contentMarkdown)
}

// --- Enlace de servicio: si el modelo no lo puso en el texto, se añade un CTA al final ---

const TEXTOS_CTA = {
  '/agentes-ia': 'Descubre cómo funciona nuestro agente de IA para WhatsApp',
  '/agentes-ia-prestashop': 'Descubre cómo funciona nuestro agente de IA para tiendas PrestaShop',
  '/agentes-ia-woocommerce': 'Descubre cómo funciona nuestro agente de IA para tiendas WooCommerce',
}

function asegurarEnlaceServicio(post) {
  if (PATRON_ENLACE_SERVICIO.test(post.contentMarkdown)) return
  console.error(`Aviso: el contenido no enlaza a ninguna página de servicio -- se añade un CTA final a ${post.serviceLinkUsed}.`)
  post.contentMarkdown = `${post.contentMarkdown.trim()}\n\n[${TEXTOS_CTA[post.serviceLinkUsed]}](${post.serviceLinkUsed}).\n`
}

// --- Borrador rechazado (para revisión manual, no cuenta como publicado) ---

function guardarBorradorRechazado(post, violations) {
  mkdirSync(REJECTED_DIR, { recursive: true })
  const hoy = new Date().toISOString().slice(0, 10)
  const slugBase = normalizarSlug(post.slug || 'sin-slug')
  const nombreBase = `${hoy}-${slugBase}`
  const nombreFinal = resolverSlugSinColision(nombreBase, REJECTED_DIR, '.json')
  const ruta = join(REJECTED_DIR, `${nombreFinal}.json`)

  writeFileSync(
    ruta,
    JSON.stringify(
      {
        rejectedAt: new Date().toISOString(),
        violations,
        serviceLinkUsed: post.serviceLinkUsed || null,
        post,
      },
      null,
      2
    ) + '\n',
    'utf8'
  )
  return ruta
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: falta la variable de entorno ANTHROPIC_API_KEY')
    process.exit(1)
  }

  const temasUsados = leerLogDeTemas()
  // Poda entradas de más de 7 días y persiste el resultado ANTES de construir el
  // prompt -- así el archivo nunca crece indefinidamente, y solo lo intentado
  // recientemente entra en la exclusión temporal.
  const temasExcluidosRecientes = podarYObtenerTemasExcluidosRecientes()
  const hechosVerificados = leerHechosVerificados()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const listaCombinada = [
    ...temasUsados.map((t) => `- ${t.topic} (ya publicado)`),
    ...temasExcluidosRecientes.map((t) => `- ${t.topic} (rechazado recientemente)`),
  ]
  const bloqueTemas = listaCombinada.length > 0
    ? `Estos temas fueron intentados recientemente y rechazados o ya publicados — elige un ángulo genuinamente distinto, no una variación superficial del mismo tema:\n${listaCombinada.join('\n')}`
    : '(ningún tema previo todavía -- este es el primer post)'

  const systemGeneracion = construirSystemPromptGeneracion(hechosVerificados)

  // --- Llamada 1: generación ---
  let post
  try {
    post = await llamarClaudeConReintento(anthropic, {
      system: systemGeneracion,
      userContent: `${bloqueTemas}\n\nGenera el próximo post del blog.`,
      maxTokens: 4096,
    }, 'generación del post')
    validarPost(post)
    asegurarEnlaceServicio(post)
  } catch (error) {
    console.error('Error en la generación del post (llamada 1):', error.message)
    process.exit(1)
  }

  // --- Llamada 2: verificación de hechos ---
  let verificacion
  try {
    verificacion = await verificarPost(anthropic, hechosVerificados, post)
  } catch (error) {
    console.error('Error en la verificación de hechos (llamada 2):', error.message)
    process.exit(1)
  }

  // --- Si no pasa: UNA reescritura corrigiendo las violaciones, y se vuelve a verificar ---
  if (!verificacion.passed) {
    console.error(`Verificación fallida en el primer borrador ("${post.title}"), se intenta una reescritura:`)
    for (const v of verificacion.violations) console.error(`  - "${v.cita}" → ${v.motivo}`)

    const listaViolaciones = verificacion.violations
      .map((v) => `- Cita: "${v.cita}"\n  Motivo: ${v.motivo}`)
      .join('\n')
    try {
      post = await llamarClaudeConReintento(anthropic, {
        system: systemGeneracion,
        userContent: `Este es tu borrador anterior:\n${JSON.stringify(post, null, 2)}\n\nEl verificador de hechos ha encontrado estas afirmaciones falsas o exageradas:\n${listaViolaciones}\n\nCorrige estas afirmaciones, no añadas funciones nuevas. Mantén el mismo tema, título y estructura salvo donde haga falta cambiarlos para corregirlas. Devuelve el post completo con el mismo formato JSON.`,
        maxTokens: 4096,
      }, 'reescritura del post')
      validarPost(post)
      asegurarEnlaceServicio(post)
      verificacion = await verificarPost(anthropic, hechosVerificados, post)
    } catch (error) {
      console.error('Error en la reescritura/reverificación del post (llamadas 3-4):', error.message)
      process.exit(1)
    }
  }

  if (!verificacion.passed) {
    const rutaRechazado = guardarBorradorRechazado(post, verificacion.violations)
    anadirTemaExcluido(post.topic)
    console.error(`✗ Post RECHAZADO por verificación de hechos (también tras la reescritura): "${post.title}"`)
    console.error('Violaciones encontradas:')
    for (const v of verificacion.violations) console.error(`  - "${v.cita}" → ${v.motivo}`)
    console.error(`Borrador guardado para revisión manual en: ${rutaRechazado}`)
    process.exit(1)
  }

  // --- Todo correcto: escribir el post y actualizar el log de temas ---
  const slugFinal = resolverSlugSinColision(normalizarSlug(post.slug))
  const hoy = new Date().toISOString().slice(0, 10)

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `slug: ${JSON.stringify(slugFinal)}`,
    `date: ${JSON.stringify(hoy)}`,
    `description: ${JSON.stringify(post.description)}`,
    `topic: ${JSON.stringify(post.topic)}`,
    '---',
    '',
  ].join('\n')

  const rutaArchivo = join(BLOG_DIR, `${slugFinal}.mdx`)
  writeFileSync(rutaArchivo, frontmatter + post.contentMarkdown.trim() + '\n', 'utf8')

  temasUsados.push({ topic: post.topic, title: post.title, date: hoy })
  writeFileSync(TOPICS_LOG_PATH, JSON.stringify(temasUsados, null, 2) + '\n', 'utf8')

  console.log(`✓ Post generado y verificado: "${post.title}" (content/blog/${slugFinal}.mdx)`)
  console.log(`  Enlace de servicio: ${post.serviceLinkUsed}`)
}

main()
