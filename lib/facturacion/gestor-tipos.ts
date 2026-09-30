// Tipos y constantes del documento para la gestoría que también usa el navegador
// (sin dependencias de servidor: gestor.ts importa prisma, fs y archiver).
export const DIAS_ENLACE = 30

export interface Criterio { tema: string; aplicado: string; confirmar: boolean }
export interface Pendiente { texto: string; hecho: boolean }
export interface DocumentoGestor {
  generado: string
  titulo: string
  emisor: { nombre: string; nombreComercial: string; iae: string; inicio: string }
  lead: string
  resumen: { titulo: string; texto: string }[]
  criterios: Criterio[]
  verifactu: { estado: string; pendientes: Pendiente[] }
  dudas: { id: string; tema: string; pregunta: string; respuesta: string | null; estado: string }[]
  fuentes: { texto: string; url: string }[]
}
