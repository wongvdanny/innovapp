#!/bin/bash
# Pipeline diario: genera un post de blog con IA, lo commitea/pushea, rebuilda y
# reinicia el sitio, y avisa a Google Search Console del sitemap actualizado.
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

log "Desplegando (scripts/deploy.sh: build aparte, cambio atómico y rollback si no da 200)..."
if ! scripts/deploy.sh >> "$LOG_FILE" 2>&1; then
  log "ERROR: el despliegue ha fallado; la web sigue con la versión anterior. Ver /var/log/innovapp-deploy.log"
  exit 1
fi
log "Despliegue completado."

log "Enviando sitemap a Google Search Console..."
if node scripts/submit-sitemap.mjs >> "$LOG_FILE" 2>&1; then
  log "Sitemap enviado correctamente."
else
  log "AVISO: fallo al enviar el sitemap a Search Console (el despliegue ya se hizo igualmente)."
fi

log "=== Fin del pipeline ==="
