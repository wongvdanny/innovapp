// Fusiona posts casi duplicados del blog en su post destino, con Claude: integra lo mejor
// de los absorbidos (content/blog/.absorbed/) en el destino (content/blog/{destino}.mdx),
// pasa la misma verificación de hechos que el generador y deja el resultado como BORRADOR
// en content/blog/.drafts/{destino}.mdx. Al aprobarlo en /admin sustituye al destino
// (mismo slug y URL; las 301 de next.config.js ya llevan los absorbidos allí).
// Uso: node scripts/merge-blog-posts.mjs [--only <destino>] [--dry-run] [--print] [--no-email]
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  BLOG_DIR, DRAFTS_DIR, MAX_TOKENS_REDACCION, REESCRITURAS_MAXIMAS,
  leerHechosVerificados, llamarClaudeConReintento, verificarPost,
  extraerFuncionesNoImplementadas, asegurarCtaContacto, contarPalabras,
  escribirBorrador, avisarBorrador,
} from './generate-blog-post.mjs'

try {
  process.loadEnvFile()
} catch {
  // Variables ya en el entorno
}

// Mismos grupos que las redirecciones de next.config.js
const FUSIONES = {
  'responder-bien-whatsapp-no-perder-clientes': [
    'responder-whatsapp-tiempo-no-perder-clientes',
    'cliente-perdido-whatsapp-respuesta-lenta-lealtad',
    'whatsapp-respuesta-lenta-reputacion-online',
    'primera-impresion-whatsapp-clientes-recurrentes',
  ],
  'negocio-pierde-clientes-fuera-horario': ['vender-24-7-agente-ia-fuera-horario'],
  'automatizar-consultas-repetitivas-whatsapp': ['preguntas-frecuentes-ventas-automaticas'],
}

const ABSORBED_DIR = join(BLOG_DIR, '.absorbed')
const DRY_RUN = process.argv.includes('--dry-run')
const PRINT = process.argv.includes('--print')
const SIN_EMAIL = process.argv.includes('--no-email')
const SOLO = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null

