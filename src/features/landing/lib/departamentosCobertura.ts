import { DEPARTAMENTOS_PERU } from "./mapaPeru"

/** Minúsculas, sin tildes y con un solo espacio entre palabras: «Junín» se encuentra al escribir «junin». */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Nombres que se usan en la práctica y no coinciden con el del mapa. */
const ALIAS: Record<string, string> = { cuzco: "cusco" }

// Los nombres más largos primero: «Madre de Dios» debe ganarle a cualquier nombre corto que contenga.
const POR_LONGITUD = [...DEPARTAMENTOS_PERU]
  .map((dep) => ({ id: dep.id, clave: normalizarTexto(dep.nombre) }))
  .sort((a, b) => b.clave.length - a.clave.length)

/**
 * Departamento del mapa al que corresponde la región de una unidad minera.
 * Acepta el nombre solo («Arequipa») o dentro de un texto más largo («Arequipa - Caylloma»).
 * Devuelve null si la región no trae un departamento reconocible.
 */
export function departamentoDe(region: string | null | undefined): string | null {
  if (!region) return null
  let texto = normalizarTexto(region)
  for (const [alias, nombre] of Object.entries(ALIAS)) texto = texto.replace(new RegExp(`\\b${alias}\\b`, "g"), nombre)
  if (!texto) return null
  const envuelto = ` ${texto} `
  return POR_LONGITUD.find((dep) => envuelto.includes(` ${dep.clave} `))?.id ?? null
}

/** Nombre para mostrar de un departamento del mapa («arequipa» → «Arequipa»). */
export function nombreDepartamento(id: string): string {
  return DEPARTAMENTOS_PERU.find((dep) => dep.id === id)?.nombre ?? id
}
