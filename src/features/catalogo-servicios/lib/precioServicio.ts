/**
 * Margen sobre el precio de venta, igual que el backend y la cotización:
 *   precio = costo / (1 − margen/100)
 *   costo S/ 100 con 30 % -> S/ 142.86
 */

/** costo / (1 − margen/100), a 2 decimales. Con margen de 100 % o más no hay precio: devuelve 0. */
export function precioCalculado(costo: number, margen: number): number {
  if (margen >= 100) return 0
  return Math.round((costo / (1 - margen / 100)) * 100) / 100
}

/** Margen que deja un precio manual: (precio − costo) / precio × 100, a 2 decimales. Igual que el backend. */
export function margenDePrecio(costo: number, precio: number): number {
  if (!(precio > 0)) return 0
  return Math.round(((precio - costo) / precio) * 100 * 100) / 100
}

/** 15 y 45 quedan adentro. Fuera de ese rango, el servicio queda pendiente. */
export function margenFueraDeRango(margen: number, minimo: number, maximo: number): boolean {
  return margen < minimo || margen > maximo
}