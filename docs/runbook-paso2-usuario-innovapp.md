# Paso 2 — innovapp-web sin root

**Estado:** planificado para el fin de semana. **No ejecutar sin avisar antes.**
**Alcance:** solo `innovapp-web` (puerto 3001). Servix, gymstack, agentes, lavid y news, después y de uno en uno.
**Corte esperado:** unos segundos (el reinicio de PM2).

## Por qué

Hoy todos los `next-server` corren como root. Un fallo en cualquier web equivale a control total del servidor. Tras este paso, innovapp-web corre como el usuario de sistema `innovapp` (sin shell, grupo `innovapp-bk`), que solo puede:

- leer el código, `.env` (640 `root:innovapp-bk`) y los backups de `/var/backups/innovapp` (750/640);
- escribir en `.next/`, `storage/facturacion/`, `public/logo.webp`, `public/favicon.ico` y `/tmp`;
- lanzar el backup como root con `sudo -n /usr/local/sbin/innovapp-backup` (sin argumentos; regla en `/etc/sudoers.d/innovapp-backup`).

## Ya hecho en el paso 1 (30/09/2026)

- Grupo `innovapp-bk`, usuario `innovapp` (uid 998, `/usr/sbin/nologin`).
- Backups en `/var/backups/innovapp/{db,fac,storage}`; cron a las 03:30 → `/usr/local/sbin/innovapp-backup`.
- `.env` de innovapp, servix, gymstack, lavid y news en 600 `root:root` (agentes ya lo estaba). El script de este paso lo pasa a 640 `root:innovapp-bk` solo en innovapp; los demás se ajustarán en su propia migración. (ps9.innovapp.es/PrestaShop no se ha tocado: su `.env` es de `www-data`.)
- ufw: cerrados 8080 y 9090 (sin procesos escuchando); abiertos 22, 80/443 y correo.
- Parados dos `next-server` huérfanos fuera de PM2 (innovapp :4321 y agentes :3997).
- Comprobación previa como `innovapp` (solo lectura): código, `.next`, fuentes, motor de Prisma, pdfkit y sharp cargan; `/tmp` escribible; sudo permitido. Único bloqueo: `storage/` (root 700), que el script corrige.

## Antes de empezar

1. Avisar y elegir un momento sin cobros en curso.
2. `sudo /usr/local/sbin/innovapp-backup` (backup justo antes).
3. `pm2 describe innovapp-web > /root/backups/pm2-innovapp-web.antes.txt`
4. `curl -sI https://innovapp.es` → 200.

## Ejecutar

```bash
/var/www/innovapp/scripts/pm2-innovapp-usuario.sh
```

Hace: `chown` de `.next`, `storage`, logo y favicon a `innovapp:innovapp-bk`; `.env` a 640 `root:innovapp-bk`; recrea `innovapp-web` en PM2 con `--uid innovapp --gid innovapp-bk` ejecutando `next start --port 3001` directamente (sin npm, que necesitaría un HOME escribible); `pm2 save`.

## Verificar (en este orden)

- [ ] `ps -o user= -p $(pm2 pid innovapp-web)` → `innovapp`
- [ ] `curl -sI https://innovapp.es` → 200; `pm2 logs innovapp-web --lines 50` sin errores `EACCES`
- [ ] Login en `/admin` y `/admin/facturacion`
- [ ] Vista previa de un borrador (genera PDF en memoria)
- [ ] Descargar el PDF de una factura emitida (lee `storage`)
- [ ] Subir un adjunto a un gasto de prueba y borrarlo (escribe en `storage`)
- [ ] Ajustes → Copias de seguridad → «Crear backup ahora» (sudo) y descarga
- [ ] Cron de facturación: `tail -1 /var/log/innovapp-facturacion-cron.log` en la siguiente hora y 5
- [ ] Un pago de prueba no, Stripe está en producción: revisar solo que `/api/webhooks/stripe` responde (400 sin firma)

## Vuelta atrás (un comando)

```bash
/var/www/innovapp/scripts/pm2-innovapp-root.sh
```

Recrea `innovapp-web` exactamente como estaba (`npm run start -- --port 3001`, como root) y hace `pm2 save`. No hace falta deshacer permisos: root puede leer y escribir todo.

## Después: despliegue

Nada cambia: `scripts/deploy.sh` detecta que `innovapp-web` ya no corre como root y asigna `.next` a su usuario antes de reiniciar. Rollback de una versión: `scripts/deploy.sh --rollback`.

Si se edita `scripts/backup-innovapp.sh`, reinstalar la copia que ejecutan cron y sudo:
`install -o root -g root -m 0755 scripts/backup-innovapp.sh /usr/local/sbin/innovapp-backup`
