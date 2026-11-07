import type { ReactNode } from "react"

interface PageHeaderProps {
  titulo: string
  /** Contexto corto bajo el título: un conteo, un total o qué hace la pantalla. */
  descripcion?: ReactNode
  /** Acciones a la derecha. Como máximo una principal (Button por defecto). */
  acciones?: ReactNode
}

/** Encabezado estándar de pantalla: título + contexto a la izquierda, acciones
 *  a la derecha; en móvil las acciones bajan debajo del título. */
export function PageHeader({ titulo, descripcion, acciones }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  )
}
