// Datos de presentación de cada producto por slug (sin prisma: se usa en el render).
// Un producto nuevo de la tabla Product aparece en el panel sin tocar nada; aquí solo
// se le da color, enlace o emoji si se quiere.

export interface ProductoMenu { id: string; slug: string; name: string; active: boolean }

interface Presentacion { color: string; emoji: string; url?: string }

const PRESENTACION: Record<string, Presentacion> = {
  servix:   { color: 'var(--adm-p-servix)',   emoji: '🍽️', url: 'https://servix.innovapp.es' },
  gymstack: { color: 'var(--adm-p-gymstack)', emoji: '💪', url: 'https://gymstack.innovapp.es' },
  news:     { color: 'var(--adm-p-news)',     emoji: '🎙️', url: 'https://news.innovapp.es' },
  agentes:  { color: 'var(--adm-p-agentes)',  emoji: '🤖', url: 'https://agentes.innovapp.es' },
  iglesias: { color: 'var(--adm-p-iglesias)', emoji: '⛪' },
}

export function presentacion(slug: string | null | undefined): Presentacion {
  return (slug && PRESENTACION[slug]) || { color: 'var(--adm-muted)', emoji: '📦' }
}

export const ESTADOS_SUSCRIPCION: Record<string, { label: string; tono: 'ok' | 'warn' | 'err' | 'neutro' }> = {
  active:    { label: 'Activa',    tono: 'ok' },
  pending:   { label: 'Pendiente', tono: 'warn' },
  cancelled: { label: 'Cancelada', tono: 'err' },
  expired:   { label: 'Expirada',  tono: 'err' },
}

export const INTERVALO_TEXTO: Record<string, string> = { monthly: 'mes', month: 'mes', yearly: 'año', free: 'gratis' }
