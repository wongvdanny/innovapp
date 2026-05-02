import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'innovapp <onboarding@resend.dev>'

export async function sendWelcomeEmail(
  to: string, name: string, planName: string, planPrice: number,
  planInterval: string, slug: string, billing?: any
) {
  const periodLabel = planInterval === 'yearly' ? 'año' : 'mes'
  const billingBlock = billing ? `
    <div style="background:#f8fafb;border:1px solid #eef1f4;border-radius:14px;padding:24px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:#88a8b0;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">🧾 Datos de facturación</div>
      <table style="width:100%;border-collapse:collapse">
        ${billing.company ? `<tr><td style="padding:6px 0;font-size:13px;color:#88a8b0;width:140px">Empresa</td><td style="font-size:14px;font-weight:600;color:#1a2533">${billing.company}</td></tr>` : ''}
        ${billing.nif ? `<tr style="border-top:1px solid #eef1f4"><td style="padding:6px 0;font-size:13px;color:#88a8b0">NIF/CIF</td><td style="font-size:14px;font-weight:600;color:#1a2533">${billing.nif}</td></tr>` : ''}
        <tr style="border-top:1px solid #eef1f4"><td style="padding:6px 0;font-size:13px;color:#88a8b0">Dirección</td><td style="font-size:14px;color:#1a2533">${billing.address}, ${billing.zip} ${billing.city}, ${billing.country}</td></tr>
      </table>
    </div>` : ''

  await resend.emails.send({
    from: FROM, to,
    subject: '🎉 ¡Bienvenido a Servix! Tu restaurante está listo',
    html: `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10)">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a3d4f 0%,#1a6478 60%,#2ab3aa 100%);padding:48px 40px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">🎉</div>
        <h1 style="color:white;margin:0 0 8px;font-size:28px;font-weight:800">¡Tu restaurante está listo!</h1>
        <p style="color:rgba(255,255,255,0.8);margin:0;font-size:15px">Hola <strong>${name}</strong>, ya puedes empezar a usar Servix</p>
      </div>

      <!-- Resumen compra -->
      <div style="padding:32px 40px 0">
        <div style="background:linear-gradient(135deg,#f0f9f8,#e6f4f3);border:1px solid #d0eeec;border-radius:16px;padding:24px;margin-bottom:24px">
          <div style="font-size:12px;font-weight:700;color:#2ab3aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">✅ Resumen de tu compra</div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#4a6572;width:160px">Plan contratado</td>
              <td style="font-size:15px;font-weight:800;color:#1a2533">${planName}</td>
            </tr>
            <tr style="border-top:1px solid #d0eeec">
              <td style="padding:8px 0;font-size:13px;color:#4a6572">Importe</td>
              <td style="font-size:15px;font-weight:800;color:#1a6478">${planPrice}€ / ${periodLabel}</td>
            </tr>
            <tr style="border-top:1px solid #d0eeec">
              <td style="padding:8px 0;font-size:13px;color:#4a6572">Estado</td>
              <td><span style="background:#f0fdf4;color:#166534;border-radius:8px;padding:4px 12px;font-size:13px;font-weight:700">✓ Activa</span></td>
            </tr>
          </table>
        </div>

        ${billingBlock}

        <!-- Acceso Servix -->
        <div style="background:#fff8f0;border:1px solid #fde68a;border-radius:16px;padding:24px;margin-bottom:24px">
          <div style="font-size:12px;font-weight:700;color:#d97706;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">🖥️ Tus datos de acceso a Servix</div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#92400e;width:160px">URL</td>
              <td style="padding:8px 0"><a href="https://servix.innovapp.es/login" style="color:#1a6478;font-weight:700;font-size:14px">servix.innovapp.es/login</a></td>
            </tr>
            <tr style="border-top:1px solid #fde68a">
              <td style="padding:8px 0;font-size:13px;color:#92400e">Email</td>
              <td style="padding:8px 0;font-size:14px;font-weight:700;color:#1a2533">${to}</td>
            </tr>
            <tr style="border-top:1px solid #fde68a">
              <td style="padding:8px 0;font-size:13px;color:#92400e">Contraseña</td>
              <td style="padding:8px 0;font-size:14px;color:#1a2533">La que elegiste al registrarte</td>
            </tr>
          </table>
        </div>

        <!-- PIN empleado -->
        <div style="background:#f5f3ff;border:1px solid #d8b4fe;border-radius:16px;padding:24px;margin-bottom:24px">
          <div style="font-size:12px;font-weight:700;color:#7c3aed;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">👤 Tu empleado administrador</div>
          <p style="font-size:14px;color:#4a6572;margin:0 0 16px">Hemos creado tu primer empleado administrador con los datos de tu registro. Úsalo para identificarte en el TPV:</p>
          <div style="display:flex;align-items:center;gap:16px;background:white;border-radius:12px;padding:16px 20px;border:1px solid #d8b4fe">
            <div>
              <div style="font-size:12px;color:#88a8b0;margin-bottom:4px">PIN inicial</div>
              <div style="font-size:32px;font-weight:800;letter-spacing:12px;color:#1a2533;font-family:monospace">1234</div>
            </div>
          </div>
          <p style="font-size:12px;color:#7c3aed;background:#ede9fe;border-radius:8px;padding:10px 14px;margin:14px 0 0;font-weight:600">
            🔐 Cambia este PIN desde el panel de empleados tras tu primer acceso por seguridad.
          </p>
        </div>

        <!-- CTA -->
        <a href="https://servix.innovapp.es/login" style="display:block;background:linear-gradient(135deg,#1a6478,#2ab3aa);color:white;text-align:center;padding:18px;border-radius:14px;text-decoration:none;font-weight:800;font-size:17px;margin-bottom:16px;letter-spacing:0.3px">
          Acceder a mi restaurante →
        </a>
        <a href="https://innovapp.es/dashboard" style="display:block;text-align:center;color:#88a8b0;font-size:13px;text-decoration:none;margin-bottom:32px">
          Ver mi suscripción en innovapp.es →
        </a>
      </div>

      <!-- Pasos rápidos -->
      <div style="background:#f8fafb;border-top:1px solid #eef1f4;padding:28px 40px">
        <div style="font-size:13px;font-weight:700;color:#1a2533;margin-bottom:16px">🚀 Primeros pasos recomendados</div>
        ${[['1','Entra con tu email y contraseña'],['2','Crea tus zonas y mesas desde Configuración'],['3','Añade tu carta (productos y menús)'],['4','¡Empieza a tomar comandas!']].map(([n, t]) => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;font-size:14px;color:#4a6572">
            <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#1a6478,#2ab3aa);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${n}</div>
            ${t}
          </div>`).join('')}
      </div>

      <!-- Footer -->
      <div style="background:#1a2533;padding:24px 40px;text-align:center">
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0 0 8px">© 2025 innovapp · Todos los derechos reservados</p>
        <div style="display:flex;justify-content:center;gap:16px">
          ${[['Privacidad','https://innovapp.es/privacidad'],['Aviso Legal','https://innovapp.es/aviso-legal'],['Soporte','mailto:hola@innovapp.es']].map(([l,h]) => `<a href="${h}" style="color:rgba(255,255,255,0.3);font-size:12px;text-decoration:none">${l}</a>`).join('')}
        </div>
      </div>
    </div>`
  })
}

export async function sendRenewalReminder(to: string, name: string, daysLeft: number) {
  await resend.emails.send({
    from: FROM, to,
    subject: `⚠️ Tu suscripción Servix vence en ${daysLeft} días`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px"><h2>Hola ${name},</h2><p>Tu suscripción a Servix vence en <strong>${daysLeft} días</strong>.</p><a href="https://innovapp.es/dashboard" style="display:block;background:linear-gradient(135deg,#1a6478,#2ab3aa);color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700">Renovar suscripción →</a></div>`
  })
}

export async function sendCancellationEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: 'Tu suscripción Servix ha sido cancelada',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px"><h2>Hola ${name},</h2><p>Tu suscripción a Servix ha sido cancelada. Lamentamos verte partir.</p><p>Si cambias de opinión, puedes volver cuando quieras en <a href="https://innovapp.es">innovapp.es</a>.</p></div>`
  })
}

export async function sendNewsletterConfirmation(to: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: '✅ Suscripción a la newsletter de innovapp confirmada',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px"><h2>¡Gracias por suscribirte!</h2><p>Te mantendremos informado sobre novedades de Servix y el sector hostelero.</p></div>`
  })
}
