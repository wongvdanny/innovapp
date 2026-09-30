#!/bin/bash
# VUELTA ATRÁS del paso 2: innovapp-web vuelve a ejecutarse como root, exactamente como antes
# (npm run start -- --port 3001). No hace falta tocar permisos: root lee todo.
set -euo pipefail
pm2 delete innovapp-web
pm2 start npm --name innovapp-web --cwd /var/www/innovapp -- run start -- --port 3001
pm2 save
sleep 3
ps -o user=,pid=,cmd= -p "$(pm2 pid innovapp-web)"
curl -sI https://innovapp.es | head -1
