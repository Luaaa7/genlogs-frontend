/**
 * Carrito de cotización del portal. Se guarda en el navegador para no perderlo al
 * cambiar de página; si el almacenamiento falla, funciona igual en memoria.
 */
export interface ItemCarrito {
  /** idProducto como texto, o "texto:<descripción>" si viene de "Volver a pedir". */
  clave: string
  idProducto?: number
  descripcion: string
  marca?: string
  numeroParte?: string
  unidad?: string
  /** Precio referencial unitario (solo para mostrar el estimado). */
  precio?: number
  cantidad: number
}

const CLAVE = "genlogs-carrito-repuestos"
export const MAX_ITEMS = 50

export function leerCarrito(): ItemCarrito[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    const lista = crudo ? (JSON.parse(crudo) as ItemCarrito[]) : []
    return Array.isArray(lista)
      ? lista.filter((i) => i && typeof i.descripcion === "string" && typeof i.cantidad === "number" && i.cantidad > 0)
      : []
  } catch {
    return []
  }
}

export function guardarCarrito(items: ItemCarrito[]) {
  try {
    if (items.length === 0) localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, JSON.stringify(items))
  } catch {
    /* sin almacenamiento: el carrito vive solo en esta pestaña */
  }
}

/** Agrega, o suma la cantidad si ya estaba. Máximo 50 repuestos por solicitud. */
export function agregar(items: ItemCarrito[], nuevo: ItemCarrito): ItemCarrito[] {
  if (items.some((i) => i.clave === nuevo.clave)) {
    return items.map((i) => (i.clave === nuevo.clave ? { ...i, cantidad: i.cantidad + nuevo.cantidad } : i))
  }
  return items.length >= MAX_ITEMS ? items : [...items, nuevo]
}

/** Total referencial; null si algún ítem no tiene precio (los de "Volver a pedir"). */
export function estimado(items: ItemCarrito[]): number | null {
  if (items.length === 0 || items.some((i) => i.precio == null)) return null
  return Math.round(items.reduce((t, i) => t + (i.precio as number) * i.cantidad, 0) * 100) / 100
}
