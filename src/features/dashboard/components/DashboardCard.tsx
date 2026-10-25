import type { ReactNode } from "react"
import { cn } from "@/lib/utils/utils"

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
  return (
    <section aria-labelledby={id} className={cn("rounded-xl border border-border bg-card p-5 sm:px-6", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-[15px] font-semibold text-foreground">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

/** Mensaje de "sin datos" dentro de un bloque, con el mismo tono en todos. */
export function SinDatos({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}
