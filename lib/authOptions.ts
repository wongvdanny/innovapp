import { NextAuthOptions, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Duración de la sesión según «Recordarme» (caducidad propia dentro del JWT, como en Servix).
const RECORDAR = 30 * 24 * 60 * 60
const SIN_RECORDAR = 12 * 60 * 60

export const normalizarEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: {}, password: {}, remember: {} },
      async authorize(credentials) {
        const email = normalizarEmail(credentials?.email)
        if (!email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role, remember: credentials.remember !== 'false' } as any
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: RECORDAR },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      const ahora = Math.floor(Date.now() / 1000)
      if (user) {
        token.role = (user as any).role
        token.remember = (user as any).remember !== false
        token.loginAt = ahora
        token.sessionExp = ahora + (token.remember ? RECORDAR : SIN_RECORDAR)
      }
      if (token.invalid) return { invalid: true }
      // Tokens emitidos antes de este cambio: 12 h desde ahora y cuentan como iniciados ahora
      if (typeof token.sessionExp !== 'number') token.sessionExp = ahora + SIN_RECORDAR
      if (typeof token.loginAt !== 'number') token.loginAt = ahora
      if (ahora > (token.sessionExp as number)) return { invalid: true }
      // Cambiar o restablecer la contraseña cierra las sesiones iniciadas antes
      if (token.sub) {
        const u = await prisma.user.findUnique({ where: { id: token.sub }, select: { passwordChangedAt: true } })
        if (!u || (u.passwordChangedAt && Math.floor(u.passwordChangedAt.getTime() / 1000) > (token.loginAt as number))) return { invalid: true }
      }
      return token
    },
    async session({ session, token }) {
      // Un objeto vacío hace que getServerSession/getSession devuelvan null
      if (token.invalid || !token.email) return {} as Session
      session.expires = new Date((token.sessionExp as number) * 1000).toISOString()
      if (session.user) {
        (session.user as any).role = token.role as string
        ;(session.user as any).remember = token.remember !== false
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
