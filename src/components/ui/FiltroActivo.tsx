import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Filter, X } from 'lucide-react'

/** Aviso de que la lista llega filtrada desde un enlace (p. ej. "la orden de
 *  la cotización X"), con un enlace para volver a ver todo. */
export function FiltroActivo({ children, verTodas }: { children: ReactNode; verTodas: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
      <Filter className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-foreground">{children}</span>
      <Link
        to={verTodas}
        className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Ver todas
      </Link>
    </div>
  )
}