import type { fac_registros_verifactu } from '@prisma/client'

// Generación del XML RegistroAlta / RegistroAnulacion según el esquema
// SuministroInformacion.xsd de la AEAT. NO IMPLEMENTADO: la columna `xml` queda NULL.
// Al implementarlo, los importes deben escribirse con fmt2() para que coincidan
// exactamente con los usados en la huella (ver huella.ts).

export function generarXmlRegistro(_registro: fac_registros_verifactu): string | null {
  return null
}
