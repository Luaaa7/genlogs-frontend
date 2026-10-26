import { useEffect, useState } from "react"
import { CheckCircle2, X } from "lucide-react"
import { quitarAviso, suscribirAvisos, type Aviso } from "@/lib/avisos"

/** Muestra los avisos de `avisar()` abajo a la derecha (en móvil, encima de la
 *  barra inferior). role="status" para que el lector de pantalla los anuncie. */
export function Avisos() {
  const [lista, setLista] = useState<Aviso[]>([])

  useEffect(() => suscribirAvisos(setLista), [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
    >
      {lista.map((a) => (
        <div
          key={a.id}
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <p className="min-w-0 flex-1">{a.texto}</p>
          <button
            type="button"
            onClick={() => quitarAviso(a.id)}
            aria-label="Cerrar aviso"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}