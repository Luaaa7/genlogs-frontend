import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight, ClipboardList } from "lucide-react"
import { usePedidos } from "../hooks/usePedidos"
import { usePaginacionLocal } from "@/hooks/usePaginacionLocal"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { BotonNuevaSolicitud } from "../components/BotonNuevaSolicitud"
import { ProgresoPedido } from "../components/ProgresoPedido"
import { VistaRapidaPedido } from "../components/VistaRapidaPedido"
import { ESTADOS_PEDIDO, TONO_ESTADO_PEDIDO, etiquetaEstado } from "../lib/estadoPedido"
import type { EstadoPedido, Pedido } from "@/types/portal.types"

const estados: Array<"TODOS" | EstadoPedido> = ["TODOS", ...ESTADOS_PEDIDO]

/** Cuánto dura el resaltado del pedido recién creado. */
const RESALTADO_MS = 6000

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/** Borde izquierdo de la tarjeta según el estado (sin colores de alerta, P9). */
const BORDE_ESTADO: Record<string, string> = {
  PENDIENTE: "border-l-slate-400 dark:border-l-slate-500",
  EN_REVISION: "border-l-info",
  EN_ESPERA_TERCERO: "border-l-accent",
  COTIZADA: "border-l-success",
}
const BORDE_FINAL = "border-l-border"

/** La descripción solo se muestra si aporta algo distinto al título. */
function descripcionUtil(pedido: Pedido): string | null {
  const descripcion = pedido.descripcion?.trim()
  if (!descripcion) return null
  const titulo = (pedido.asunto ?? "").trim().toLowerCase()
  return titulo && titulo.includes(descripcion.toLowerCase()) ? null : descripcion
}

/** Encabezado con el estilo de la landing: azul acero suave, montañas sutiles y etiqueta dorada. */
function EncabezadoPedidos() {
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
          <p className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-dorado dark:text-amarillo">
            <span className="h-[3px] w-[22px] rounded-sm bg-dorado dark:bg-amarillo" aria-hidden="true" />
            Portal del cliente
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#183153] dark:text-foreground">Mis pedidos</h1>
          <p className="mt-2 text-muted-foreground">Consulta el avance de tus solicitudes.</p>
        </div>
        <BotonNuevaSolicitud variante="pildora" />
      </div>
    </header>
  )
}

