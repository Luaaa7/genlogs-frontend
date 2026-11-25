/** Cómo identifica el cliente el repuesto: con su N.º de parte o con una foto/plano. */
export type ModoItem = "parte" | "foto"

/**
 * Un repuesto dentro del pedido del cliente (D-01).
 * El cliente elige cómo lo identifica: «Tengo el N.º de parte» (marca y N.º de parte, con foto o plano
 * opcional) o «Tengo una foto» (foto o plano obligatorio, marca opcional). El GTIN (código de barras)
 * es opcional y va aparte.
 */
export interface ItemPedidoForm {
  /** Identificador estable para la key de React (no se envía al backend). */
  id: string
  modo: ModoItem
  descripcion: string
  cantidad: string
  unidad: string
  marca: string
  numeroParte: string
  gtin: string
  foto: File | null
  /** URL de la foto ya subida; se reutiliza al reintentar y se borra si cambia la foto. */
  urlFoto: string | null
  /** Producto de la vitrina, si el repuesto viene precargado desde /portal/repuestos. */
  idProducto?: number
}

export type ErroresItem = Partial<Record<keyof ItemPedidoForm, string>>

export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
export const MAX_FOTO_BYTES = 10 * 1024 * 1024
/** Máximo del asunto en el backend (SolicitudRequest). */
export const MAX_ASUNTO = 150

let siguienteId = 0

export const itemVacio = (): ItemPedidoForm => ({
  id: `item-${++siguienteId}`,
  modo: "parte",
  descripcion: "",
  cantidad: "1",
  unidad: "UND",
  marca: "",
  numeroParte: "",
  gtin: "",
  foto: null,
  urlFoto: null,
})

/** GTIN-8, 12, 13 o 14 con dígito verificador correcto. */
export function esGtinValido(gtin: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(gtin)) return false
  const digitos = gtin.split("").map(Number)
  const verificador = digitos.pop() as number
  const suma = digitos
    .reverse()
    .reduce((total, digito, i) => total + digito * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (suma % 10)) % 10 === verificador
}

/**
 * Regla D-01: cada repuesto exige su N.º de parte (con marca) o una foto/plano.
 * Solo se valida lo que el cliente ve en el modo elegido.
 */
export function validarItem(item: ItemPedidoForm): ErroresItem {
  const errores: ErroresItem = {}
  const gtin = item.gtin.trim()

  if (!item.descripcion.trim()) errores.descripcion = "Describe el repuesto"
  const cantidad = Number(item.cantidad)
  if (!Number.isFinite(cantidad) || cantidad <= 0) errores.cantidad = "La cantidad debe ser mayor a cero"
  if (gtin && !esGtinValido(gtin)) errores.gtin = "El GTIN no es válido (revisa los dígitos del código de barras)"

  if (item.modo === "parte") {
    if (!item.numeroParte.trim()) errores.numeroParte = "Indica el N.º de parte, o elige «Tengo una foto»"
    if (!item.marca.trim()) errores.marca = "Indica la marca del N.º de parte"
  } else if (!item.foto && !item.urlFoto) {
    errores.foto = "Adjunta una foto o plano del repuesto"
  }

  if (item.foto) {
    if (!TIPOS_FOTO.includes(item.foto.type)) errores.foto = "Adjunta una foto o plano en JPG, PNG, WEBP o PDF"
    else if (item.foto.size > MAX_FOTO_BYTES) errores.foto = "La foto o plano no puede pesar más de 10 MB"
  }
  return errores
}

/**
 * Asunto sugerido: la descripción del primer repuesto, más «(+N repuestos)» si hay más.
 * Queda vacío mientras el primero no tenga descripción y nunca pasa de MAX_ASUNTO.
 */
export function asuntoAutomatico(items: Pick<ItemPedidoForm, "descripcion">[]): string {
  const primero = items[0]?.descripcion.trim()
  if (!primero) return ""
  const otros = items.length - 1
  const sufijo = otros === 0 ? "" : otros === 1 ? " (+1 repuesto)" : ` (+${otros} repuestos)`
  return primero.slice(0, MAX_ASUNTO - sufijo.length) + sufijo
}
