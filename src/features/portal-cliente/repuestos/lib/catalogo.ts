/** Tarjetas por página en el catálogo de Repuestos. */
export const TAM_PAGINA = 12
/** Marcas que se ven antes de «Ver todas las marcas». */
export const MARCAS_VISIBLES = 8

/** Marcas con su cantidad de repuestos, de mayor a menor (a igualdad, por nombre). Ignora los repuestos sin marca. */
export function marcasPorCantidad(repuestos: { marca?: string | null }[]): { marca: string; n: number }[] {
  const conteo = new Map<string, number>()
  for (const r of repuestos) {
    const marca = r.marca?.trim()
    if (marca) conteo.set(marca, (conteo.get(marca) ?? 0) + 1)
  }
  return [...conteo.entries()]
    .map(([marca, n]) => ({ marca, n }))
    .sort((a, b) => b.n - a.n || a.marca.localeCompare(b.marca, "es"))
}

/** Números de página a mostrar: todas si son pocas; si no, la primera, la última y las vecinas de la actual, con «…» en los saltos. */
export function paginasVisibles(actual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const claves = [...new Set([1, total, actual - 1, actual, actual + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const salida: (number | "…")[] = []
  claves.forEach((p, i) => {
    if (i > 0 && p - claves[i - 1] > 1) salida.push("…")
    salida.push(p)
  })
  return salida
}
