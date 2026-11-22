import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BellRing,
  CalendarDays,
  CircleCheck,
  Inbox,
  ListChecks,
  Receipt,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils/utils"

/** Ícono de cada bloque según su id: así todas las tarjetas del dashboard llevan
 *  ícono sin tocar cada componente. Un id que no está aquí se ve sin ícono. */
const ICONO_POR_ID: Record<string, LucideIcon> = {
  "dash-atencion": BellRing,
  "dash-facturacion": Receipt,
  "dash-cot-mes": CalendarDays,
  "dash-aprobacion": CircleCheck,
  "dash-cot-fac": TrendingUp,
  "dash-estados": ListChecks,
  "dash-meta-plazo": Target,
}

interface DashboardCardProps {
  /** Id del título, para enlazarlo con aria-labelledby. */
  id: string
  titulo: string
  /** Contenido a la derecha del título (selector de periodo, nota, enlace). */
  extra?: ReactNode
  className?: string
  children: ReactNode
}

/** Tarjeta base de los bloques del dashboard: superficie sólida `card`, sin
 *  vidrio ni manchas (el contenido operativo va sobre superficies sólidas). */
export function DashboardCard({ id, titulo, extra, className, children }: DashboardCardProps) {
  const Icono = ICONO_POR_ID[id]
  return (
    <section aria-labelledby={id} className={cn("rounded-xl border border-border bg-card p-5 sm:px-6", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icono && (
            <span data-icono={id} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent" aria-hidden="true">
              <Icono className="h-4 w-4" />
            </span>
          )}
          <h2 id={id} className="text-[15px] font-semibold text-foreground">{titulo}</h2>
        </div>
        {extra}
      </div>
      {children}
    </section>
  )
}

interface SinDatosProps {
  children: ReactNode
  /** Acción para empezar (por ejemplo, crear la primera cotización). */
  accion?: { label: string; href: string }
}

/** Mensaje de "sin datos" dentro de un bloque, con el mismo tono en todos. */
export function SinDatos({ children, accion }: SinDatosProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground">{children}</p>
      {accion && (
        <Link
          to={accion.href}
          className="rounded text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {accion.label}
        </Link>
      )}
    </div>
  )
}