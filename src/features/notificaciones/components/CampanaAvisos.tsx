import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCheck } from "lucide-react"
import { listarAvisos, marcarAvisoLeido } from "@/api/notificacionesApi"
import type { AvisosResponse, NotificacionResponse } from "@/api/contratos/notificaciones"
import { mensajeError } from "@/lib/errores"
import { cn } from "@/lib/utils/utils"
import { CLAVE_ALERTAS_DOCUMENTOS } from "@/features/alertas-documentos/hooks/useAlertasDocumentos"
import { cuandoFue, enlaceInterno, marcarEnLista, textoContador } from "../lib/avisos"

const CLAVE = ["notificaciones"] as const
/** Cada cuánto se vuelve a preguntar por avisos nuevos (además de al volver a la pestaña). */
const REFRESCO_MS = 60_000

function Aviso({ aviso, onAbrir }: { aviso: NotificacionResponse; onAbrir: (a: NotificacionResponse) => void }) {
  const cuando = cuandoFue(aviso.fechaCreacion)
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => onAbrir(aviso)}
        className={cn(
          "flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
          !aviso.leida && "bg-accent/5",
        )}
      >
        <span
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", aviso.leida ? "bg-transparent" : "bg-primary")}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm text-foreground", !aviso.leida && "font-semibold")}>
            {aviso.titulo}
            {!aviso.leida && <span className="sr-only"> (sin leer)</span>}
          </span>
          {aviso.mensaje && <span className="mt-1 block text-sm text-muted-foreground">{aviso.mensaje}</span>}
          {cuando && (
            <time dateTime={aviso.fechaCreacion} className="mt-1 block text-xs text-muted-foreground">
              {cuando}
            </time>
          )}
        </span>
      </button>
    </li>
  )
}

/**
 * Campanita de avisos internos (D-21, D-25) en el encabezado. Muestra los avisos del
 * usuario con un contador de no leídos que se actualiza solo. Al abrir un aviso lo
 * marca como leído (PATCH /notificaciones/{id}/leida) y lleva a su enlace. Los avisos
 * no se borran.
 */
export function CampanaAvisos() {
  const [abierta, setAbierta] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: CLAVE,
    queryFn: listarAvisos,
    retry: false,
    refetchInterval: REFRESCO_MS,
    refetchOnWindowFocus: true,
  })

  // Marca en la campanita al instante y luego en el backend; si falla, vuelve a leer la lista.
  const marcar = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) await marcarAvisoLeido(id)
    },
    onMutate: (ids) => {
      const antes = qc.getQueryData<AvisosResponse>(CLAVE)
      if (antes) qc.setQueryData(CLAVE, marcarEnLista(antes, ids))
    },
    onError: () => qc.invalidateQueries({ queryKey: CLAVE }),
    // La pantalla de alertas de documentos (FE-E) lee los mismos avisos.
    onSettled: () => qc.invalidateQueries({ queryKey: CLAVE_ALERTAS_DOCUMENTOS }),
  })

  useEffect(() => {
    if (!abierta) return
    function cerrar(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAbierta(false)
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierta(false)
    }
    document.addEventListener("mousedown", cerrar)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("mousedown", cerrar)
      document.removeEventListener("keydown", escape)
    }
  }, [abierta])

  const avisos = data?.avisos ?? []
  const noLeidas = data?.noLeidas ?? 0
  const idsNoLeidos = avisos.filter((a) => !a.leida).map((a) => a.idNotificacion)

  function abrir(aviso: NotificacionResponse) {
    if (!aviso.leida) marcar.mutate([aviso.idNotificacion])
    const destino = enlaceInterno(aviso.enlace)
    if (destino) {
      setAbierta(false)
      navigate(destino)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={noLeidas > 0 ? `Avisos, ${noLeidas} sin leer` : "Avisos"}
        aria-expanded={abierta}
        aria-haspopup="dialog"
        onClick={() => setAbierta((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {noLeidas > 0 && (
          <span
            data-testid="contador-avisos"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
          >
            {textoContador(noLeidas)}
          </span>
        )}
      </button>
      {abierta && (
        <div
          role="dialog"
          aria-label="Lista de avisos"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Avisos</p>
            {idsNoLeidos.length > 0 && (
              <button
                type="button"
                onClick={() => marcar.mutate(idsNoLeidos)}
                disabled={marcar.isPending}
                className="inline-flex items-center gap-1 rounded text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar todos como leídos
              </button>
            )}
          </div>
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
                <Aviso key={aviso.idNotificacion} aviso={aviso} onAbrir={abrir} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
