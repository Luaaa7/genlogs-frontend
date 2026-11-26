import { cn } from "@/lib/utils/utils"
import { inicialesMarca, logoDeMarca, tonoMarca } from "../lib/marcas"

/**
 * Logotipo de la marca sobre una placa clara (así se respetan sus colores corporativos en ambos temas).
 * Sin logotipo en `src/assets/marcas/` usa un respaldo tipográfico con el nombre de la marca.
 * Es decorativo: el nombre de la marca siempre se lee al lado.
 *
 * - `placa`: tarjeta de marca y panel del producto (ocupa el ancho disponible).
 * - `chip`: junto al nombre de la marca en tarjetas y carrito.
 */
export function LogoMarca({ marca, variante = "placa", className }: { marca: string; variante?: "placa" | "chip"; className?: string }) {
  const logo = logoDeMarca(marca)

  if (variante === "chip") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 ring-1 ring-slate-200 dark:ring-white/10",
          className,
        )}
      >
        {logo ? (
          <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-[10px] font-extrabold tracking-tight" style={{ color: tonoMarca(marca) }}>
            {inicialesMarca(marca)}
          </span>
        )}
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-white px-2.5 py-2.5 ring-1 ring-slate-200/80 dark:bg-slate-50 dark:ring-white/10",
        className,
      )}
    >
      {logo ? (
        <img src={logo} alt="" decoding="async" className="max-h-full max-w-full object-contain" />
      ) : (
        <RespaldoTipografico marca={marca} />
      )}
    </span>
  )
}

/** Marca sin logotipo: el nombre compuesto como logotipo de texto, con el tono estable de la marca. */
function RespaldoTipografico({ marca }: { marca: string }) {
  const tono = tonoMarca(marca)
  // El tamaño depende de la palabra más larga: así ninguna palabra se corta a la mitad.
  const palabra = Math.max(...marca.split(/\s+/).map((p) => p.length))
  const tamano = palabra <= 4 ? "text-xl" : palabra <= 6 ? "text-base" : palabra <= 8 ? "text-[13px]" : palabra <= 10 ? "text-[11px]" : "text-[10px]"
  return (
    <span className="flex max-w-full flex-col items-center gap-1">
      <span
        className={cn("line-clamp-2 max-w-full text-center [overflow-wrap:normal] [word-break:keep-all] font-extrabold uppercase leading-[1.05] tracking-tight", tamano)}
        style={{ color: tono }}
      >
        {marca}
      </span>
      <span className="h-0.5 w-6 rounded-full" style={{ backgroundColor: tono, opacity: 0.35 }} />
    </span>
  )
}
