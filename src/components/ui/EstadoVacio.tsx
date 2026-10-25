import type { ReactNode } from "react"

interface EstadoVacioProps {
  icono: ReactNode
  titulo: string
  descripcion?: string
  /** Acción para salir del vacío (crear lo primero, limpiar filtros…). */
  accion?: ReactNode
}

/** Estado vacío estándar: una invitación, no una disculpa. */
export function EstadoVacio({ icono, titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent" aria-hidden="true">
        {icono}
      </span>
      <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
      {descripcion && <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
