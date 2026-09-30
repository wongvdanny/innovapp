#!/bin/bash
# PASO 2 — innovapp-web pasa a ejecutarse como el usuario de sistema «innovapp» (no root).
# NO ejecutar sin aviso previo. Runbook: docs/runbook-paso2-usuario-innovapp.md
# Vuelta atrás (un comando): /var/www/innovapp/scripts/pm2-innovapp-root.sh
set -euo pipefail
cd /var/www/innovapp

# Lo único que la web escribe: .next (caché), storage/facturacion, logo y favicon del admin
chown -R innovapp:innovapp-bk .next storage
chmod 750 storage
chown innovapp:innovapp-bk public/logo.webp public/favicon.ico
# .env: solo root (escritura) y la web (lectura)
chown root:innovapp-bk .env && chmod 640 .env

pm2 delete innovapp-web
pm2 start node_modules/next/dist/bin/next --name innovapp-web --cwd /var/www/innovapp \
  --uid innovapp --gid innovapp-bk -- start --port 3001
pm2 save
sleep 3
ps -o user=,pid=,cmd= -p "$(pm2 pid innovapp-web)"
curl -sI https://innovapp.es | head -1