export function MisPedidosPage() {
  const query = usePedidos()
  // La solicitud recién registrada llega en location.state.nuevoPedidoId: su fila se resalta unos segundos.
  const location = useLocation()
  const [resaltado, setResaltado] = useState<string | null>(() => {
    const id = (location.state as { nuevoPedidoId?: unknown } | null)?.nuevoPedidoId
    return id === undefined || id === null ? null : String(id)
  })
  useEffect(() => {
    if (resaltado === null) return
    const temporizador = setTimeout(() => setResaltado(null), RESALTADO_MS)
    return () => clearTimeout(temporizador)
  }, [resaltado])
  const [filtro, setFiltro] = useState<"TODOS" | EstadoPedido>("TODOS")
  // La vista rápida vive en esta misma página: abrirla o cerrarla no toca el filtro.
  const [vista, setVista] = useState<Pedido | null>(null)
  const disparador = useRef<HTMLElement | null>(null)
  const cerrarVista = useCallback(() => {
    setVista(null)
    disparador.current?.focus()
  }, [])

  const conteo = useMemo(() => {
    const cuenta: Record<string, number> = {}
    for (const pedido of query.data ?? []) cuenta[pedido.estado] = (cuenta[pedido.estado] ?? 0) + 1
    return cuenta
  }, [query.data])
  const filtrados = useMemo(() => (query.data ?? []).filter((pedido) => filtro === "TODOS" || pedido.estado === filtro), [query.data, filtro])
  const paginacion = usePaginacionLocal(filtrados)

  return (
    <div>
      <EncabezadoPedidos />
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar pedidos">
        {estados.map((estado) => {
          const cantidad = estado === "TODOS" ? (query.data?.length ?? 0) : (conteo[estado] ?? 0)
          return (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltro(estado)}
              className={`rounded-full border px-3 py-1.5 text-sm ${FOCO} ${filtro === estado ? "border-[#183153] bg-[#183153] text-white dark:border-primary dark:bg-primary" : "border-slate-200 bg-white text-muted-foreground hover:bg-muted dark:border-border dark:bg-transparent"}`}
            >
              {estado === "TODOS" ? "Todos" : etiquetaEstado(estado)}{query.data ? ` (${cantidad})` : ""}
            </button>
          )
        })}
      </div>

      {query.isPending ? (
        <CargandoSpinner texto="Cargando pedidos..." />
      ) : query.isError ? (
        <div className="mt-6"><ErrorBanner message="No pudimos cargar tus pedidos." onRetry={() => query.refetch()} /></div>
      ) : filtrados.length === 0 ? (
        <EstadoVacio
          icono={<ClipboardList className="h-5 w-5" />}
          titulo="No hay pedidos para mostrar"
          descripcion={filtro === "TODOS" ? "Cuando envíes una solicitud aparecerá aquí." : "Prueba con otro estado."}
        />
      ) : (
        <>
          <div className="mt-6 grid gap-3">
            {paginacion.visibles.map((pedido) => {
              const nuevo = String(pedido.id) === resaltado
              const titulo = pedido.asunto ?? "Solicitud de abastecimiento"
              const descripcion = descripcionUtil(pedido)
              return (
                <article
                  key={pedido.id}
                  className={`rounded-xl border border-l-4 bg-white p-5 shadow-sm dark:bg-card ${BORDE_ESTADO[pedido.estado] ?? BORDE_FINAL} ${nuevo ? "border-[#183153]/50 ring-2 ring-[#183153]/20 dark:border-primary dark:ring-primary/30" : "border-slate-200 dark:border-border"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{pedido.codigo ?? `Pedido #${pedido.id}`} · {new Date(pedido.fecha).toLocaleDateString("es-PE")}</p>
                      <h2 className="mt-1 font-semibold">
                        <Link to={`/portal/pedidos/${pedido.id}`} className={`rounded-sm hover:underline ${FOCO}`}>{titulo}</Link>
                      </h2>
                      {descripcion && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{descripcion}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {nuevo && <span className="rounded-full bg-[#183153]/10 px-2 py-0.5 text-xs font-semibold text-[#183153] dark:bg-primary/20 dark:text-foreground">Recién creada</span>}
                      <EstadoBadge tono={TONO_ESTADO_PEDIDO[pedido.estado] ?? "neutral"}>{etiquetaEstado(pedido.estado)}</EstadoBadge>
                    </div>
                  </div>
                  <ProgresoPedido estado={pedido.estado} etiqueta={`Avance de ${titulo}`} className="mt-4" />
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={(evento) => {
                        disparador.current = evento.currentTarget
                        setVista(pedido)
                      }}
                      aria-label={`Vista rápida de ${titulo}`}
                      className={`rounded-md border border-slate-200 px-3 py-1.5 font-medium hover:bg-muted dark:border-border ${FOCO}`}
                    >
                      Vista rápida
                    </button>
                    {pedido.estado === "COTIZADA" && (
                      <Link to="/portal/cotizaciones" className={`rounded-md bg-[#FACC15] px-3 py-1.5 font-bold text-[#183153] hover:bg-[#EAB308] ${FOCO}`}>Ver cotizaciones</Link>
                    )}
                    <Link to={`/portal/pedidos/${pedido.id}`} aria-label={`Ver detalle de ${titulo}`} className={`ml-auto inline-flex items-center gap-1 rounded-sm text-muted-foreground hover:text-foreground ${FOCO}`}>
                      Ver detalle<ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {paginacion.pagina + 1} de {paginacion.totalPaginas}</span>
            <div className="flex gap-2">
              <button type="button" disabled={paginacion.pagina === 0} onClick={() => paginacion.onPagina(paginacion.pagina - 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Anterior</button>
              <button type="button" disabled={paginacion.pagina >= paginacion.totalPaginas - 1} onClick={() => paginacion.onPagina(paginacion.pagina + 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        </>
      )}

      {vista && <VistaRapidaPedido pedido={vista} onCerrar={cerrarVista} />}
    </div>
  )
}
