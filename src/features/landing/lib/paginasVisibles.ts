/** Números a mostrar: todos si son pocos; si no, 1 … vecinas de la actual … última. */
export function paginasVisibles(pagina: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const medio = [pagina - 1, pagina, pagina + 1].filter((p) => p > 1 && p < total)
  const salida: (number | "…")[] = [1]
  if (medio[0] > 2) salida.push("…")
  salida.push(...medio)
  if (medio[medio.length - 1] < total - 1) salida.push("…")
  salida.push(total)
  return salida
}