import { useState } from 'react'
import { Badge, Button, Modal, Notice, fecha } from '../ui'

interface Admin { id: string; name: string | null; email: string; active: boolean; suspended: boolean; createdAt: string }

/** Botón «Usuarios» de cada gimnasio: lista sus ADMIN con reset de contraseña y activar/desactivar. */
export default function GymUsuarios({ gymId, gymName }: { gymId: string; gymName: string }) {
  const [abierto, setAbierto] = useState(false)
  const [admins, setAdmins] = useState<Admin[] | null>(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState<{ texto: string; password?: string } | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState<{ id: string; accion: 'reset' | 'activate' | 'deactivate' } | null>(null)

  const cargar = async () => {
    const r = await fetch(`/api/admin/gym-users?gymId=${encodeURIComponent(gymId)}`)
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || `Error ${r.status}`)
    setAdmins(d.admins)
  }

  const abrir = () => {
    setAbierto(true); setAdmins(null); setError(''); setAviso(null); setConfirmar(null)
    cargar().catch(e => setError(e.message))
  }

  const ejecutar = async (a: Admin, accion: 'reset' | 'activate' | 'deactivate') => {
    setOcupado(a.id); setError(''); setAviso(null)
    try {
      const r = await fetch('/api/admin/gym-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId, userId: a.id, action: accion }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`)
      if (accion === 'reset') {
        setAviso(d.emailed
          ? { texto: `Contraseña nueva enviada a ${d.email}.` }
          : { texto: `Contraseña cambiada, pero el email a ${d.email} ha fallado. Pásasela en mano (no se volverá a mostrar):`, password: d.password })
      } else {
        setAviso({ texto: accion === 'activate' ? `Acceso de ${a.email} activado.` : `Acceso de ${a.email} desactivado.` })
      }
      await cargar()
    } catch (e: any) {
      setError(e.message)
    }
    setOcupado(null); setConfirmar(null)
  }

  const activos = admins?.filter(a => a.active).length ?? 0
  const textoConfirmar = { reset: '¿Generar y enviar una contraseña nueva?', activate: '¿Activar su acceso?', deactivate: '¿Desactivar su acceso?' }

  return (
    <>
      <Button small onClick={abrir}>Usuarios</Button>
      {abierto && (
        <Modal title={`Administradores · ${gymName}`} onClose={() => setAbierto(false)} width={640}>
          {error && <Notice tone="error" style={{ marginBottom: 12 }}>{error}</Notice>}
          {aviso && (
            <Notice tone="ok" style={{ marginBottom: 12 }}>
              {aviso.texto}
              {aviso.password && <code style={{ marginLeft: 8, fontWeight: 700 }}>{aviso.password}</code>}
            </Notice>
          )}
          {!admins && !error && <p className="adm-muted">Cargando…</p>}
          {admins && admins.length === 0 && <p className="adm-muted">Este gimnasio no tiene administradores.</p>}
          {admins && admins.map(a => {
            const ultimo = a.active && activos <= 1
            const enConfirmacion = confirmar?.id === a.id
            return (
              <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderTop: '1px solid var(--adm-border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="adm-fuerte">{a.name || '—'}</div>
                  <div className="adm-muted adm-peq">{a.email} · alta {fecha(a.createdAt)}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <Badge tone={a.active ? 'ok' : 'err'}>{a.active ? 'Activo' : 'Desactivado'}</Badge>
                  {a.suspended && <Badge tone="warn">Contraseña suspendida</Badge>}
                  {enConfirmacion ? (
                    <>
                      <span className="adm-peq">{textoConfirmar[confirmar.accion]}</span>
                      <Button small variant="peligro" disabled={ocupado === a.id} onClick={() => ejecutar(a, confirmar.accion)}>
                        {ocupado === a.id ? '…' : 'Confirmar'}
                      </Button>
                      <Button small variant="fantasma" onClick={() => setConfirmar(null)}>Cancelar</Button>
                    </>
                  ) : (
                    <>
                      {a.active && <Button small onClick={() => setConfirmar({ id: a.id, accion: 'reset' })}>Resetear contraseña</Button>}
                      {a.active ? (
                        <Button small variant="peligro" disabled={ultimo} title={ultimo ? 'Es el último administrador activo' : undefined}
                          onClick={() => setConfirmar({ id: a.id, accion: 'deactivate' })}>
                          Desactivar
                        </Button>
                      ) : (
                        <Button small variant="exito" onClick={() => setConfirmar({ id: a.id, accion: 'activate' })}>Activar</Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </Modal>
      )}
    </>
  )
}
