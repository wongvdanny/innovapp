import { CSSProperties, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Campo de contraseña con botón para mostrarla u ocultarla (alterna type password/text).
 * Mantiene name/id/autocomplete para que el gestor de contraseñas del navegador la reconozca.
 */
export default function PasswordInput({ style, className, colorIcono = '#5f6b7a', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { colorIcono?: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={visible ? 'text' : 'password'} className={className}
        style={{ ...style, paddingRight: 46 } as CSSProperties} />
      <button type="button" onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}
        aria-controls={props.id} title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 8,
          background: 'transparent', color: colorIcono, cursor: 'pointer',
        }}>
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  )
}
