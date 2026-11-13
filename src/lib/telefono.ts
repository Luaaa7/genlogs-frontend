/**
 * Teléfono del tercero con el prefijo del país (+51, +56…).
 * El prefijo viene del catálogo de países (pais.codigo_telefono); si el país no
 * lo tiene (+1, +7 o sin cargar), se escribe a mano.
 */

/** Solo números y un "+" al inicio, como se guarda. */
export function limpiarTelefono(valor: string): string {
  const sinSimbolos = valor.replace(/[^0-9+]/g, '')
  return sinSimbolos.startsWith('+') ? '+' + sinSimbolos.slice(1).replace(/\+/g, '') : sinSimbolos.replace(/\+/g, '')
}

/** Ejemplo para el placeholder: el prefijo del país y un número de muestra. */
export function ejemploTelefono(prefijo: string | null | undefined): string {
  return prefijo ? `${prefijo} 984 215 330` : '+00 000 000 000'
}

/**
 * Al salir del campo: si se escribió el número sin "+", se le pone el prefijo
 * del país (sin los ceros de adelante). Si ya trae "+", se deja como está.
 */
export function completarPrefijo(telefono: string, prefijo: string | null | undefined): string {
  const limpio = limpiarTelefono(telefono)
  if (!limpio || limpio.startsWith('+') || !prefijo) return limpio
  const numero = limpio.replace(/^0+/, '')
  return numero ? prefijo + numero : ''
}

/**
 * Al cambiar de país: si el teléfono empieza con el prefijo del país anterior,
 * se cambia por el del nuevo. Cualquier otro número se deja como está.
 */
export function cambiarPrefijo(
  telefono: string,
  prefijoAnterior: string | null | undefined,
  prefijoNuevo: string | null | undefined,
): string {
  const limpio = limpiarTelefono(telefono)
  if (!limpio || !prefijoAnterior || !prefijoNuevo || prefijoAnterior === prefijoNuevo) return limpio
  return limpio.startsWith(prefijoAnterior) ? prefijoNuevo + limpio.slice(prefijoAnterior.length) : limpio
}

/** Vacío, o entre 6 y 15 dígitos (con o sin "+"). Así entra lo que ya estaba guardado. */
export function telefonoValido(telefono: string | null | undefined): boolean {
  const texto = (telefono ?? '').trim()
  if (!texto) return true
  const digitos = texto.replace(/\D/g, '').length
  return digitos >= 6 && digitos <= 15
}