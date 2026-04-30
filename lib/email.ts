import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'innovapp <onboarding@resend.dev>'

export async function sendWelcomeEmail(to: string, name: string, plan: string, slug: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: '🎉 Bienvenido a Servix — Tu restaurante está listo',
    html: `
      <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a3d4f,#2ab3aa);padding:40px 32px;text-align:center">
          <h1 style="color:white;margin:0 0 8px;font-size:26px;font-weight:800">¡Bienvenido a Servix!</h1>
          <p style="color:rgba(255,255,255,0.75);margin:0;font-size:15px">Tu restaurante ya está listo para funcionar</p>
        </div>

        <!-- Body -->
        <div style="padding:36px 32px">
          <p style="font-size:16px;color:#1a3d4f;margin:0 0 24px">Hola <strong>${name}</strong>,</p>
          <p style="font-size:15px;color:#4a6572;line-height:1.6;margin:0 0 28px">
            Tu suscripción al plan <strong style="color:#1a6478">${plan}</strong> está activa. Hemos creado tu restaurante y tu primer empleado administrador. Aquí tienes todos los datos para acceder:
          </p>

          <!-- Credenciales Servix -->
          <div style="background:#f0f9f8;border:1px solid #d0eeec;border-radius:14px;padding:24px;margin-bottom:20px">
            <div style="font-size:12px;font-weight:700;color:#2ab3aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">🖥️ Acceso al sistema Servix</div>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;font-size:13px;color:#88a8b0;width:140px">URL</td>
                <td style="padding:8px 0;font-size:14px;font-weight:700;color:#1a6478">
                  <a href="https://servix.innovapp.es/login" style="color:#1a6478">servix.innovapp.es/login</a>
                </td>
              </tr>
              <tr style="border-top:1px solid #e0f0ee">
                <td style="padding:8px 0;font-size:13px;color:#88a8b0">Email</td>
                <td style="padding:8px 0;font-size:14px;font-weight:700;color:#1a3d4f">${to}</td>
              </tr>
              <tr style="border-top:1px solid #e0f0ee">
                <td style="padding:8px 0;font-size:13px;color:#88a8b0">Contraseña</td>
                <td style="padding:8px 0;font-size:14px;color:#1a3d4f">La que usaste al registrarte</td>
              </tr>
            </table>
          </div>

          <!-- Credenciales empleado -->
          <div style="background:#fff8f0;border:1px solid #fde68a;border-radius:14px;padding:24px;margin-bottom:28px">
            <div style="font-size:12px;font-weight:700;color:#d97706;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">👨‍🍳 Empleado administrador inicial</div>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;font-size:13px;color:#88a8b0;width:140px">Nombre</td>
                <td style="padding:8px 0;font-size:14px;font-weight:700;color:#1a3d4f">${name}</td>
              </tr>
              <tr style="border-top:1px solid #fde68a">
                <td style="padding:8px 0;font-size:13px;color:#88a8b0">PIN inicial</td>
                <td style="padding:8px 0">
                  <span style="background:#1a3d4f;color:white;font-size:22px;font-weight:800;letter-spacing:8px;padding:6px 14px;border-radius:8px">1234</span>
                </td>
              </tr>
            </table>
            <p style="font-size:12px;color:#92400e;margin:14px 0 0;background:#fffbeb;border-radius:8px;padding:10px">
              ⚠️ Por seguridad, cambia el PIN desde el panel de empleados tras tu primer acceso.
            </p>
          </div>

          <!-- CTA -->
          <a href="https://servix.innovapp.es/login" style="display:block;background:linear-gradient(135deg,#1a6478,#2ab3aa);color:white;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:24px">
            Acceder a mi restaurante →
          </a>

          <!-- Mi cuenta -->
          <div style="text-align:center">
            <a href="https://innovapp.es/dashboard" style="font-size:13px;color:#88a8b0">Ver mi suscripción en innovapp.es →</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafb;padding:20px 32px;border-top:1px solid #eef1f4;text-align:center">
          <p style="font-size:12px;color:#88a8b0;margin:0">
            © 2025 innovapp · <a href="https://innovapp.es" style="color:#2ab3aa;text-decoration:none">innovapp.es</a>
          </p>
        </div>
      </div>
    `
  })
}

export async function sendRenewalReminder(to: string, name: string, daysLeft: number) {
  await resend.emails.send({
    from: FROM, to,
    subject: `⚠️ Tu suscripción Servix vence en ${daysLeft} días`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2>Hola ${name},</h2>
        <p>Tu suscripción a Servix vence en <strong>${daysLeft} días</strong>.</p>
        <a href="https://innovapp.es/dashboard" style="display:block;background:linear-gradient(135deg,#1a6478,#2ab3aa);color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700">Renovar suscripción →</a>
      </div>
    `
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