function leerPost(ruta) {
  const texto = readFileSync(ruta, 'utf8')
  const [, fm, cuerpo] = texto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || []
  if (!fm) throw new Error(`${ruta}: sin frontmatter`)
  const datos = {}
  for (const linea of fm.split('\n')) {
    const m = linea.match(/^(\w+):\s*(.+)$/)
    if (m) datos[m[1]] = JSON.parse(m[2])
  }
  // El H1 lo pone la página con el título: se quita el "# ..." inicial que traen los antiguos
  return { ...datos, contentMarkdown: cuerpo.replace(/^\s*# .*\n+/, '').trim() }
}

function systemPrompt(hechos) {
  const prohibido = extraerFuncionesNoImplementadas(hechos).map((f) => `- ${f}`).join('\n')
  return `Eres el editor del blog de Innovapp (agentes de IA por WhatsApp para negocios locales y tiendas online). Vas a FUSIONAR varios artículos que tratan casi el mismo tema en un único artículo mejor, que sustituirá al artículo destino (misma URL).

CÓMO FUSIONAR:
- Toma como base el artículo destino y conserva su enfoque y su público (dueños de negocios, no técnicos), en español de España.
- Integra las mejores ideas, ejemplos y consejos de los artículos absorbidos que el destino no tenga. Sin repetir la misma idea con otras palabras.
- Longitud: entre 1300 y 1800 palabras. Secciones con ## y subsecciones con ### donde ayuden.
- Incluye una sección "## Ejemplo práctico" (un caso paso a paso de un negocio ficticio, sin cifras) y una sección "## Preguntas frecuentes" con tres a cinco preguntas en ###.
- Enlaces internos: entre 2 y 3, contextuales, en formato [texto descriptivo](ruta), a /agentes-ia y, si encaja, a /agentes-ia-prestashop o /agentes-ia-woocommerce. Termina con un párrafo breve con enlace a /contacto.
- No pongas un # (H1).
- Puedes mejorar el título y la meta description (150-160 caracteres), sin cambiar el tema.

=== ÚNICA FUENTE DE HECHOS PERMITIDA SOBRE INNOVAPP ===
${hechos}
=== FIN DE LA FUENTE DE HECHOS ===

=== PROHIBIDO (funciones que NO existen; no las menciones ni como consejo) ===
${prohibido}

=== REGLAS DE REDACCIÓN (un verificador rechaza el texto si se incumple UNA) ===
1. NINGUNA CIFRA: ni números, porcentajes, estadísticas, importes, tiempos ("2 horas", "24 horas", "48 horas") ni cantidades, aunque aparezcan en los artículos originales: los originales tienen cifras inventadas que hay que quitar. Solo valen las cifras que estén literalmente en la fuente de hechos.
2. Nada de datos de estudios ni de "la mayoría de clientes".
3. Sobre el agente, solo lo documentado en la fuente de hechos y con el mismo alcance.
4. Ejemplos y diálogos sin precios, plazos ni datos concretos.
=== FIN DE REGLAS ===

Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después y sin backticks:
{ "title": string, "description": string, "contentMarkdown": string }`
}

async function fusionar(anthropic, hechos, destino, absorbidos) {
  const base = leerPost(join(BLOG_DIR, `${destino}.mdx`))
  const otros = absorbidos.map((s) => leerPost(join(ABSORBED_DIR, `${s}.mdx`)))
  const entrada = [
    `ARTÍCULO DESTINO (/blog/${destino}):\n# ${base.title}\n\n${base.contentMarkdown}`,
    ...otros.map((p, i) => `ARTÍCULO ABSORBIDO ${i + 1} (/blog/${absorbidos[i]}):\n# ${p.title}\n\n${p.contentMarkdown}`),
  ].join('\n\n======\n\n')
  const system = systemPrompt(hechos)

  const validar = (p) => {
    for (const c of ['title', 'description', 'contentMarkdown']) {
      if (typeof p[c] !== 'string' || !p[c].trim()) throw new Error(`Falta el campo "${c}"`)
    }
  }

  let post = await llamarClaudeConReintento(anthropic, { system, userContent: `${entrada}\n\nFusiona estos artículos.`, maxTokens: MAX_TOKENS_REDACCION }, `fusión ${destino}`)
  validar(post)
  asegurarCtaContacto(post)
  let v = await verificarPost(anthropic, hechos, post)

  for (let ronda = 1; !v.passed && ronda <= REESCRITURAS_MAXIMAS; ronda++) {
    console.error(`[${destino}] verificación fallida, reescritura ${ronda}/${REESCRITURAS_MAXIMAS}:`)
    for (const x of v.violations) console.error(`  - "${x.cita}" → ${x.motivo}`)
    const lista = v.violations.map((x) => `- Cita: "${x.cita}"\n  Motivo: ${x.motivo}`).join('\n')
    post = await llamarClaudeConReintento(anthropic, {
      system,
      userContent: `Este es tu texto fusionado:\n${JSON.stringify(post, null, 2)}\n\nEl verificador ha encontrado estas afirmaciones falsas o con cifras no permitidas:\n${lista}\n\nCorrígelas y repasa todo el texto con las REGLAS DE REDACCIÓN. Devuelve el JSON completo.`,
      maxTokens: MAX_TOKENS_REDACCION,
    }, `reescritura ${destino}`)
    validar(post)
    asegurarCtaContacto(post)
    v = await verificarPost(anthropic, hechos, post)
  }
  return { base, post, v }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: falta ANTHROPIC_API_KEY')
    process.exit(1)
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const hechos = leerHechosVerificados()
  let fallos = 0

  for (const [destino, absorbidos] of Object.entries(FUSIONES)) {
    if (SOLO && SOLO !== destino) continue
    if (!existsSync(join(BLOG_DIR, `${destino}.mdx`))) {
      console.error(`✗ [${destino}] no existe el post destino`)
      fallos++
      continue
    }
    try {
      const { base, post, v } = await fusionar(anthropic, hechos, destino, absorbidos)
      const resumen = `${contarPalabras(post.contentMarkdown)} palabras`
      if (!v.passed) {
        console.error(`✗ [${destino}] RECHAZADO por verificación de hechos tras ${REESCRITURAS_MAXIMAS} reescrituras:`)
        for (const x of v.violations) console.error(`  - "${x.cita}" → ${x.motivo}`)
        fallos++
        continue
      }
      if (DRY_RUN) {
        console.log(`✓ (dry-run) [${destino}] "${post.title}" (${resumen})`)
      } else {
        // Conserva fecha original y topic del destino; 'fusion' marca que sustituye a un post publicado
        escribirBorrador(
          { title: post.title, slug: destino, date: base.date, description: post.description, topic: base.topic, contentMarkdown: post.contentMarkdown },
          { updated: new Date().toISOString().slice(0, 10), fusion: absorbidos },
        )
        console.log(`✓ [${destino}] borrador en ${join(DRAFTS_DIR, `${destino}.mdx`)} (${resumen})`)
        if (!SIN_EMAIL) await avisarBorrador({ title: post.title, slug: destino, resumen, motivo: 'Post fusionado' })
      }
      if (PRINT) console.log(`\n# ${post.title}\n\n${post.contentMarkdown}\n`)
    } catch (error) {
      console.error(`✗ [${destino}] error: ${error.message}`)
      fallos++
    }
  }
  process.exit(fallos ? 1 : 0)
}

main()
