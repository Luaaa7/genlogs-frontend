import type { ReactNode } from "react"
import { EtiquetaPortal } from "./EtiquetaPortal"

interface EncabezadoPortalProps {
  titulo: string
  descripcion?: string
  /** Botón o enlace a la derecha (por ejemplo «Nueva solicitud»). */
  accion?: ReactNode
}

/** Encabezado con el estilo de la landing: azul acero suave, montañas sutiles y etiqueta dorada. */
export function EncabezadoPortal({ titulo, descripcion, accion }: EncabezadoPortalProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#EEF3F8] to-[#F8FAFC] px-6 py-8 dark:border-border dark:from-[#10213B] dark:to-[#0B1830] sm:px-8">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 160"
        preserveAspectRatio="xMaxYMax slice"
        fill="currentColor"
        className="pointer-events-none absolute bottom-0 right-0 h-full w-2/3 max-w-md text-[#1E3A5F]/10 dark:text-white/10"
      >
        <path d="M0 160 L90 70 L140 110 L220 30 L300 120 L340 90 L400 140 L400 160 Z" />
        <path opacity="0.6" d="M120 160 L210 90 L260 130 L330 80 L400 130 L400 160 Z" />
      </svg>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <EtiquetaPortal />
          <h1 className="mt-2 text-3xl font-bold text-[#183153] dark:text-foreground">{titulo}</h1>
          {descripcion && <p className="mt-2 text-muted-foreground">{descripcion}</p>}
        </div>
        {accion}
      </div>
    </header>
  )
}
