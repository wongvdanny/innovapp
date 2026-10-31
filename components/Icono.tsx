import {
  Armchair, BellRing, Brain, CalendarCheck, CalendarCheck2, CalendarDays, ChartColumn, ChefHat, CircleArrowUp,
  CreditCard, Dumbbell, FolderKanban, Gauge, Hand, KeyRound, Link2, MessageCircle, Monitor, Moon, Package,
  Plug, Puzzle, QrCode, Receipt, RefreshCw, Scissors, ShoppingBag, ShoppingCart, Sparkles, Store, Target,
  TrendingUp, Users, Utensils, UtensilsCrossed, Wrench, Zap, type LucideIcon,
} from 'lucide-react'

// Iconos que las páginas nombran por texto (listas de tuplas [icono, título, texto]).
// Explícito a propósito: solo entran en el bundle los iconos que se usan.
const ICONOS = {
  Armchair, BellRing, Brain, CalendarCheck, CalendarCheck2, CalendarDays, ChartColumn, ChefHat, CircleArrowUp,
  CreditCard, Dumbbell, FolderKanban, Gauge, Hand, KeyRound, Link2, MessageCircle, Monitor, Moon, Package,
  Plug, Puzzle, QrCode, Receipt, RefreshCw, Scissors, ShoppingBag, ShoppingCart, Sparkles, Store, Target,
  TrendingUp, Users, Utensils, UtensilsCrossed, Wrench, Zap,
} satisfies Record<string, LucideIcon>

export type NombreIcono = keyof typeof ICONOS

/** Icono de lucide-react con los valores de la web: 24 px, trazo 1,75 y decorativo (aria-hidden). */
export default function Icono({ icono, size = 24, color = 'currentColor', style }: {
  icono: LucideIcon | NombreIcono | string
  size?: number
  color?: string
  style?: React.CSSProperties
}) {
  const I = typeof icono === 'string' ? ICONOS[icono as NombreIcono] : icono
  if (!I) return null
  return <I size={size} strokeWidth={1.75} color={color} aria-hidden="true" focusable="false" style={{ flexShrink: 0, ...style }} />
}
