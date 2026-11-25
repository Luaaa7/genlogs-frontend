import { useSyncExternalStore } from "react"

/**
 * Lo que el catálogo le pasa a la Solicitud rápida cuando el visitante pulsa «Pedir cotización»
 * en un producto (v3.4). El catálogo de referencia solo conoce el nombre del producto; la marca y el
 * N.º de parte quedan vacíos para que el visitante los complete.
 */
export interface PrecargaSolicitud {
  descripcion: string
  marca?: string
  numeroParte?: string
}

// Se comparte por un pequeño almacén en memoria porque el catálogo y la Solicitud rápida son
// hermanos en la landing y no hay ningún componente común que los conecte.
let actual: PrecargaSolicitud | null = null
const oyentes = new Set<() => void>()

function avisar() {
  oyentes.forEach((oyente) => oyente())
}

/** El catálogo publica el producto elegido. Cada pulsación crea un valor nuevo, aunque sea el mismo producto. */
export function publicarPrecarga(precarga: PrecargaSolicitud) {
  actual = { ...precarga }
  avisar()
}

/** Vacía la pre-carga (para las pruebas). */
export function limpiarPrecarga() {
  actual = null
  avisar()
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** La Solicitud rápida lee el último producto que el visitante eligió en el catálogo. */
export function usePrecargaSolicitud(): PrecargaSolicitud | null {
  return useSyncExternalStore(suscribir, () => actual, () => null)
}
