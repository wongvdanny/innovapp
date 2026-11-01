import { useEffect, useState } from 'react'
import { Notice, Section, Toggle, useFlash } from '../ui'
import { isInternalBrowser, setInternalBrowser } from '../../../lib/track'

type Tipo = 'logo' | 'favicon'

function Subida({ tipo, subiendo, onFile }: { tipo: Tipo; subiendo: boolean; onFile: (f: File) => void }) {
  return (
    <label style={{ display: 'block', border: '2px dashed var(--adm-accent-border)', borderRadius: 14, padding: '24px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--adm-accent-soft)' }}>
      <input type="file" accept={tipo === 'logo' ? 'image/*' : 'image/*,.ico'} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
      {subiendo ? <div className="adm-fuerte" style={{ color: 'var(--adm-accent)' }}>⏳ Subiendo…</div> : <>
        <div className="adm-fuerte" style={{ color: 'var(--adm-accent)', marginBottom: 4 }}>Haz clic para subir {tipo === 'logo' ? 'un logo nuevo' : 'un favicon nuevo'}</div>
        <div className="adm-muted adm-peq">{tipo === 'logo' ? 'PNG, WEBP, SVG · máx. 2 MB' : 'ICO, PNG · 32×32 px · máx. 2 MB'}</div>
      </>}
    </label>
  )
}

export default function Sitio() {
  const [logo, setLogo] = useState('/logo.webp')
  const [favicon, setFavicon] = useState('/favicon.ico')
  const [subiendo, setSubiendo] = useState<Tipo | null>(null)
  // null hasta leer localStorage en el cliente (evita desajuste de hidratación)
  const [interno, setInterno] = useState<boolean | null>(null)
  const { show, Flash } = useFlash()

  useEffect(() => { setInterno(isInternalBrowser()) }, [])

  const subir = async (file: File, tipo: Tipo) => {
    if (file.size > 2 * 1024 * 1024) { show(false, 'El archivo no puede superar 2 MB'); return }
    setSubiendo(tipo)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', tipo)
    const res = await fetch('/api/admin/upload/logo', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    setSubiendo(null)
    if (!res.ok) { show(false, data.error || 'Error al subir'); return }
    if (tipo === 'logo') setLogo('/logo.webp?t=' + Date.now())
    else setFavicon('/favicon.ico?t=' + Date.now())
    show(true, tipo === 'logo' ? 'Logo actualizado correctamente' : 'Favicon actualizado correctamente')
  }

  const alternarInterno = (v: boolean) => {
    setInternalBrowser(v)
    setInterno(v)
    show(true, v ? 'Este navegador queda marcado como tráfico interno (GA4 lo excluirá).' : 'Este navegador ya no se marca como tráfico interno.')
  }

  return (
    <div className="adm-stack">
      <Flash />
      <Section title="Tráfico interno" subtitle="Marca guardada solo en este navegador (útil en el móvil).">
        {interno !== null && <Toggle value={interno} onChange={alternarInterno} label="Marcar este navegador como interno" help="GA4 no contará tus visitas desde este navegador." />}
      </Section>
      <div className="adm-grid" style={{ ['--min' as any]: '320px' }}>
        <Section title="Logo del sitio" subtitle="Navegación y emails. Recomendado: .webp o .png con fondo transparente.">
          <div style={{ background: 'var(--adm-bg)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, minHeight: 80 }}>
            <img src={logo} alt="Logo actual" style={{ maxHeight: 40, maxWidth: '100%', objectFit: 'contain' }} onError={() => setLogo('/logo.webp')} />
          </div>
          <Subida tipo="logo" subiendo={subiendo === 'logo'} onFile={f => subir(f, 'logo')} />
        </Section>
        <Section title="Favicon" subtitle="Icono de la pestaña del navegador. Recomendado: .ico o .png de 32×32 px.">
          <div style={{ background: 'var(--adm-surface-2)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, minHeight: 80 }}>
            <img src={favicon} alt="Favicon actual" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={() => setFavicon('/favicon.ico')} />
            <span className="adm-muted">innovapp.es</span>
          </div>
          <Subida tipo="favicon" subiendo={subiendo === 'favicon'} onFile={f => subir(f, 'favicon')} />
        </Section>
      </div>
      <Notice tone="aviso">⚠️ Los cambios de logo y favicon pueden tardar unos segundos por la caché del navegador. Si no ves el cambio, recarga con <strong>Ctrl+F5</strong>.</Notice>
    </div>
  )
}
