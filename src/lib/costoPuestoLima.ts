/** RF-75: precio × tipo de cambio + flete + seguro + aduana, en soles. Igual que CostoPuestoLima del backend. */
export function calcularCostoPuestoLima(v: {
  precio?: number
  codigoMoneda?: string
  tipoCambio?: number
  flete?: number
  seguro?: number
  aduana?: number
}): number | null {
  if (!v.precio || v.precio <= 0) return null
  const enSoles = !v.codigoMoneda || v.codigoMoneda.toUpperCase() === "PEN"
  if (!enSoles && (!v.tipoCambio || v.tipoCambio <= 0)) return null
  const tc = enSoles ? 1 : (v.tipoCambio as number)
  const total = v.precio * tc + (v.flete ?? 0) + (v.seguro ?? 0) + (v.aduana ?? 0)
  return Math.round(total * 100) / 100
}
