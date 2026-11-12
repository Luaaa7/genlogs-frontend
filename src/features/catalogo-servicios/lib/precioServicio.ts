/** costo × (1 + margen/100), a 2 decimales. Igual que el backend. */
export function precioCalculado(costo: number, margen: number): number {
  return Math.round(costo * (1 + margen / 100) * 100) / 100
}

/** Margen que deja un precio manual: (precio − costo) / costo × 100, a 2 decimales. Igual que el backend. */
export function margenDePrecio(costo: number, precio: number): number {
  return Math.round(((precio - costo) / costo) * 100 * 100) / 100
}

/** 15 y 45 quedan adentro. Fuera de ese rango, el servicio queda pendiente. */
export function margenFueraDeRango(margen: number, minimo: number, maximo: number): boolean {
  return margen < minimo || margen > maximo
}
