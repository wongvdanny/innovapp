// Testimonios de clientes reales, con su permiso. Vacío hasta tenerlos:
// components/home/Testimonials.tsx no pinta nada mientras no haya ninguno.
export type Testimonial = { quote: string; name: string; role: string; business?: string }

export const TESTIMONIALS: Testimonial[] = []
