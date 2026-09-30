-- Página para la gestoría: enlaces de solo lectura con caducidad y dudas editables.
-- El token del enlace NO se guarda: solo su SHA-256 (y los 6 últimos caracteres para reconocerlo).
BEGIN;

CREATE TABLE fac_enlaces_gestor (
  id                text        PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  token_sha256      text        NOT NULL UNIQUE CHECK (token_sha256 ~ '^[0-9a-f]{64}$'),
  token_sufijo      text        NOT NULL,
  nota              text,
  creado_por        text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expira_at         timestamptz NOT NULL,
  revocado_at       timestamptz,
  revocado_por      text,
  accesos           integer     NOT NULL DEFAULT 0,
  ultimo_acceso_at  timestamptz,
  CHECK (expira_at > created_at)
);

CREATE TABLE fac_dudas_gestor (
  id          text        PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  orden       integer     NOT NULL DEFAULT 0,
  tema        text        NOT NULL,
  pregunta    text        NOT NULL,
  respuesta   text,
  estado      text        NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'resuelta')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fac_dudas_gestor_orden_idx ON fac_dudas_gestor (estado, orden);

INSERT INTO fac_dudas_gestor (orden, tema, pregunta) VALUES
 (10,  'ROI / VIES (modelo 036, casilla 582)', '¿Debo darme de alta ya? Recibo servicios de proveedores de la UE que facturan sin IVA (hosting y software) y podría facturar a empresas de la UE.'),
 (20,  'Modelo 349', 'Si procede, ¿con qué periodicidad? Sería clave S para servicios prestados a empresas de la UE y clave I para servicios recibidos de proveedores de la UE.'),
 (30,  'Gastos con inversión del sujeto pasivo', 'Plan propuesto: autoliquidar el IVA al 21 % sobre la base. Proveedor de la UE: devengado en las casillas 10 y 11 y deducible en las 36 y 37. Proveedor de fuera de la UE: casillas 12 y 13 y 28 y 29. En el libro de recibidas, «inversión del sujeto pasivo = S» y total factura = base. ¿Es correcto?'),
 (40,  'Retención en suscripciones SaaS', 'Cobradas online a empresas y autónomos. Hoy no se aplica retención. ¿Procede en una licencia de uso de software?'),
 (50,  'Retención del 7 % por inicio de actividad', '¿Cumplo los requisitos? ¿Hay que comunicarlo a los clientes?'),
 (60,  'Modelo 130', '¿Estoy obligado a presentarlo? Queda exento quien tiene retención en más del 70 % de los ingresos del año anterior, y este es mi primer año.'),
 (70,  'Estimación directa', '¿Normal o simplificada? ¿Aplico el 5 % de gastos de difícil justificación en la renta?'),
 (80,  'Equipos informáticos', '¿Libro de bienes de inversión y amortización, o gasto directo? Hoy se registran como gasto corriente (G03).'),
 (90,  'Conceptos de gasto', 'Validar la asignación de conceptos de gasto de la tabla de criterios.'),
 (100, 'Casillas 59 y 120 del 303', 'Para servicios no sujetos a clientes de la UE y de fuera de la UE: ¿son las que corresponden?'),
 (110, 'Clientes de Latinoamérica', 'Tratamiento en IVA e IRPF de las suscripciones que me compran clientes de México, Argentina, etc.'),
 (120, 'Libros en XLSX', '¿Os sirve el formato electrónico común de la AEAT para importarlo en vuestro programa, o preferís otro?'),
 (130, 'VeriFactu', 'Confirmar la fecha de obligación para autónomos y la modalidad (VERI*FACTU con envío, o sistema sin envío).');

COMMIT;
