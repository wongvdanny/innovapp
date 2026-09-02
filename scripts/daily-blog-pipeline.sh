#!/bin/bash
# Pipeline diario: genera un post de blog con IA, lo commitea/pushea, rebuilda y
# reinicia el sitio, y avisa a Google Search Console del sitemap actualizado.
# NO configurado en cron todavía -- ejecutar manualmente hasta confirmarlo.
set -e

LOG_FILE=/var/log/innovapp-blog-pipeline.log

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd /var/www/innovapp

log "=== Inicio del pipeline ==="

# Para distinguir en el log un rechazo por verificación de hechos de cualquier otro
# fallo (API caída, falta ANTHROPIC_API_KEY, JSON inválido, etc.), se cuentan los
# borradores en content/blog/.rejected/ antes y después -- si generate-blog-post.mjs
# escribió uno nuevo, fue justo ese el motivo del código de salida distinto de cero.
REJECTED_DIR="content/blog/.rejected"
RECHAZADOS_ANTES=$(find "$REJECTED_DIR" -type f -name '*.json' 2>/dev/null | wc -l)

log "Generando post de blog..."
if node scripts/generate-blog-post.mjs >> "$LOG_FILE" 2>&1; then
  log "Post generado correctamente."

  log "Commiteando y subiendo el post..."
  git add content/blog/
  git commit -m "Blog post automático: $(date +%F)" >> "$LOG_FILE" 2>&1
  git push >> "$LOG_FILE" 2>&1
  log "Commit y push completados."
else
  RECHAZADOS_DESPUES=$(find "$REJECTED_DIR" -type f -name '*.json' 2>/dev/null | wc -l)
  if [ "$RECHAZADOS_DESPUES" -gt "$RECHAZADOS_ANTES" ]; then
    log "Post rechazado por verificación de hechos, revisar content/blog/.rejected/"
  else
    log "ERROR: no se pudo generar el post de blog. Se aborta el pipeline sin tocar el despliegue."
  fi
  exit 1
fi

log "Compilando el proyecto (npm run build)..."
npm run build >> "$LOG_FILE" 2>&1
log "Build completado."

log "Reiniciando PM2 (innovapp-web)..."
pm2 restart innovapp-web --update-env >> "$LOG_FILE" 2>&1
log "PM2 reiniciado."

log "Enviando sitemap a Google Search Console..."
if node scripts/submit-sitemap.mjs >> "$LOG_FILE" 2>&1; then
  log "Sitemap enviado correctamente."
else
  log "AVISO: fallo al enviar el sitemap a Search Console (el despliegue ya se hizo igualmente)."
fi

log "=== Fin del pipeline ==="
