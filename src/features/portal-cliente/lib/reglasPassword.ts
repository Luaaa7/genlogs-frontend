/**
 * Reglas de la contraseña del registro (CO3, CO4). Son las mismas que valida el
 * backend en PoliticaContrasena: si cambian allá, se cambian aquí.
 */
export const MINIMO_PASSWORD = 8
/** BCrypt acepta hasta 72 bytes UTF-8: las tildes y la ñ ocupan 2. */
export const MAXIMO_BYTES_PASSWORD = 72
/**
 * Mayúscula, minúscula, número y distinta del correo. Debe coincidir con el backend:
 * si el grupo las descarta, se pone en false aquí y se relajan en PoliticaContrasena.
 */
export const EXIGIR_REGLAS_EXTRA = true

export interface ReglaPassword {
  id: "minimo" | "maximo" | "mayuscula" | "minuscula" | "numero" | "correo"
  texto: string
  cumple: boolean
}

export function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}

export function reglasPassword(password: string, correo: string): ReglaPassword[] {
  const reglas: ReglaPassword[] = [
    { id: "minimo", texto: `Al menos ${MINIMO_PASSWORD} caracteres`, cumple: password.length >= MINIMO_PASSWORD },
    {
      id: "maximo",
      texto: `Máximo ${MAXIMO_BYTES_PASSWORD} bytes (las tildes y la ñ cuentan doble)`,
      cumple: bytesUtf8(password) <= MAXIMO_BYTES_PASSWORD,
    },
  ]
  if (EXIGIR_REGLAS_EXTRA) {
    const correoLimpio = correo.trim().toLowerCase()
    reglas.push(
      { id: "mayuscula", texto: "Una mayúscula", cumple: /\p{Lu}/u.test(password) },
      { id: "minuscula", texto: "Una minúscula", cumple: /\p{Ll}/u.test(password) },
      { id: "numero", texto: "Un número", cumple: /\p{Nd}/u.test(password) },
      {
        id: "correo",
        texto: "Distinta de tu correo",
        cumple: password.length > 0 && password.toLowerCase() !== correoLimpio,
      },
    )
  }
  return reglas
}

export function passwordValida(password: string, correo: string): boolean {
  return reglasPassword(password, correo).every((regla) => regla.cumple)
}