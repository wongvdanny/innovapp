#!/bin/bash
# Backup diario de innovapp: volcado completo de innovapp_db (incluye las tablas fac_*)
# y tar de storage/facturacion (PDFs de facturas y adjuntos de gastos).
# Destino: /root/backups/innovapp/{db,storage}/ · rotación de 30 días · log en /var/log/innovapp-backup.log
# Cron (root): 30 3 * * * /var/www/innovapp/scripts/backup-innovapp.sh
set -euo pipefail
umask 077

APP_DIR=/var/www/innovapp
DEST=/root/backups/innovapp
LOG=/var/log/innovapp-backup.log
RETENCION_DIAS=30
TS=$(date +%Y%m%d_%H%M%S)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }
fallo() { log "ERROR: $1"; exit 1; }
trap 'fallo "línea $LINENO (código $?)"' ERR

# Una sola ejecución a la vez
exec 9>/run/innovapp-backup.lock
flock -n 9 || fallo "ya hay otro backup en curso"

mkdir -p "$DEST/db" "$DEST/storage"
log "=== Inicio backup $TS ==="

# Credenciales desde .env. La contraseña puede contener '@': se separa por la ÚLTIMA '@'.
URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '"')
REST=${URL#postgresql://}; CRED=${REST%@*}; HOSTPART=${REST##*@}; PORTDB=${HOSTPART#*:}
export PGUSER=${CRED%%:*} PGPASSWORD=${CRED#*:} PGHOST=${HOSTPART%%:*} PGPORT=${PORTDB%%/*}
PGDATABASE=${PORTDB#*/}; PGDATABASE=${PGDATABASE%%\?*}; export PGDATABASE

# 1. Base de datos (formato custom: comprimido y restaurable por tablas)
DUMP="$DEST/db/${PGDATABASE}_${TS}.dump"
pg_dump --format=custom --compress=9 --no-owner --file="$DUMP.tmp"
pg_restore --list "$DUMP.tmp" > /dev/null || fallo "el volcado no es legible"
TABLAS_FAC=$(pg_restore --list "$DUMP.tmp" | grep -c ' TABLE DATA public fac_' || true)
[ "$TABLAS_FAC" -ge 10 ] || fallo "el volcado solo contiene $TABLAS_FAC tablas fac_ (se esperaban 10)"
mv "$DUMP.tmp" "$DUMP"
log "BD: $(basename "$DUMP") ($(du -h "$DUMP" | cut -f1), $TABLAS_FAC tablas fac_)"

# 2. Archivos de facturación
TAR="$DEST/storage/storage_facturacion_${TS}.tar.gz"
mkdir -p "$APP_DIR/storage/facturacion"
tar -czf "$TAR.tmp" -C "$APP_DIR/storage" facturacion
tar -tzf "$TAR.tmp" > /dev/null || fallo "el tar no es legible"
mv "$TAR.tmp" "$TAR"
log "Archivos: $(basename "$TAR") ($(du -h "$TAR" | cut -f1), $(tar -tzf "$TAR" | grep -vc '/$' || true) archivos)"

# 3. Sumas de control
( cd "$DEST" && sha256sum "db/$(basename "$DUMP")" "storage/$(basename "$TAR")" >> "$DEST/SHA256SUMS" )

# 4. Rotación
BORRADOS=$(find "$DEST/db" "$DEST/storage" -type f \( -name '*.dump' -o -name '*.tar.gz' \) -mtime +$RETENCION_DIAS -print -delete | wc -l)
find "$DEST/db" "$DEST/storage" -type f -name '*.tmp' -mmin +120 -delete
if [ "$BORRADOS" -gt 0 ]; then
  # Quita del manifiesto las entradas de archivos ya rotados
  ( cd "$DEST" && while read -r suma ruta; do [ -f "$ruta" ] && echo "$suma  $ruta"; done < SHA256SUMS > SHA256SUMS.new && mv SHA256SUMS.new SHA256SUMS )
fi
log "Rotación: $BORRADOS archivo(s) de más de $RETENCION_DIAS días eliminados"
# 5. Copia fuera del servidor (opcional): remoto rclone cifrado "innovapp-offsite:"
#    - diarios/: copia de los archivos nuevos; en remoto se conservan 90 días
#    - mensuales/: el backup del día 1 de cada mes, conservado 6 años (obligación de conservar facturas)
REMOTO=innovapp-offsite
if command -v rclone >/dev/null && rclone listremotes 2>/dev/null | grep -qx "$REMOTO:"; then
  rclone copy "$DEST" "$REMOTO:diarios" --include "db/*.dump" --include "storage/*.tar.gz" --include "SHA256SUMS" --max-age 48h --log-level ERROR
  rclone delete "$REMOTO:diarios" --min-age 90d --log-level ERROR || true
  if [ "$(date +%d)" = "01" ]; then
    rclone copy "$DUMP" "$REMOTO:mensuales/$(date +%Y-%m)" --log-level ERROR
    rclone copy "$TAR" "$REMOTO:mensuales/$(date +%Y-%m)" --log-level ERROR
    rclone delete "$REMOTO:mensuales" --min-age 2200d --log-level ERROR || true
  fi
  log "Copia remota: OK ($REMOTO)"
else
  log "Copia remota: omitida (remoto rclone '$REMOTO' no configurado)"
fi
log "=== Fin backup $TS ==="
