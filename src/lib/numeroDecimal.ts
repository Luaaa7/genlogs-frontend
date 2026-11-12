/**
 * Convierte lo que escribe la persona a número. Acepta coma o punto decimal:
 * "18,50" → 18.5 · "3,7512" → 3.7512 · "1.234,56" → 1234.56 · "1,234.56" → 1234.56 · "1,234" → 1234.
 * Devuelve undefined si está vacío o no es un número. (Misma regla que el backend.)
 */
export function aNumero(texto: string | null | undefined): number | undefined {
  let t = (texto ?? "").trim().replace(/\s/g, "")
  if (t === "") return undefined
  if (!/^-?[0-9.,]+$/.test(t)) return undefined
  const coma = t.lastIndexOf(","), punto = t.lastIndexOf(".")
  if (coma > punto) {
    // La coma separa miles solo si la siguen exactamente 3 cifras y no hay punto ("1,234");
    // si no, es el decimal ("18,50", "3,7512", "1.234,56").
    const separaMiles = punto === -1 && t.length - coma - 1 === 3
    t = separaMiles ? t.replace(/,/g, "") : t.replace(/\./g, "").replace(",", ".")
  } else {
    t = t.replace(/,/g, "")
  }
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Para tasas como el tipo de cambio: la coma SIEMPRE es decimal ("3,751" → 3.751),
 * porque una tasa nunca lleva separador de miles.
 */
export function aDecimal(texto: string | null | undefined): number | undefined {
  const t = (texto ?? "").trim().replace(/\s/g, "").replace(",", ".")
  if (t === "" || !/^\d+(\.\d+)?$/.test(t)) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}
