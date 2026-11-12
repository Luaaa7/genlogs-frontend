/** Año y mes actuales en America/Lima. El mes va de 1 a 12. */
export function periodoActualLima(ahora = new Date()): { anio: number; mes: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "numeric",
  }).formatToParts(ahora)
  const anio = Number(partes.find((p) => p.type === "year")?.value)
  const mes = Number(partes.find((p) => p.type === "month")?.value)
  return { anio, mes }
}
