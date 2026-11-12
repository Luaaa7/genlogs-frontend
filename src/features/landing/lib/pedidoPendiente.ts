/**
 * D-16 y D-30: el visitante sin cuenta llena la solicitud rápida; se guarda aquí
 * mientras se registra y se envía al volver a la landing.
 * El almacenamiento del navegador puede fallar o venir vacío: todo va en try/catch.
 */
export interface PedidoPendiente {
  marca: string
  numeroParte: string
  descripcion: string
  cantidad: number
  /** Si viene de "Cotizar" en la vitrina: producto pedido (canal VITRINA). */
  idProducto?: number
  guardadoEn: number
}

const CLAVE = "genlogs-pedido-pendiente"
/** Un pedido guardado hace más de un día ya no se envía solo. */
const VIGENCIA_MS = 24 * 60 * 60 * 1000

export function guardarPedidoPendiente(pedido: Omit<PedidoPendiente, "guardadoEn">): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...pedido, guardadoEn: Date.now() }))
    return true
  } catch {
    return false
  }
}

export function leerPedidoPendiente(ahora = Date.now()): PedidoPendiente | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const p = JSON.parse(crudo) as Partial<PedidoPendiente>
    const valido =
      typeof p.descripcion === "string" && p.descripcion.trim() !== "" &&
      typeof p.cantidad === "number" && p.cantidad > 0 &&
      typeof p.guardadoEn === "number" && ahora - p.guardadoEn <= VIGENCIA_MS
    if (!valido) {
      borrarPedidoPendiente()
      return null
    }
    return {
      marca: typeof p.marca === "string" ? p.marca : "",
      numeroParte: typeof p.numeroParte === "string" ? p.numeroParte : "",
      descripcion: p.descripcion as string,
      cantidad: p.cantidad as number,
      ...(typeof p.idProducto === "number" ? { idProducto: p.idProducto } : {}),
      guardadoEn: p.guardadoEn as number,
    }
  } catch {
    return null
  }
}

export function borrarPedidoPendiente() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* sin almacenamiento: no hay nada que borrar */
  }
}

/** El portal guarda el token del cliente aparte del interno. */
export function tokenCliente(): string | null {
  try {
    return localStorage.getItem("cliente_access_token")
  } catch {
    return null
  }
}
