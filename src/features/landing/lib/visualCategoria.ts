import {
  Cable, Cog, Droplets, Filter, Gauge, Package, Plug, ShieldCheck, Speaker, Thermometer, Truck, Wind, Wrench, Zap,
  type LucideIcon,
} from "lucide-react"

export interface VisualCategoria {
  Icono: LucideIcon
  /** Clases de fondo suave y color del ícono, siempre con variables del tema (claro y oscuro). */
  tono: string
}

/**
 * Solo azules. Sin verde, porque «éxito» significa que algo está OK, ni naranja,
 * que queda para «requiere atención».
 */
export const TONOS = [
  "bg-accent/10 text-accent",
  "bg-primary/10 text-primary",
  "bg-info/10 text-info",
]

/** Primero se mira el nombre del producto y, si no dice nada, su categoría. El orden importa: gana la primera. */
const REGLAS: [RegExp, LucideIcon][] = [
  [/filtr/, Filter],
  [/adaptador|cargador|fuente de poder|enchufe/, Plug],
  [/altavoz|parlante|speaker|amplific|audio|bocina/, Speaker],
  [/anem[oó]metro|viento|ventil/, Wind],
  [/termo|temperat|termocupla/, Thermometer],
  [/rodam|cojinet|engran|transmis|motor|mec[aá]n/, Cog],
  [/el[eé]ctric|energ|bater|cable/, Zap],
  [/automat|control|sensor|instrument|medic|aislad/, Gauge],
  [/segur|epp|protecc|casco/, ShieldCheck],
  [/herramient|llave/, Wrench],
  [/hidr[aá]ul|bomba|fluid|lubric|aceite/, Droplets],
  [/veh[ií]cul|cami[oó]n|transporte|neum/, Truck],
  [/componente|accesorio|electr[oó]nic|conector/, Cable],
]

function icono(texto: string): LucideIcon | undefined {
  return REGLAS.find(([patron]) => patron.test(texto))?.[1]
}

/** Ícono y color de un producto: el mismo producto siempre da el mismo dibujo. */
export function visualCategoria(categoria?: string | null, nombre?: string | null): VisualCategoria {
  const n = (nombre ?? "").toLowerCase()
  const c = (categoria ?? "").toLowerCase()
  const Icono = icono(n) ?? icono(c) ?? Package
  let suma = 0
  for (const letra of n || c) suma = (suma * 31 + letra.charCodeAt(0)) % 9973
  return { Icono, tono: TONOS[suma % TONOS.length] }
}