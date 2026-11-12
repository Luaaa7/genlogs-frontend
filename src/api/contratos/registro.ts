/**
 * Contrato del regreso despues del registro (D-16 y D-30). La landing guarda el
 * pedido en el navegador y manda al registro con ?volver=<ruta>; al terminar, el
 * registro (FE-A) regresa ahi y la landing (FE-D) envia la solicitud.
 */
export const PARAMETRO_VOLVER = 'volver'
export const RUTA_REGISTRO = '/portal/registro'

/** Solo rutas propias ("/algo"): evita mandar al usuario a otro sitio. */
export function esRutaInterna(ruta: string | null | undefined): ruta is string {
  return !!ruta && ruta.startsWith('/') && !ruta.startsWith('//') && !ruta.includes('\\')
}

/** /portal/registro?volver=%2Fcatalogo%3Fp%3D1 */
export function rutaRegistro(volver?: string): string {
  if (!esRutaInterna(volver)) return RUTA_REGISTRO
  return `${RUTA_REGISTRO}?${PARAMETRO_VOLVER}=${encodeURIComponent(volver)}`
}

/** Lee ?volver= de la URL actual; si no hay o no es una ruta propia, devuelve el destino por defecto. */
export function leerVolver(search: string, porDefecto = '/portal/pedidos'): string {
  const volver = new URLSearchParams(search).get(PARAMETRO_VOLVER)
  return esRutaInterna(volver) ? volver : porDefecto
}