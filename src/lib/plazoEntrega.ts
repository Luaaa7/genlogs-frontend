/** Texto cuando el repuesto no trae plazo de entrega. */
export const PLAZO_SEGUN_COTIZACION = "Plazo según cotización"

/** Plazo de entrega tal como lo devuelve la API; si viene vacío o no existe, «Plazo según cotización». */
export function textoPlazoEntrega(plazo: string | null | undefined): string {
  const limpio = plazo?.trim()
  return limpio ? limpio : PLAZO_SEGUN_COTIZACION
}
