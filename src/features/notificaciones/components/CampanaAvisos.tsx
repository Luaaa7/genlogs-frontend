import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { listarAvisos } from "@/api/notificacionesApi"
import type { NotificacionResponse } from "@/api/contratos/notificaciones"
import { mensajeError } from "@/lib/errores"

function Aviso({ aviso }: { aviso: NotificacionResponse }) {
  return (
    <li className="border-b border-border px-3 py-2.5 last:border-b-0">
      <p className="text-sm font-medium text-foreground">{aviso.titulo}</p>
      {aviso.mensaje && <p className="mt-1 text-sm text-muted-foreground">{aviso.mensaje}</p>}
    </li>
  )
}

/** Campana del encabezado. Muestra titulo y mensaje de cada aviso, sin filtrar tipo ni rol. */
export function CampanaAvisos() {
  const [abierta, setAbierta] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: listarAvisos,
    retry: false,
  })

  useEffect(() => {
    if (!abierta) return
    function cerrar(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAbierta(false)
    }
    document.addEventListener("mousedown", cerrar)
    return () => document.removeEventListener("mousedown", cerrar)
  }, [abierta])

  const avisos = data?.avisos ?? []

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Avisos"
        aria-expanded={abierta}
        aria-haspopup="dialog"
        onClick={() => setAbierta((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {data != null && data.noLeidas > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {data.noLeidas}
          </span>
        )}
      </button>
      {abierta && (
        <div
          role="dialog"
          aria-label="Lista de avisos"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5"
        >
          {isLoading && <p role="status" className="px-3 py-3 text-sm text-muted-foreground">Cargando los avisos…</p>}
          {isError && (
            <p role="alert" className="px-3 py-3 text-sm text-destructive">
              {mensajeError(error, "No se pudieron cargar los avisos.")}
            </p>
          )}
          {data && avisos.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">No hay avisos.</p>
          )}
          {data && avisos.length > 0 && (
            <ul className="max-h-96 overflow-y-auto">
              {avisos.map((aviso) => (
                <Aviso key={aviso.idNotificacion} aviso={aviso} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
