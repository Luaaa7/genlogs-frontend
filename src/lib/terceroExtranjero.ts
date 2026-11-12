/**
 * Ubicación del tercero (D-15, RF-81). Si el país es Perú se elige el distrito
 * del catálogo del INEI; si no, se escriben región, ciudad y código postal.
 *
 * El catálogo viejo tenía un distrito "Extranjero" (UBIGEO 90xxxx). Ya no se
 * ofrece: ahora se elige el país. Esta función sirve para ocultarlo.
 */

const normalizar = (s?: string | null) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

export function esDistritoExtranjero(d?: { ubigeo?: string | null; nombreDistrito?: string | null } | null): boolean {
  if (!d) return false
  return (d.ubigeo ?? "").startsWith("90") || normalizar(d.nombreDistrito) === "extranjero"
}

interface UbicacionTercero {
  idDistrito?: number
  idPais?: number
  esExtranjero?: boolean
  regionExtranjero?: string
  ciudadExtranjero?: string
  codigoPostalExtranjero?: string
}

const textoONulo = (v?: string) => (v?.trim() ? v.trim() : undefined)

/**
 * Deja lista la ubicación para el backend: en Perú se manda el distrito y se
 * quitan los campos de texto; fuera de Perú se manda el texto y no el distrito.
 * `esExtranjero` es solo del formulario y no se envía.
 */
export function prepararUbicacion<T extends { tercero: UbicacionTercero }>(valores: T): T {
  const { esExtranjero, ...tercero } = valores.tercero
  if (esExtranjero) {
    return {
      ...valores,
      tercero: {
        ...tercero,
        idDistrito: undefined,
        regionExtranjero: textoONulo(tercero.regionExtranjero),
        ciudadExtranjero: textoONulo(tercero.ciudadExtranjero),
        codigoPostalExtranjero: textoONulo(tercero.codigoPostalExtranjero),
      },
    }
  }
  return {
    ...valores,
    tercero: { ...tercero, regionExtranjero: undefined, ciudadExtranjero: undefined, codigoPostalExtranjero: undefined },
  }
}
