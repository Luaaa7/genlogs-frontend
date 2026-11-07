/**
 * Escala de márgenes para cotizar.
 *
 * El margen es sobre el PRECIO DE VENTA (margen bruto), como lo calculan la
 * mayoría de distribuidoras:
 *   precio = costo / (1 - margen / 100)
 *   costo S/ 100 con 30 % -> precio S/ 142.86 (ganancia S/ 42.86 = 30 % del precio)
 */

/** Rango de costo de productos. costoHasta null = "en adelante". */
export interface RangoProducto {
  costoDesde: number
  costoHasta: number | null
  margenSugerido: number
  margenMinimo: number
}

/** Margen de una categoría de servicio. idCategoriaServicio null = por defecto. */
export interface MargenServicio {
  idCategoriaServicio: number | null
  nombreCategoria: string | null
  margenSugerido: number
  margenMinimo: number
}

export interface EscalaMargenes {
  productos: RangoProducto[]
  servicios: MargenServicio[]
}

export interface ReglaMargen {
  sugerido: number
  minimo: number
}

/** Tope del margen: con 100 % el precio sería infinito. */
export const MARGEN_MAXIMO = 90

const redondear = (n: number, decimales: number) => {
  const f = 10 ** decimales
  return Math.round((n + Number.EPSILON) * f) / f
}

/** Margen que corresponde a un producto según su costo unitario. */
export function reglaProducto(escala: EscalaMargenes | undefined, costo: number): ReglaMargen | null {
  if (!escala || !(costo >= 0) || escala.productos.length === 0) return null
  const rangos = [...escala.productos].sort((a, b) => a.costoDesde - b.costoDesde)
  const rango =
    rangos.find((r) => costo >= r.costoDesde && (r.costoHasta === null || costo < r.costoHasta)) ??
    // Si el costo queda en un hueco entre rangos, se usa el rango anterior más cercano.
    [...rangos].reverse().find((r) => costo >= r.costoDesde) ??
    rangos[0]
  return { sugerido: rango.margenSugerido, minimo: rango.margenMinimo }
}

/**
 * Margen que corresponde a un servicio según su categoría. Se busca la
 * categoría principal (si el servicio está en una subcategoría, la de su
 * padre) y, si no tiene margen propio, el margen por defecto.
 */
export function reglaServicio(
  escala: EscalaMargenes | undefined,
  idCategoria?: number | null,
  idCategoriaPadre?: number | null,
): ReglaMargen | null {
  if (!escala) return null
  const buscar = (id?: number | null) =>
    id == null ? undefined : escala.servicios.find((s) => s.idCategoriaServicio === id)
  const fila =
    buscar(idCategoriaPadre) ?? buscar(idCategoria) ?? escala.servicios.find((s) => s.idCategoriaServicio === null)
  return fila ? { sugerido: fila.margenSugerido, minimo: fila.margenMinimo } : null
}

/** Precio de venta a partir del costo y el margen (2 decimales). */
export function precioDesdeCosto(costo: number, margen: number): number {
  if (!(costo > 0) || !(margen >= 0) || margen >= 100) return 0
  return redondear(costo / (1 - margen / 100), 2)
}

/** Margen (%) que deja un precio de venta sobre un costo (1 decimal). */
export function margenDesdePrecio(costo: number, precio: number): number {
  if (!(costo > 0) || !(precio > 0)) return 0
  return redondear((1 - costo / precio) * 100, 1)
}

/** 35 -> "35 %", 27.5 -> "27,5 %" */
export function textoPorcentaje(p: number): string {
  return `${Number(p).toLocaleString('es-PE', { maximumFractionDigits: 2 })} %`
}