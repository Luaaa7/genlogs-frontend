import type { RepuestoPortal } from "../repuestosApi"

/**
 * Logotipos de marca del proyecto: `src/assets/marcas/<marca>.(svg|png|webp)`, con el nombre en
 * minúsculas, sin tildes y con guiones («Allen-Bradley» → `allen-bradley.svg`). Fuentes y licencias en
 * `src/assets/marcas/CREDITOS.md`. Se asocian por el nombre de la marca, nunca por la posición en la
 * cuadrícula; si una marca no tiene archivo se usa el respaldo tipográfico. No se piden imágenes externas.
 */
const ARCHIVOS_LOGO = import.meta.glob<string>("/src/assets/marcas/*.{svg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
})

const LOGOS: Record<string, string> = Object.fromEntries(
  Object.entries(ARCHIVOS_LOGO).map(([ruta, url]) => [slugMarca(ruta.split("/").pop()!.replace(/\.[^.]+$/, "")), url]),
)

/** «Endress+Hauser» → «endress-hauser». */
export function slugMarca(marca: string): string {
  return marca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function logoDeMarca(marca: string): string | undefined {
  return LOGOS[slugMarca(marca)]
}

/** Monograma corto (avatares pequeños): «ABB» → «ABB», «Allen-Bradley» → «AB», «Donaldson» → «DO». */
export function inicialesMarca(marca: string): string {
  const limpia = marca.trim()
  if (!limpia) return "?"
  if (limpia.length <= 4) return limpia.toUpperCase()
  const palabras = limpia.split(/[\s\-+&/.,]+/).filter(Boolean)
  if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase()
  return limpia.slice(0, 2).toUpperCase()
}

/** Tonos del respaldo dentro de la paleta de GENLOGS; la misma marca siempre recibe el mismo tono. */
const TONOS = ["#1E3A5F", "#2E6BA8", "#0B4F7A", "#183153", "#334155", "#1D4ED8"] as const

export function tonoMarca(marca: string): string {
  let h = 0
  for (const c of slugMarca(marca)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TONOS[h % TONOS.length]
}

export interface ResumenMarca {
  marca: string
  /** Repuestos de la marca dentro de la categoría elegida (o de todas). */
  n: number
  /** Repuestos de la marca en todo el catálogo cargado. */
  total: number
}

export type OrdenMarcas = "repuestos" | "alfabetico"

/**
 * Todas las marcas de los repuestos cargados, con su conteo según la categoría elegida.
 * «repuestos»: primero las que más repuestos tienen (empate alfabético); «alfabetico»: A–Z.
 */
export function resumirMarcas(repuestos: RepuestoPortal[], categoria?: string, orden: OrdenMarcas = "alfabetico"): ResumenMarca[] {
  const conteo = new Map<string, { n: number; total: number }>()
  for (const r of repuestos) {
    if (!r.marca) continue
    const actual = conteo.get(r.marca) ?? { n: 0, total: 0 }
    actual.total += 1
    if (!categoria || String(r.idCategoria) === categoria) actual.n += 1
    conteo.set(r.marca, actual)
  }
  const alfabetico = (a: ResumenMarca, b: ResumenMarca) => a.marca.localeCompare(b.marca, "es", { sensitivity: "base" })
  return [...conteo.entries()]
    .map(([marca, c]) => ({ marca, ...c }))
    .sort(orden === "repuestos" ? (a, b) => b.n - a.n || alfabetico(a, b) : alfabetico)
}

/**
 * El catálogo nombra los repuestos como «Tipo - Marca - N.º de parte» (p. ej. «Fusible - Bussmann - FRN-R-20»).
 * Para la tarjeta separa el tipo y el N.º de parte; si el nombre no sigue ese formato, lo deja entero.
 * Solo es presentación: el nombre completo se sigue usando para el pedido.
 */
export function partesNombre(r: Pick<RepuestoPortal, "nombre" | "marca" | "numeroParte">): { titulo: string; numeroParte: string | null } {
  const partes = r.nombre.split(" - ").map((p) => p.trim())
  if (partes.length >= 3 && r.marca && partes[1].toLowerCase() === r.marca.toLowerCase()) {
    return { titulo: partes[0], numeroParte: r.numeroParte ?? partes.slice(2).join(" - ") }
  }
  return { titulo: r.nombre, numeroParte: r.numeroParte }
}
