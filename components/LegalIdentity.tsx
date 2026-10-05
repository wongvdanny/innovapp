import { CONTACT_EMAIL, LEGAL_OWNER, LEGAL_TRADE_NAME, LEGAL_NIF, LEGAL_ADDRESS_ES, LEGAL_PHONE } from '../lib/constants'

/**
 * Identificación del titular (LSSI-CE art. 10), visible en el pie de las páginas públicas.
 * Texto plano renderizado en servidor: el nombre legal debe aparecer literal en el HTML.
 * Los datos salen de lib/constants.ts; no repetirlos aquí.
 */
export default function LegalIdentity({ tono, fondo }: { tono: 'oscuro' | 'claro'; fondo?: string }) {
  const color = tono === 'oscuro' ? 'rgba(255,255,255,.35)' : '#88a8b0'
  const enlace: React.CSSProperties = { color: 'inherit', textDecoration: 'none' }
  return (
    <div style={{
      fontFamily: 'var(--font-gabarito), system-ui, sans-serif', fontSize: 12, lineHeight: 1.7, color,
      background: fondo, textAlign: tono === 'claro' ? 'center' : undefined,
      padding: tono === 'claro' ? '0 24px 20px' : '0 0 24px',
    }}>
      <p style={{ margin: 0 }}>{`${LEGAL_TRADE_NAME} es un nombre comercial de ${LEGAL_OWNER} · NIF ${LEGAL_NIF}`}</p>
      <p style={{ margin: 0 }}>
        {`${LEGAL_ADDRESS_ES} · Tel. `}
        <a href={`tel:${LEGAL_PHONE.replace(/\s/g, '')}`} style={enlace}>{LEGAL_PHONE}</a>
        {' · '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={enlace}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  )
}
