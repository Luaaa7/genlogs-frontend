import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { usePedidos } from "../hooks/usePedidos"
import { usePaginacionLocal } from "@/hooks/usePaginacionLocal"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { BotonNuevaSolicitud } from "../components/BotonNuevaSolicitud"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { ProgresoPedido } from "../components/ProgresoPedido"
import { VistaRapidaPedido } from "../components/VistaRapidaPedido"
import { ENTRADA_TARJETA, TARJETA_ELEVABLE, retardoEntrada } from "../lib/estilosTarjeta"
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
      <EncabezadoPortal titulo="Mis pedidos" descripcion="Consulta el avance de tus solicitudes." accion={<BotonNuevaSolicitud variante="pildora" />} />
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
        <div className="mt-6"><ListaEsqueleto variante="pedido" etiqueta="Cargando pedidos..." /></div>
      ) : query.isError ? (
        <div className="mt-6"><ErrorBanner message="No pudimos cargar tus pedidos." onRetry={() => query.refetch()} /></div>
      ) : filtrados.length === 0 ? (
        <EstadoVacioIlustrado
          ilustracion={filtro === "TODOS" ? "pedidos" : "busqueda"}
          titulo="No hay pedidos para mostrar"
          descripcion={filtro === "TODOS" ? "Cuando envíes una solicitud aparecerá aquí." : "Prueba con otro estado."}
          accion={filtro === "TODOS" ? (
            <Link to="/portal/solicitud" className={`inline-flex items-center rounded-md bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#183153] hover:bg-[#EAB308] ${FOCO}`}>Crear mi primera solicitud</Link>
          ) : (
            <button type="button" onClick={() => setFiltro("TODOS")} className={`rounded-md border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-muted dark:border-border ${FOCO}`}>Ver todos los pedidos</button>
          )}
        />
      ) : (
        <>
          <div className="mt-6 grid gap-3">
            {paginacion.visibles.map((pedido, indice) => {
              const nuevo = String(pedido.id) === resaltado
              const titulo = pedido.asunto ?? "Solicitud de abastecimiento"
              const descripcion = descripcionUtil(pedido)
              return (
                <article
                  key={`${filtro}-${pedido.id}`}
                  style={retardoEntrada(indice)}
                  className={`group rounded-xl border border-l-4 bg-white p-5 shadow-sm dark:bg-card ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA} ${BORDE_ESTADO[pedido.estado] ?? BORDE_FINAL} ${nuevo ? "border-[#183153]/50 ring-2 ring-[#183153]/20 dark:border-primary dark:ring-primary/30" : "border-slate-200 dark:border-border"}`}
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
                      Ver detalle<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
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
