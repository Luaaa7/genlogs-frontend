/** Rótulo del N.º de OC de la minera. Vacío o null: no hay rótulo, y no se usa el número interno. */
export function textoOcMinera(numero: string | null | undefined): string | null {
  const valor = numero?.trim()
  return valor ? `OC minera ${valor}` : null
}
