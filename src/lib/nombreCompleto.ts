/** Une nombres y apellidos en el texto que espera el servidor (nombreContacto). */
export function unirNombreCompleto(nombres: string, apellidos: string): string {
  return `${nombres.trim()} ${apellidos.trim()}`.trim()
}

/**
 * Reparte un nombre completo ya conocido (por ejemplo, el de la cuenta de Google) en nombres y apellidos:
 * los dos últimos términos son los apellidos y el resto, los nombres. Es solo un punto de partida,
 * la persona puede corregirlo en los campos.
 */
export function separarNombreCompleto(completo: string): { nombres: string; apellidos: string } {
  const palabras = completo.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return { nombres: "", apellidos: "" }
  if (palabras.length === 1) return { nombres: palabras[0], apellidos: "" }
  if (palabras.length === 2) return { nombres: palabras[0], apellidos: palabras[1] }
  const corte = palabras.length === 3 ? 1 : palabras.length - 2
  return { nombres: palabras.slice(0, corte).join(" "), apellidos: palabras.slice(corte).join(" ") }
}
