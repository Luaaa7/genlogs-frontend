/** Texto que se muestra cuando el repuesto no trae un plazo estimado propio. */
export const PLAZO_SEGUN_COTIZACION = "Plazo según cotización"

/**
 * El backend manda «24 a 48 horas» para todo repuesto nacional (VitrinaService.PLAZO_NACIONAL).
 * Es un texto fijo, no un plazo propio del producto, así que no se muestra tal cual.
 */
const PLAZO_FIJO_GENERICO = /^\s*24\s*a\s*48\s*(horas|h)\s*$/i

export function textoPlazoRepuesto(plazoEntrega: string | null | undefined): string {
  const texto = plazoEntrega?.trim() ?? ""
  if (!texto || PLAZO_FIJO_GENERICO.test(texto)) return PLAZO_SEGUN_COTIZACION
  return texto
}