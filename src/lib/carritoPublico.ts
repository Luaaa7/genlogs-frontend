import { leerVolver } from "@/api/contratos/registro"

/**
 * Carrito de cotización público: los repuestos que el visitante elige en la landing, guardados en este
 * navegador hasta que envíe la solicitud desde el portal. Todo va en try/catch: el almacenamiento puede
 * fallar o venir vacío.
 */
export const CLAVE_CARRITO = "genlogs_public_cart"
/** Máximo de repuestos distintos por solicitud en el backend. */
export const MAX_ITEMS_CARRITO = 50
export const MAX_CANTIDAD = 9999

export interface ItemCarrito {
  /** idProducto de la vitrina. */
  id: number
  nombre: string
  marca: string
  numeroParte: string
  cantidad: number
  /** Foto del repuesto en la vitrina, para la miniatura del carrito (si la tiene). */
  imagenUrl?: string
}

export type NuevoItemCarrito = Omit<ItemCarrito, "cantidad" | "imagenUrl"> & { cantidad?: number; imagenUrl?: string | null }

const urlValida = (valor: unknown): string | undefined => (typeof valor === "string" && valor.trim() ? valor : undefined)

const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

// ---- Lectura (con la última lectura guardada, para que useSyncExternalStore reciba el mismo arreglo) ----
let ultimoCrudo: string | null | undefined
let ultimosItems: ItemCarrito[] = []

const cantidadValida = (valor: unknown): number | null => {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 1) return null
  return Math.min(Math.floor(valor), MAX_CANTIDAD)
}

function itemsDe(crudo: string | null): ItemCarrito[] {
  if (!crudo) return []
  try {
    const datos: unknown = JSON.parse(crudo)
    if (!Array.isArray(datos)) return []
    const items: ItemCarrito[] = []
    for (const dato of datos) {
      if (!dato || typeof dato !== "object") continue
      const r = dato as Record<string, unknown>
      const cantidad = cantidadValida(r.cantidad)
      if (typeof r.id !== "number" || !Number.isFinite(r.id) || typeof r.nombre !== "string" || !r.nombre.trim() || !cantidad) continue
      if (items.some((item) => item.id === r.id)) continue
      items.push({
        id: r.id,
        nombre: r.nombre,
        marca: typeof r.marca === "string" ? r.marca : "",
        numeroParte: typeof r.numeroParte === "string" ? r.numeroParte : "",
        cantidad,
        ...(urlValida(r.imagenUrl) && { imagenUrl: urlValida(r.imagenUrl) }),
      })
    }
    return items.slice(0, MAX_ITEMS_CARRITO)
  } catch {
    return []
  }
}

export function leerCarrito(): ItemCarrito[] {
  let crudo: string | null = null
  try {
    crudo = localStorage.getItem(CLAVE_CARRITO)
  } catch {
    /* sin almacenamiento: el carrito se ve vacío */
  }
  if (crudo !== ultimoCrudo) {
    ultimoCrudo = crudo
    ultimosItems = itemsDe(crudo)
  }
  return ultimosItems
}

function guardar(items: ItemCarrito[]) {
  try {
    if (items.length === 0) localStorage.removeItem(CLAVE_CARRITO)
    else localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items))
  } catch {
    /* sin almacenamiento: no se puede recordar el carrito */
  }
  avisar()
}

// ---- Cambios ----

/** Agrega un repuesto; si ya está, suma a su cantidad. Devuelve false si el carrito ya tiene 50 repuestos distintos. */
export function agregarAlCarrito(nuevo: NuevoItemCarrito): boolean {
  const items = leerCarrito()
  const cantidad = cantidadValida(nuevo.cantidad ?? 1) ?? 1
  const imagenUrl = urlValida(nuevo.imagenUrl)
  const existente = items.find((item) => item.id === nuevo.id)
  if (existente) {
    guardar(
      items.map((item) =>
        item.id === nuevo.id
          ? { ...item, cantidad: Math.min(item.cantidad + cantidad, MAX_CANTIDAD), ...(!item.imagenUrl && imagenUrl && { imagenUrl }) }
          : item,
      ),
    )
    return true
  }
  if (items.length >= MAX_ITEMS_CARRITO) return false
  guardar([...items, { id: nuevo.id, nombre: nuevo.nombre, marca: nuevo.marca, numeroParte: nuevo.numeroParte, cantidad, ...(imagenUrl && { imagenUrl }) }])
  return true
}

/** Fija la cantidad de un repuesto; menos de 1 lo quita. */
export function cambiarCantidad(id: number, cantidad: number) {
  const valida = cantidadValida(cantidad)
  if (!valida) {
    quitarDelCarrito(id)
    return
  }
  guardar(leerCarrito().map((item) => (item.id === id ? { ...item, cantidad: valida } : item)))
}

export const sumarUnidad = (id: number) => {
  const actual = leerCarrito().find((item) => item.id === id)
  if (actual) cambiarCantidad(id, actual.cantidad + 1)
}

/** Resta una unidad; con una sola, el repuesto sale del carrito. */
export const restarUnidad = (id: number) => {
  const actual = leerCarrito().find((item) => item.id === id)
  if (actual) cambiarCantidad(id, actual.cantidad - 1)
}

export function quitarDelCarrito(id: number) {
  guardar(leerCarrito().filter((item) => item.id !== id))
}

export function vaciarCarrito() {
  guardar([])
}

/** Quien mire el carrito (también otras pestañas del navegador) se entera cuando cambia. */
export function suscribirCarrito(oyente: () => void): () => void {
  oyentes.add(oyente)
  const alCambiarAlmacenamiento = (evento: StorageEvent) => {
    if (evento.key === null || evento.key === CLAVE_CARRITO) oyente()
  }
  window.addEventListener("storage", alCambiarAlmacenamiento)
  return () => {
    oyentes.delete(oyente)
    window.removeEventListener("storage", alCambiarAlmacenamiento)
  }
}

// ---- Panel abierto (la cabecera lo abre y el carrito flotante lo muestra) ----
let abierto = false

export const carritoAbierto = () => abierto

export function abrirCarrito() {
  abierto = true
  avisar()
}

export function cerrarCarrito() {
  abierto = false
  avisar()
}

// ---- Conexión con el portal ----

/** A dónde va el cliente al ingresar o registrarse: ?volver= si lo hay; con repuestos en el carrito, la solicitud. */
export function destinoTrasAcceso(search: string): string {
  return leerVolver(search, leerCarrito().length > 0 ? "/portal/solicitud" : "/portal/pedidos")
}

/** Lo que NuevaSolicitudPage sabe cargar (la descripción del ítem es el nombre del repuesto). */
export function carritoAPrecargados() {
  return leerCarrito().map((item) => ({
    idProducto: item.id,
    descripcion: item.nombre,
    marca: item.marca,
    numeroParte: item.numeroParte,
    cantidad: item.cantidad,
  }))
}
