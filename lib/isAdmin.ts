import type { Session } from 'next-auth'

/**
 * Única fuente de verdad para saber si una sesión es de administrador.
 * Usar esto en vez de comparar emails hardcodeados.
 */
export function isAdmin(session: Session | null): boolean {
  return (session?.user as any)?.role === 'admin'
}
