/**
 * Un repuesto dentro del pedido del cliente (D-01).
 * El cliente escribe marca y N.º de parte si los tiene; si no, adjunta una foto
 * o un plano con la descripción. El GTIN (código de barras) es opcional.
 */
export interface ItemPedidoForm {
  /** Identificador estable para la key de React (no se envía al backend). */
  id: string
  descripcion: string
  cantidad: string
  unidad: string
  marca: string
  numeroParte: string
  gtin: string
  foto: File | null
  /** URL de la foto ya subida; se reutiliza al reintentar y se borra si cambia la foto. */
  urlFoto: string | null
}

export type ErroresItem = Partial<Record<keyof ItemPedidoForm, string>>

export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
export const MAX_FOTO_BYTES = 5 * 1024 * 1024

let siguienteId = 0

export const itemVacio = (): ItemPedidoForm => ({
  id: `item-${++siguienteId}`,
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

export function validarItem(item: ItemPedidoForm): ErroresItem {
  const errores: ErroresItem = {}
  const numeroParte = item.numeroParte.trim()
  const gtin = item.gtin.trim()

  if (!item.descripcion.trim()) errores.descripcion = "Describe el repuesto"
  const cantidad = Number(item.cantidad)
  if (!Number.isFinite(cantidad) || cantidad <= 0) errores.cantidad = "La cantidad debe ser mayor a cero"
  if (numeroParte && !item.marca.trim()) errores.marca = "Indica la marca del N.º de parte"
  if (gtin && !esGtinValido(gtin)) errores.gtin = "El GTIN no es válido (revisa los dígitos del código de barras)"

  if (item.foto) {
    if (!TIPOS_FOTO.includes(item.foto.type)) errores.foto = "Adjunta una foto o plano en JPG, PNG, WEBP o PDF"
    else if (item.foto.size > MAX_FOTO_BYTES) errores.foto = "La foto o plano no puede pesar más de 5 MB"
  } else if (!numeroParte) {
    errores.foto = "Sin N.º de parte, adjunta una foto o plano del repuesto"
  }
  return errores
}
