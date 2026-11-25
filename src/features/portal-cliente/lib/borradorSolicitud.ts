import { itemVacio, type ItemPedidoForm } from "./itemPedido"

/** Clave del borrador de «Nueva solicitud» en sessionStorage (se pierde al cerrar la pestaña). */
export const CLAVE_BORRADOR = "genlogs-borrador-nueva-solicitud"

/** Máximo de repuestos por solicitud en el backend. */
const MAX_REPUESTOS = 50

/** Repuesto del borrador: lo del formulario sin el id ni el objeto File (no se pueden guardar). */
export type ItemBorrador = Omit<ItemPedidoForm, "id" | "foto">

export interface BorradorSolicitud {
  asunto: string
  /** true si el cliente escribió el asunto a mano: ya no se sobrescribe. */
  asuntoEditado: boolean
  detalle: string
  notaAbierta: boolean
  items: ItemBorrador[]
  /** Había al menos un archivo adjunto sin subir: el navegador no lo conserva al recargar. */
  teniaAdjunto: boolean
  /** Cuántos repuestos llegaron precargados desde /portal/repuestos (0 si ninguno). */
  precargados: number
  /** location.key de la navegación que abrió el formulario: distingue recargar de volver a entrar. */
  claveNavegacion: string
}

export function itemABorrador(item: ItemPedidoForm): ItemBorrador {
  return {
    modo: item.modo,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    unidad: item.unidad,
    marca: item.marca,
    numeroParte: item.numeroParte,
    gtin: item.gtin,
    urlFoto: item.urlFoto,
    ...(item.idProducto !== undefined ? { idProducto: item.idProducto } : {}),
  }
}

export function guardarBorrador(borrador: BorradorSolicitud) {
  try {
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador))
  } catch {
    /* sin almacenamiento: el formulario funciona igual, solo que no se recupera al recargar */
  }
}

export function limpiarBorrador() {
  try {
    sessionStorage.removeItem(CLAVE_BORRADOR)
  } catch {
    /* nada que limpiar */
  }
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "")

function itemDeBorrador(crudo: unknown): ItemBorrador | null {
  if (!crudo || typeof crudo !== "object") return null
  const r = crudo as Record<string, unknown>
  if (typeof r.descripcion !== "string") return null
  return {
    modo: r.modo === "foto" ? "foto" : "parte",
    descripcion: r.descripcion,
    cantidad: texto(r.cantidad) || itemVacio().cantidad,
    unidad: typeof r.unidad === "string" ? r.unidad : itemVacio().unidad,
    marca: texto(r.marca),
    numeroParte: texto(r.numeroParte),
    gtin: texto(r.gtin),
    urlFoto: texto(r.urlFoto) || null,
    ...(typeof r.idProducto === "number" ? { idProducto: r.idProducto } : {}),
  }
}

/** Lee el borrador; si no existe, está dañado o no tiene la forma esperada, devuelve null. */
export function leerBorrador(): BorradorSolicitud | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_BORRADOR)
    if (!crudo) return null
    const b = JSON.parse(crudo) as Record<string, unknown> | null
    if (!b || typeof b !== "object" || typeof b.asunto !== "string" || !Array.isArray(b.items)) return null
    return {
      asunto: b.asunto,
      asuntoEditado: b.asuntoEditado === true,
      detalle: texto(b.detalle),
      notaAbierta: b.notaAbierta === true,
      items: b.items.map(itemDeBorrador).filter((i): i is ItemBorrador => i !== null).slice(0, MAX_REPUESTOS),
      teniaAdjunto: b.teniaAdjunto === true,
      precargados: typeof b.precargados === "number" ? b.precargados : 0,
      claveNavegacion: texto(b.claveNavegacion),
    }
  } catch {
    return null
  }
}

/**
 * Convierte lo que llega en location.state.repuestos (por ejemplo, el carrito de /portal/repuestos)
 * en repuestos del formulario. Con N.º de parte entra en modo «parte»; sin él, en modo «foto».
 * Descarta lo que no sea un repuesto con descripción.
 */
export function itemsDesdePrecargados(crudo: unknown): ItemPedidoForm[] {
  if (!Array.isArray(crudo)) return []
  const items: ItemPedidoForm[] = []
  for (const elemento of crudo) {
    if (!elemento || typeof elemento !== "object") continue
    const r = elemento as Record<string, unknown>
    const descripcion = texto(r.descripcion).trim()
    if (!descripcion) continue
    const numeroParte = texto(r.numeroParte).trim()
    const cantidad = Number(r.cantidad)
    const vacio = itemVacio()
    items.push({
      ...vacio,
      modo: numeroParte ? "parte" : "foto",
      descripcion,
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? String(cantidad) : vacio.cantidad,
      unidad: texto(r.unidad).trim() || vacio.unidad,
      marca: texto(r.marca).trim(),
      numeroParte,
      urlFoto: texto(r.urlFoto) || null,
      ...(typeof r.idProducto === "number" ? { idProducto: r.idProducto } : {}),
    })
  }
  return items.slice(0, MAX_REPUESTOS)
}
