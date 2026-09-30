-- Toggle para incluir el QR tributario (servicio ValidarQRNoVerifactu) en facturas
-- emitidas sin modo VERI*FACTU, cuando entre en vigor la obligación. Desactivado por defecto.
BEGIN;
ALTER TABLE fac_ajustes ADD COLUMN qr_no_verifactu boolean NOT NULL DEFAULT false;
COMMIT;
