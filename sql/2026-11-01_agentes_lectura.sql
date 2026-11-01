-- Rol de SOLO LECTURA para que innovapp lea agentes_db (AGENTES_DB_URL).
-- Se ejecuta como postgres:  sudo -u postgres psql -v pass="'<contraseña>'" -f sql/2026-11-01_agentes_lectura.sql
-- La contraseña la genero yo y va solo a /var/www/innovapp/.env (nunca a git).
CREATE ROLE innovapp_lectura_agentes LOGIN PASSWORD :pass
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT CONNECTION LIMIT 5;
ALTER ROLE innovapp_lectura_agentes SET default_transaction_read_only = on;
\c agentes_db
GRANT CONNECT ON DATABASE agentes_db TO innovapp_lectura_agentes;
GRANT USAGE ON SCHEMA public TO innovapp_lectura_agentes;
-- Solo las tablas que necesita el panel (negocios, ofertas y cuotas), no todo el esquema.
GRANT SELECT ON "Negocio", "OfertaPago", "CuotaPago" TO innovapp_lectura_agentes;
