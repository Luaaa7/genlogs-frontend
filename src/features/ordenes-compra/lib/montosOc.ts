/** El aviso no viene en el JSON: solo si los dos montos son números y no coinciden. */
export function montosDistintos(montoLeido: number | null | undefined, total: number | null | undefined): boolean {
  return typeof montoLeido === 'number' && Number.isFinite(montoLeido)
    && typeof total === 'number' && Number.isFinite(total)
    && montoLeido !== total
}
