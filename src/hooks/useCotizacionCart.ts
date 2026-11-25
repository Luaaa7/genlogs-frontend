import { useSyncExternalStore } from "react"
import {
  abrirCarrito,
  agregarAlCarrito,
  cambiarCantidad,
  carritoAbierto,
  cerrarCarrito,
  leerCarrito,
  quitarDelCarrito,
  restarUnidad,
  sumarUnidad,
  suscribirCarrito,
  vaciarCarrito,
  type ItemCarrito,
} from "@/lib/carritoPublico"

const SIN_ITEMS: ItemCarrito[] = []

/**
 * Carrito de cotización público, compartido por la landing, la cabecera, el ingreso y la solicitud.
 * Vive en localStorage (genlogs_public_cart): cualquier parte de la página que lo use ve lo mismo.
 */
export function useCotizacionCart() {
  const items = useSyncExternalStore(suscribirCarrito, leerCarrito, () => SIN_ITEMS)
  const abierto = useSyncExternalStore(suscribirCarrito, carritoAbierto, () => false)

  return {
    items,
    /** Cuántos repuestos distintos hay (no las unidades). */
    total: items.length,
    cantidadDe: (id: number) => items.find((item) => item.id === id)?.cantidad ?? 0,
    agregar: agregarAlCarrito,
    sumar: sumarUnidad,
    restar: restarUnidad,
    cambiarCantidad,
    quitar: quitarDelCarrito,
    vaciar: vaciarCarrito,
    abierto,
    abrir: abrirCarrito,
    cerrar: cerrarCarrito,
  }
}
