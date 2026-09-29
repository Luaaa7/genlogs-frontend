// src/lib/formatters/numeroOrdenCompra.ts

/** Formato oficial: NNNN-NN → secuencia de 4 dígitos + año de 2 dígitos (ej. 0001-26). */
const PATRON = /^(\d{1,4})\s*[-/]\s*(\d{4}|\d{2})$/

export const SIN_NUMERO_ORDEN_COMPRA = "—"

export interface NumeroOrdenCompraPartes {
  secuencia: number
  /** Año en dos dígitos (26 para 2026). */
  anio: number
}

/** Descompone "0001-26" (o "1-26", "0001-2026"). Devuelve null si no tiene la forma esperada. */
export function parsearNumeroOrdenCompra(valor: string | null | undefined): NumeroOrdenCompraPartes | null {
  if (!valor) return null
  const coincidencia = PATRON.exec(valor.trim())
  if (!coincidencia) return null

  const secuencia = Number(coincidencia[1])
  const anioTexto = coincidencia[2]
  const anio = Number(anioTexto.length === 4 ? anioTexto.slice(2) : anioTexto)

  if (secuencia < 1) return null
  return { secuencia, anio }
}

/** Arma el número a partir de sus partes: componer(1, 2026) → "0001-26". */
export function componerNumeroOrdenCompra(secuencia: number, anio: number): string {
  if (!Number.isInteger(secuencia) || secuencia < 1 || secuencia > 9999) {
    throw new RangeError("La secuencia debe ser un entero entre 1 y 9999.")
  }
  if (!Number.isInteger(anio) || anio < 0) {
    throw new RangeError("El año debe ser un entero positivo.")
  }
  return `${String(secuencia).padStart(4, "0")}-${String(anio % 100).padStart(2, "0")}`
}

/**
 * Formato de display NNNN-NN.
 * - "1-26" → "0001-26"
 * - vacío/null → "—"
 * - valor que no encaja en el formato → se muestra tal cual, para no ocultar datos del backend.
 */
export function formatearNumeroOrdenCompra(
  valor: string | null | undefined,
  vacio: string = SIN_NUMERO_ORDEN_COMPRA
): string {
  const limpio = valor?.trim()
  if (!limpio) return vacio
  const partes = parsearNumeroOrdenCompra(limpio)
  return partes ? componerNumeroOrdenCompra(partes.secuencia, partes.anio) : limpio
}

export function esNumeroOrdenCompraValido(valor: string | null | undefined): boolean {
  return parsearNumeroOrdenCompra(valor) !== null
}