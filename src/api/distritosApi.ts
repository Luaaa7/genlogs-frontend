import { axiosClient } from "./axiosClient"

/**
 * Distrito tal como lo usa la app. El backend puede responder de tres formas
 * según su versión, y esta capa las unifica para que la UI nunca reciba
 * `provincia` indefinida:
 *  - solo { idDistrito, nombreDistrito, ubigeo }                (backend viejo)
 *  - plano: { ..., nombreProvincia, nombreDepartamento }        (backend nuevo)
 *  - anidado: { ..., provincia: { nombreProvincia, departamento: { nombreDepartamento } } }
 */
export interface Distrito {
  idDistrito: number
  nombreDistrito: string
  ubigeo: string
  nombreProvincia?: string
  nombreDepartamento?: string
}

type DistritoCrudo = Record<string, unknown>

const texto = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v : undefined

const objeto = (v: unknown): Record<string, unknown> | undefined =>
  v !== null && typeof v === "object" ? (v as Record<string, unknown>) : undefined

export function normalizarDistrito(crudo: DistritoCrudo): Distrito {
  const provincia = objeto(crudo.provincia)
  const departamento = objeto(provincia?.departamento) ?? objeto(crudo.departamento)
  return {
    idDistrito: Number(crudo.idDistrito),
    nombreDistrito: texto(crudo.nombreDistrito) ?? "",
    ubigeo: texto(crudo.ubigeo) ?? "",
    nombreProvincia:
      texto(crudo.nombreProvincia) ?? texto(provincia?.nombreProvincia) ?? texto(crudo.provincia),
    nombreDepartamento:
      texto(crudo.nombreDepartamento) ??
      texto(departamento?.nombreDepartamento) ??
      texto(crudo.departamento),
  }
}

/** Texto "Provincia, Departamento" con lo que haya disponible (puede ser vacío). */
export function ubicacionDistrito(d: Pick<Distrito, "nombreProvincia" | "nombreDepartamento">): string {
  return [d.nombreProvincia, d.nombreDepartamento].filter(Boolean).join(", ")
}

export async function listarDistritos(): Promise<Distrito[]> {
  const { data } = await axiosClient.get<DistritoCrudo[]>("/catalogos/distritos")
  return Array.isArray(data) ? data.map(normalizarDistrito) : []
}
