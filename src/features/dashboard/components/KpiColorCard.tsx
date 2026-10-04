import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils/utils"

interface KpiColorCardProps {
  titulo: string
  valor: string
  /** Texto pequeño junto al valor o arriba a la derecha (contexto del número). */
  detalle?: ReactNode
  /** Serie para la línea de tendencia del fondo; sin serie no se dibuja. */
  serie?: number[]
  href: string
  tono: "navy" | "blue"
  className?: string
}

/** Indicador destacado sobre color de marca (blanco sobre azul: 11:1 y 5.5:1).
 *  Toda la tarjeta es un enlace al listado correspondiente. */
export function KpiColorCard({ titulo, valor, detalle, serie, href, tono, className }: KpiColorCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "relative flex min-h-40 flex-col justify-between gap-6 overflow-hidden rounded-xl p-5 text-white transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-6",
        tono === "navy" ? "bg-brand-navy" : "bg-brand-blue",
        className
      )}
    >
      {serie && serie.length > 1 && <Tendencia serie={serie} />}
      <span className="relative text-[15px] font-semibold">{titulo}</span>
      <span className="relative flex items-baseline gap-3">
        <span className="text-4xl font-bold tracking-tight tabular-nums">{valor}</span>
        {detalle && <span className="text-xs text-white/90">{detalle}</span>}
      </span>
    </Link>
  )
}

/** Línea de tendencia decorativa (aria-hidden): el dato ya está en el número. */
function Tendencia({ serie }: { serie: number[] }) {
  const max = Math.max(...serie, 1)
  const min = Math.min(...serie, 0)
  const puntos = serie.map((v, i) => [(i / (serie.length - 1)) * 300, 80 - ((v - min) / (max - min || 1)) * 60])
  const linea = puntos.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  return (
    <svg viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-22 w-full">
      <path d={`${linea} L300,90 L0,90 Z`} fill="white" fillOpacity={0.14} />
      <path d={linea} fill="none" stroke="#93C5FD" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
