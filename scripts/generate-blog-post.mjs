// Genera un post de blog nuevo con Claude, centrado en IA para PrestaShop/WooCommerce y en
// desarrollo, migración y mantenimiento de tiendas: (1) generación del borrador ceñido a
// content/verified-facts.md, (2) comprobación en código de la estructura (mínimo de
// palabras, H2/H3, ejemplo práctico, preguntas frecuentes, 2-3 enlaces internos, tema no
// duplicado de un post publicado) y (3) verificación estricta de hechos. Si algo falla se
// reescribe con los problemas encontrados (hasta REESCRITURAS_MAXIMAS veces); si sigue
// fallando, el borrador va a content/blog/.rejected/. Si el texto no termina con enlace a
// /contacto, se añade un CTA final (no se rechaza por eso). Solo si pasa se escribe
// content/blog/{slug}.mdx y se actualiza .topics-log.json.
// Uso: node scripts/generate-blog-post.mjs  (o  npm run blog:generate)
//      node scripts/generate-blog-post.mjs --dry-run [--print]   (sin escribir nada; --print muestra el texto)
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
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
// BLOG_MODEL permite probar otro modelo de redacción sin tocar el código.
const MODEL = process.env.BLOG_MODEL || 'claude-haiku-4-5-20251001'
// La verificación usa un modelo más capaz: Haiku dejaba pasar cifras inventadas y
// afirmaciones sobre funciones no documentadas.
const MODEL_VERIFICACION = 'claude-sonnet-5'
const DIAS_EXCLUSION_TEMPORAL = 7
// Reescrituras como máximo cuando el borrador no cumple la estructura o el verificador lo rechaza.
const REESCRITURAS_MAXIMAS = 3
// --dry-run: genera y verifica, pero no escribe nada (ni post, ni borrador rechazado, ni
// logs de temas). Para probar cambios en los prompts sin publicar.
const DRY_RUN = process.argv.includes('--dry-run')

