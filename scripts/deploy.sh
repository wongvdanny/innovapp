#!/bin/bash
# Despliegue seguro de innovapp.es.
#   scripts/deploy.sh              compila y publica
#   scripts/deploy.sh --rollback   vuelve a la versión anterior (.next-prev)
#
# 1. Compila en .next-build (NEXT_DIST_DIR, ver next.config.js): la web sigue sirviendo .next
#    mientras tanto, y si el build falla no se toca nada.
# 2. Solo si termina bien: .next → .next-prev y .next-build → .next (dos rename en el mismo
#    disco), pm2 restart y comprobación HTTP 200.
# 3. Si no da 200: .next → .next-fallida, .next-prev → .next y reinicio con la versión anterior.
# Log: /var/log/innovapp-deploy.log
set -uo pipefail

APP=/var/www/innovapp
PM2_APP=innovapp-web
URL=${DEPLOY_URL:-https://innovapp.es}   # DEPLOY_URL solo para pruebas del propio script
BUILD=.next-build PREV=.next-prev FALLIDA=.next-fallida
LOG=/var/log/innovapp-deploy.log

log() { echo "[$(TZ=Europe/Madrid date '+%F %T')] $*" | tee -a "$LOG"; }

# Hasta 5 intentos (la app tarda un poco en arrancar). Devuelve 0 si responde 200.
comprobar() {
  local c=000
  for _ in 1 2 3 4 5; do
    c=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$URL")
    [ "$c" = 200 ] && return 0
    sleep 2
  done
  echo "$c"
  return 1
}

# Si la web ya no corre como root (paso 2 del runbook), .next debe ser de su usuario.
ajustar_propietario() {
  local pid usuario
  pid=$(pm2 pid "$PM2_APP" 2>/dev/null)
  usuario=$(ps -o user= -p "$pid" 2>/dev/null | tr -d ' ')
  if [ -n "$usuario" ] && [ "$usuario" != root ]; then
    chown -R "$usuario":innovapp-bk .next && log "Propietario de .next: $usuario"
  fi
}

reiniciar() { pm2 restart "$PM2_APP" >/dev/null && sleep 2; }

cd "$APP" || exit 1
exec 9>/run/innovapp-deploy.lock
flock -n 9 || { log "ERROR: ya hay un despliegue en curso"; exit 1; }

if [ "${1:-}" = "--rollback" ]; then
  [ -f "$PREV/BUILD_ID" ] || { log "ERROR: no hay versión anterior en $PREV"; exit 1; }
  log "=== Rollback manual: $(cat .next/BUILD_ID 2>/dev/null) → $(cat $PREV/BUILD_ID) ==="
  rm -rf "$FALLIDA" && mv .next "$FALLIDA" && mv "$PREV" .next
  ajustar_propietario; reiniciar
  if c=$(comprobar); then log "Rollback OK: 200 (la versión retirada queda en $FALLIDA)"; exit 0; fi
  log "CRÍTICO: tras el rollback $URL responde $c"; exit 1
fi

log "=== Despliegue $(git rev-parse --short HEAD) ==="
rm -rf "$BUILD"
# La caché de compilación acelera el build; se copia para no tocar la de la versión en marcha
[ -d .next/cache ] && mkdir -p "$BUILD" && cp -a .next/cache "$BUILD/cache"

if ! NEXT_DIST_DIR="$BUILD" npx next build >> "$LOG" 2>&1; then
  log "ERROR: el build ha fallado (detalle en $LOG). La web sigue con la versión anterior, sin reiniciar."
  rm -rf "$BUILD"
  exit 1
fi
[ -f "$BUILD/BUILD_ID" ] || { log "ERROR: build sin BUILD_ID; no se publica"; rm -rf "$BUILD"; exit 1; }

ANTERIOR=$(cat .next/BUILD_ID 2>/dev/null || echo ninguna)
rm -rf "$PREV"
mv .next "$PREV" && mv "$BUILD" .next
log "Publicado build $(cat .next/BUILD_ID) (anterior $ANTERIOR en $PREV)"
ajustar_propietario; reiniciar

if c=$(comprobar); then
  log "OK: $URL responde 200"
  npx next-sitemap >> "$LOG" 2>&1 && log "Sitemap regenerado" || log "AVISO: next-sitemap ha fallado (la web está bien)"
  log "=== Fin del despliegue: OK ==="
  exit 0
fi

log "ERROR: $URL responde $c con el build nuevo → restaurando la versión anterior"
rm -rf "$FALLIDA" && mv .next "$FALLIDA" && mv "$PREV" .next
ajustar_propietario; reiniciar
if c=$(comprobar); then
  log "Versión anterior restaurada: 200. El build fallido queda en $FALLIDA para revisarlo."
else
  log "CRÍTICO: la versión anterior tampoco responde ($c). Revisar a mano: pm2 logs $PM2_APP"
fi
exit 1
