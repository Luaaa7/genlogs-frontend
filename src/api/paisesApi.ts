import { axiosClient } from "./axiosClient"

/** País del catálogo (GET /api/paises). */
export interface Pais {
  idPais: number
  codigoIso: string
  nombrePais: string
  /** Prefijo telefónico con "+" (p. ej. +51). Null si no se cargó (+1, +7). */
  codigoTelefono?: string | null
}

/** Perú se identifica por su código ISO (PE o PER), no por el id, que cambia entre bases. */
export function esPeru(pais: Pick<Pais, "codigoIso"> | null | undefined): boolean {
  const iso = (pais?.codigoIso ?? "").trim().toUpperCase()
  return iso === "PE" || iso === "PER"
}

/** Lista de países con Perú primero y el resto en orden alfabético. */
export function ordenarPaises(paises: Pais[]): Pais[] {
  return [...paises].sort((a, b) => {
    if (esPeru(a) !== esPeru(b)) return esPeru(a) ? -1 : 1
    return a.nombrePais.localeCompare(b.nombrePais, "es")
  })
}

export async function listarPaises(): Promise<Pais[]> {
  const { data } = await axiosClient.get<Pais[]>("/paises")
  return Array.isArray(data) ? ordenarPaises(data) : []
}