// Páginas de servicio a las que enlaza el blog, en formato markdown [texto](ruta). El
// regex exige la ruta EXACTA (con slash final opcional; también la URL absoluta del
// dominio), así que un enlace a /agentes-ia-prestashop no cuenta como /agentes-ia.
const RUTAS_SERVICIO = ['/agentes-ia-prestashop', '/agentes-ia-woocommerce', '/desarrollo-prestashop-woocommerce']
const PATRON_ENLACE_SERVICIO_GLOBAL =
  /\]\((?:https:\/\/innovapp\.es)?\/(?:agentes-ia-prestashop|agentes-ia-woocommerce|desarrollo-prestashop-woocommerce)\/?(?:#[^)]*)?\)/g
const PATRON_ENLACE_CONTACTO = /\]\((?:https:\/\/innovapp\.es)?\/contacto\/?\)/

// Requisitos de calidad (se comprueban en código; si falta algo, el redactor reescribe).
const PALABRAS_MINIMAS = 1200
const ENLACES_SERVICIO_MINIMOS = 2
// Solapamiento de palabras del slug a partir del cual un tema se considera casi duplicado.
const SIMILITUD_SLUG_MAXIMA = 0.5

function leerHechosVerificados() {
  if (!existsSync(VERIFIED_FACTS_PATH)) {
    console.error('Error: falta content/verified-facts.md (fuente única de verdad sobre qué hace el producto). No se genera el post sin ella, para evitar que el modelo invente funciones que no existen.')
    process.exit(1)
  }
  return readFileSync(VERIFIED_FACTS_PATH, 'utf8')
}

/** Título y slug de cada post publicado (frontmatter de content/blog/*.mdx), para no repetir temas. */
function leerPostsPublicados() {
  if (!existsSync(BLOG_DIR)) return []
  return readdirSync(BLOG_DIR)
    .filter((nombre) => nombre.endsWith('.mdx') && !nombre.startsWith('.'))
    .map((nombre) => {
      const texto = readFileSync(join(BLOG_DIR, nombre), 'utf8')
      const titulo = texto.match(/^title:\s*(.+)$/m)?.[1]?.replace(/^"|"$/g, '') ?? ''
      return { slug: nombre.replace(/\.mdx$/, ''), title: titulo }
    })
}

// Palabras vacías que no distinguen un tema de otro al comparar slugs.
const PALABRAS_VACIAS_SLUG = new Set(['de', 'la', 'el', 'en', 'tu', 'y', 'a', 'para', 'por', 'con', 'sin', 'que', 'como', 'los', 'las', 'del', 'un', 'una', 'no', 'mas'])

function palabrasDeSlug(slug) {
  return new Set(normalizarSlug(slug).split('-').filter((p) => p.length > 2 && !PALABRAS_VACIAS_SLUG.has(p)))
}

/** Post publicado cuyo slug comparte demasiadas palabras con el nuevo, o null. */
function postCasiDuplicado(slug, publicados) {
  const nuevas = palabrasDeSlug(slug)
  for (const p of publicados) {
    const existentes = palabrasDeSlug(p.slug)
    const comunes = [...nuevas].filter((x) => existentes.has(x)).length
    const union = new Set([...nuevas, ...existentes]).size
    if (union > 0 && comunes / union >= SIMILITUD_SLUG_MAXIMA) return p
  }
  return null
}

function contarPalabras(markdown) {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // el texto del enlace cuenta, la URL no
    .replace(/[#*_>`|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

/**
 * Comprobaciones de estructura y SEO que no dependen de un modelo. Devuelve la lista de
 * problemas (vacía si todo está bien) para pasárselos al redactor en la reescritura.
 */
function problemasDeCalidad(post, publicados) {
  const problemas = []
  const md = post.contentMarkdown
  const palabras = contarPalabras(md)
  if (palabras < PALABRAS_MINIMAS) {
    problemas.push(`El cuerpo tiene unas ${palabras} palabras; el mínimo es ${PALABRAS_MINIMAS}. Amplía con contenido útil (más detalle en el ejemplo práctico y en las secciones), no con relleno.`)
  }
  if (!/^## /m.test(md)) problemas.push('Faltan subtítulos ## (H2).')
  if (!/^### /m.test(md)) problemas.push('Faltan subtítulos ### (H3) dentro de alguna sección.')
  if (!/^## .*preguntas frecuentes/im.test(md)) {
    problemas.push('Falta la sección "## Preguntas frecuentes" con varias preguntas como ### y su respuesta.')
  }
  if (!/^##+ .*ejemplo/im.test(md)) problemas.push('Falta una sección de ejemplo práctico con un subtítulo que contenga "Ejemplo".')
  const enlaces = (md.match(PATRON_ENLACE_SERVICIO_GLOBAL) || []).length
  if (enlaces < ENLACES_SERVICIO_MINIMOS) {
    problemas.push(`Hay ${enlaces} enlace(s) internos a páginas de servicio; deben ser entre ${ENLACES_SERVICIO_MINIMOS} y 3, contextuales y repartidos por el texto (${RUTAS_SERVICIO.join(', ')}).`)
  }
  const duplicado = postCasiDuplicado(post.slug, publicados)
  if (duplicado) {
    problemas.push(`El tema es casi igual al post ya publicado "${duplicado.title}" (/blog/${duplicado.slug}). Elige un tema distinto.`)
  }
  return problemas
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

// Holgado: los modelos que razonan gastan parte de max_tokens en el razonamiento.
const MAX_TOKENS_REDACCION = 16000
const REINTENTOS_MAXIMOS = 3
const DELAY_ENTRE_REINTENTOS_MS = 2500

async function llamarClaudeUnaVez(anthropic, { model = MODEL, system, userContent, maxTokens }) {
  const respuesta = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }],
  })
  if (respuesta.stop_reason === 'max_tokens') {
    throw new Error(`Respuesta cortada por max_tokens (${maxTokens}) antes de terminar el JSON`)
  }
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

  return `Eres el redactor del blog de Innovapp, una empresa española que desarrolla y mantiene tiendas online con PrestaShop y WooCommerce y les añade inteligencia artificial (agentes de IA por WhatsApp conectados al catálogo real).

El público del blog son dueños y responsables de tiendas online con PrestaShop o WooCommerce: saben manejar su tienda pero NO son desarrolladores. Escribe en español de España, con tono profesional y cercano, explicando lo técnico en lenguaje llano y siempre desde el impacto en el negocio (ventas, seguridad, tiempo, atención al cliente).

TEMAS PERMITIDOS (elige UNO, concreto y útil):
- IA para PrestaShop o WooCommerce: atención al cliente con IA, recomendación de productos, búsqueda en lenguaje natural, consultas de estado de pedido por WhatsApp.
- Migración y actualización de PrestaShop (desde 1.6 o 1.7 a 8 o 9): riesgos de quedarse en una versión antigua, cómo planificarla, qué revisar antes y después, módulos y temas incompatibles.
- Mantenimiento de WooCommerce: actualizaciones de WooCommerce, WordPress, plugins y PHP; errores habituales; copias de seguridad; rendimiento.
- Desarrollo de tiendas online: módulos y plugins a medida, cuándo compensa desarrollar a medida frente a un módulo comercial, rendimiento y velocidad de la tienda.
NO escribas sobre negocios locales, citas, peluquerías ni temas de WhatsApp genéricos: ese ángulo ya está cubierto.

NO repitas un tema ya publicado: se te pasa la lista de títulos y slugs existentes. Un tema con el mismo ángulo y otras palabras también cuenta como repetido.

ESTRUCTURA OBLIGATORIA (se comprueba automáticamente):
- Cuerpo de 1300 a 1700 palabras (mínimo absoluto ${PALABRAS_MINIMAS}).
- Secciones con ## y, dentro de ellas, subsecciones con ### donde ayuden a leer.
- Una sección "## Ejemplo práctico" (o un ## que empiece por "Ejemplo") con un caso paso a paso de una tienda ficticia, sin cifras inventadas.
- Una sección "## Preguntas frecuentes" con entre tres y cinco preguntas en ### y su respuesta debajo.
- No pongas un # (H1): el título ya va aparte.

=== ÚNICA FUENTE DE HECHOS PERMITIDA SOBRE INNOVAPP ===
No afirmes nada sobre lo que hace el producto que no esté en este documento. Si necesitas mencionar una función, usa exactamente cómo está descrita aquí, sin añadir detalles no confirmados. Todo lo marcado como "NO" o "no implementado" (p.ej. recordatorios automáticos de citas, integración con Google Calendar, recuperación automática de carritos abandonados, Instagram Messaging) NUNCA debe mencionarse como función existente, aunque parezca una idea natural para el artículo.

${hechosVerificados}
=== FIN DE LA FUENTE DE HECHOS ===${bloqueProhibido}

=== REGLAS DE REDACCIÓN (un verificador automático rechaza el post si se incumple UNA sola) ===
1. NINGUNA CIFRA. No escribas números, porcentajes, estadísticas, importes en euros, tiempos ("5 minutos", "en menos de un segundo", "24 horas"), cantidades ("20 consultas", "dos o tres clientes") ni rangos, ni siquiera como ejemplo, estimación o caso hipotético. Exprésalo con palabras sin cantidad: "mucho tiempo", "al momento", "varias consultas", "una parte de tus ingresos". Excepciones: las cifras que aparezcan literalmente en la fuente de hechos, y los números de VERSIÓN de software (PrestaShop 1.6, 1.7, 8 y 9; WooCommerce, WordPress y PHP con su número de versión), siempre que no afirmes fechas de fin de soporte ni datos que no puedas asegurar.
2. NADA DE DATOS DE ESTUDIOS NI DE "LA MAYORÍA": no afirmes cuántos clientes hacen algo, ni tasas de abandono, de respuesta o de no presentados.
3. SOBRE EL AGENTE, SOLO LO DOCUMENTADO: cada cosa que digas que el agente hace, sabe, consulta, envía, confirma o avisa tiene que estar en la fuente de hechos, con el mismo alcance. No añadas detalles plausibles (plazos de envío, políticas de cambio, diagnósticos, especificaciones, "qué llevar a la cita", avisos al equipo...) que la fuente no mencione.
4. SIN DIÁLOGOS NI CASOS INVENTADOS CON DATOS: si pones un ejemplo de conversación o de negocio, que no contenga precios, plazos ni ningún dato concreto.
5. Los consejos generales al lector (cómo organizarse, qué cuidar al atender) sí están permitidos, siempre sin cifras y sin sugerir funciones de la lista PROHIBIDO.
Antes de responder, repasa el texto frase a frase y elimina cualquier dígito o cantidad que se te haya escapado.
=== FIN DE REGLAS ===

ENLACES INTERNOS OBLIGATORIOS: entre 2 y 3 enlaces en formato markdown [texto descriptivo](ruta), dentro del cuerpo y en la frase donde de verdad aporten (nunca "haz clic aquí" ni todos juntos al final), a estas páginas según el tema:
- /agentes-ia-prestashop → IA y agente de WhatsApp para tiendas PrestaShop
- /agentes-ia-woocommerce → IA y agente de WhatsApp para tiendas WooCommerce
- /desarrollo-prestashop-woocommerce → desarrollo, módulos/plugins a medida, migración, actualización y mantenimiento
Un post de migración enlaza sobre todo a /desarrollo-prestashop-woocommerce, y puede enlazar a la página de IA de su plataforma; uno de IA enlaza a su plataforma y puede enlazar a desarrollo. Usa el texto del enlace para describir el destino ("migración de PrestaShop a la versión 9", "agente de IA para WooCommerce").
CTA FINAL OBLIGATORIO: termina con un párrafo breve que invite a escribirnos, con un enlace a /contacto (p. ej. "[cuéntanos cómo es tu tienda](/contacto)").
No inventes ninguna otra ruta: usa los paths EXACTOS de arriba.

Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, sin backticks de markdown ni bloques de código, con exactamente esta forma:
{
  "topic": string,
  "title": string,
  "slug": string (kebab-case, sin tildes ni caracteres especiales),
  "description": string (meta description, 150-160 caracteres),
  "contentMarkdown": string (el cuerpo del post en markdown, con los enlaces internos y el CTA a /contacto),
  "serviceLinkUsed": "/agentes-ia-prestashop" | "/agentes-ia-woocommerce" | "/desarrollo-prestashop-woocommerce" (la página de servicio principal del post)
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

Revisa el post ENTERO y devuelve TODAS las violaciones en esta única respuesta: el redactor solo tiene una oportunidad de corregirlas, así que no te detengas en las primeras ni dejes ninguna para después.

NO incluyas afirmaciones correctas ni comentarios sobre lo que el post hace bien. Si no hay violaciones reales, passed=true y violations=[]. Sugerir al lector una función que el producto no tiene (aunque sea como consejo manual, p.ej. 'envía un recordatorio') cuenta como violación. Cualquier cifra, porcentaje o estadística que no aparezca en el documento es una violación, aunque se presente como estimación; los números de versión de software (PrestaShop 1.6/1.7/8/9, WooCommerce, WordPress, PHP) NO son violación, salvo que se usen para afirmar fechas de fin de soporte u otros datos no comprobables. Inventar clientes, casos de éxito, resultados medidos, precios o plazos de los servicios de desarrollo también es violación. También lo es cualquier afirmación sobre datos, historial o registros que el producto guarde u ofrezca, y cualquier afirmación sobre el número de WhatsApp que contradiga el documento.

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
    model: MODEL_VERIFICACION,
    system: SYSTEM_PROMPT_VERIFICACION,
    userContent: `DOCUMENTO DE HECHOS VERIFICADOS:\n${hechosVerificados}\n\nBORRADOR DEL POST A VERIFICAR:\n${post.contentMarkdown}`,
    // Sonnet 5 razona (thinking adaptativo) por defecto y ese razonamiento cuenta dentro
    // de max_tokens: con 2048 se quedaba sin sitio para el JSON.
    maxTokens: 16000,
  }, 'verificación de hechos')
  validarVerificacion(verificacion)
  return filtrarViolacionesReales(verificacion.violations, post.contentMarkdown)
}

// --- CTA final a /contacto: si el modelo no lo puso, se añade (no se rechaza por eso) ---

const TEXTO_CTA_CONTACTO =
  '¿Tienes una tienda PrestaShop o WooCommerce y quieres saber qué podemos hacer por ella? [Cuéntanos tu caso y te preparamos una propuesta](/contacto).'

function asegurarCtaContacto(post) {
  if (PATRON_ENLACE_CONTACTO.test(post.contentMarkdown)) return
  console.error('Aviso: el contenido no enlaza a /contacto -- se añade el CTA final.')
  post.contentMarkdown = `${post.contentMarkdown.trim()}\n\n${TEXTO_CTA_CONTACTO}\n`
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

  // Los .mdx publicados son la referencia (el log de temas no incluye los posts manuales)
  const publicados = leerPostsPublicados()
  const listaCombinada = [
    ...publicados.map((p) => `- ${p.title} (ya publicado, /blog/${p.slug})`),
    ...temasUsados.map((t) => `- ${t.topic} (tema ya publicado)`),
    ...temasExcluidosRecientes.map((t) => `- ${t.topic} (rechazado recientemente)`),
  ]
  const bloqueTemas = listaCombinada.length > 0
    ? `Estos temas ya están publicados o se rechazaron hace poco — elige un tema genuinamente distinto, no una variación superficial:\n${listaCombinada.join('\n')}`
    : '(ningún tema previo todavía -- este es el primer post)'

  const systemGeneracion = construirSystemPromptGeneracion(hechosVerificados)

  // --- Llamada 1: generación ---
  let post
  try {
    post = await llamarClaudeConReintento(anthropic, {
      system: systemGeneracion,
      userContent: `${bloqueTemas}\n\nGenera el próximo post del blog.`,
      maxTokens: MAX_TOKENS_REDACCION,
    }, 'generación del post')
    validarPost(post)
    asegurarCtaContacto(post)
  } catch (error) {
    console.error('Error en la generación del post (llamada 1):', error.message)
    process.exit(1)
  }

  // --- Llamada 2: estructura (en código) y verificación de hechos ---
  let problemas = problemasDeCalidad(post, publicados)
  let verificacion
  try {
    verificacion = await verificarPost(anthropic, hechosVerificados, post)
  } catch (error) {
    console.error('Error en la verificación de hechos (llamada 2):', error.message)
    process.exit(1)
  }

  // --- Si no pasa: hasta REESCRITURAS_MAXIMAS reescrituras corrigiendo todo lo encontrado ---
  for (let ronda = 1; (problemas.length > 0 || !verificacion.passed) && ronda <= REESCRITURAS_MAXIMAS; ronda++) {
    console.error(`Borrador por corregir ("${post.title}"), reescritura ${ronda}/${REESCRITURAS_MAXIMAS}:`)
    for (const p of problemas) console.error(`  - [estructura] ${p}`)
    for (const v of verificacion.violations) console.error(`  - "${v.cita}" → ${v.motivo}`)

    const bloques = []
    if (problemas.length > 0) {
      bloques.push(`No cumple la ESTRUCTURA OBLIGATORIA:\n${problemas.map((p) => `- ${p}`).join('\n')}`)
    }
    if (!verificacion.passed) {
      const listaViolaciones = verificacion.violations
        .map((v) => `- Cita: "${v.cita}"\n  Motivo: ${v.motivo}`)
        .join('\n')
      bloques.push(`El verificador de hechos ha encontrado estas afirmaciones falsas o exageradas:\n${listaViolaciones}\n\nCorrige estas afirmaciones, no añadas funciones nuevas.`)
    }
    try {
      post = await llamarClaudeConReintento(anthropic, {
        system: systemGeneracion,
        userContent: `Este es tu borrador anterior:\n${JSON.stringify(post, null, 2)}\n\n${bloques.join('\n\n')}\n\nAdemás, repasa TODO el texto con las REGLAS DE REDACCIÓN y elimina cualquier otra cifra, cantidad, tiempo o detalle sobre el producto que no esté en la fuente de hechos, aunque nadie lo haya citado: si queda uno solo, el post se rechaza. Mantén el mismo tema y título salvo que se te pida cambiar de tema. Devuelve el post completo con el mismo formato JSON.`,
        maxTokens: MAX_TOKENS_REDACCION,
      }, 'reescritura del post')
      validarPost(post)
      asegurarCtaContacto(post)
      problemas = problemasDeCalidad(post, publicados)
      verificacion = await verificarPost(anthropic, hechosVerificados, post)
    } catch (error) {
      console.error('Error en la reescritura/reverificación del post:', error.message)
      process.exit(1)
    }
  }

  if (problemas.length > 0 || !verificacion.passed) {
    const motivos = [
      ...problemas.map((p) => ({ cita: '(estructura)', motivo: p })),
      ...verificacion.violations,
    ]
    const rutaRechazado = DRY_RUN ? '(dry-run: no se guarda)' : guardarBorradorRechazado(post, motivos)
    if (!DRY_RUN) anadirTemaExcluido(post.topic)
    console.error(`✗ Post RECHAZADO (también tras ${REESCRITURAS_MAXIMAS} reescrituras): "${post.title}"`)
    console.error('Violaciones encontradas:')
    for (const v of motivos) console.error(`  - "${v.cita}" → ${v.motivo}`)
    console.error(`Borrador guardado para revisión manual en: ${rutaRechazado}`)
    process.exit(1)
  }

  const resumen = `${contarPalabras(post.contentMarkdown)} palabras, ${(post.contentMarkdown.match(PATRON_ENLACE_SERVICIO_GLOBAL) || []).length} enlaces de servicio`
  if (DRY_RUN) {
    console.log(`✓ (dry-run) El post pasaría las comprobaciones: "${post.title}" (${resumen}). No se ha escrito nada.`)
    if (process.argv.includes('--print')) console.log(`\n${post.contentMarkdown}`)
    return
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
  console.log(`  Página de servicio principal: ${post.serviceLinkUsed} (${resumen})`)
}

main()
