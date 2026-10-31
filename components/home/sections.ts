// Secciones de la home que aún no tienen contenido. Con el flag a false el componente devuelve
// null (no se pinta nada, ni el ancla); se activan cuando la sección tenga su contenido.
export const SECCIONES_HOME = {
  productos: true, // Agentes IA, Servix y GymStack, con capturas en public/casos/
  proceso: false,
  sobreMi: false, // también controla «Quiénes somos» en el footer (/#sobre-mi)
  faq: false,
}
