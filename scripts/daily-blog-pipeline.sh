#!/bin/bash
# Pipeline del blog (cron: lunes y jueves a las 6:00). Genera un post con IA como BORRADOR
# en content/blog/.drafts/ y avisa por email (Resend) a contacto@innovapp.es con el enlace
# de vista previa. No publica, no commitea y no despliega: el post se publica al aprobarlo
# en /admin (pestaña Blog), que lo pasa a content/blog, lo confirma en git, lo añade al
# sitemap y avisa a Search Console. Todo eso lo hace scripts/generate-blog-post.mjs + lib/blog-manual.ts.
set -e

LOG_FILE=/var/log/innovapp-blog-pipeline.log

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd /var/www/innovapp

log "=== Inicio del pipeline (modo borrador) ==="

# Para distinguir en el log un rechazo por verificación de cualquier otro fallo (API caída,
# sin crédito, JSON inválido...), se cuentan los rechazados antes y después.
REJECTED_DIR="content/blog/.rejected"
RECHAZADOS_ANTES=$(find "$REJECTED_DIR" -type f -name '*.json' 2>/dev/null | wc -l)

log "Generando borrador..."
if node scripts/generate-blog-post.mjs >> "$LOG_FILE" 2>&1; then
  log "Borrador generado y aviso enviado (ver arriba). Pendiente de aprobación en /admin."
else
  RECHAZADOS_DESPUES=$(find "$REJECTED_DIR" -type f -name '*.json' 2>/dev/null | wc -l)
  if [ "$RECHAZADOS_DESPUES" -gt "$RECHAZADOS_ANTES" ]; then
    log "Borrador rechazado por verificación, revisar content/blog/.rejected/"
  else
    log "ERROR: no se pudo generar el borrador."
  fi
  exit 1
fi

log "=== Fin del pipeline ==="
