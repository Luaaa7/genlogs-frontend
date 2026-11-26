import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Ban, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Eye, Inbox, Loader, PackageCheck, Search, Timer, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"
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
import { ChipsFiltroPortal } from "../components/ChipsFiltroPortal"
import { BOTON_SECUNDARIO, ENTRADA_TARJETA, ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL, retardoEntrada } from "../lib/estilosTarjeta"
import { ESTADOS_PEDIDO, TONO_ESTADO_PEDIDO, avisoEstadoFinal, esEstadoFinalSinCotizar, etiquetaEstado } from "../lib/estadoPedido"
import type { EstadoPedido, Pedido } from "@/types/portal.types"

const estados: Array<"TODOS" | EstadoPedido> = ["TODOS", ...ESTADOS_PEDIDO]

/** Icono de cada chip de estado. */
const ICONO_ESTADO: Record<string, LucideIcon> = {
  TODOS: Inbox,
  PENDIENTE: ClipboardList,
  EN_REVISION: Search,
  EN_ESPERA_TERCERO: Timer,
  COTIZADA: PackageCheck,
  RECHAZADA: Ban,
  CANCELADA: Ban,
}

/** Pedidos que siguen avanzando (aún no cotizados ni cerrados). */
const EN_CURSO = new Set(["PENDIENTE", "EN_REVISION", "EN_ESPERA_TERCERO"])

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

  const total = query.data?.length ?? 0
  const enCurso = (query.data ?? []).filter((p) => EN_CURSO.has(p.estado)).length
  const cotizados = conteo.COTIZADA ?? 0

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal
        titulo="Mis pedidos"
        descripcion="Consulta el avance de tus solicitudes."
        ilustracion="pedidos"
        accion={<BotonNuevaSolicitud variante="pildora" />}
        resumen={query.data && total > 0 ? [
          { icono: <ClipboardList />, valor: total, texto: total === 1 ? "solicitud" : "solicitudes" },
          { icono: <Loader />, valor: enCurso, texto: "en curso" },
          { icono: <CheckCircle2 />, valor: cotizados, texto: cotizados === 1 ? "cotizada" : "cotizadas" },
        ] : undefined}
      />
      <ChipsFiltroPortal
        etiqueta="Filtrar pedidos"
        valor={filtro}
        onChange={setFiltro}
        opciones={estados.map((estado) => ({
          valor: estado,
          label: estado === "TODOS" ? "Todos" : etiquetaEstado(estado),
          n: query.data ? (estado === "TODOS" ? total : (conteo[estado] ?? 0)) : undefined,
          Icono: ICONO_ESTADO[estado],
        }))}
      />

      {query.isPending ? (
        <ListaEsqueleto variante="pedido" etiqueta="Cargando pedidos..." />
      ) : query.isError ? (
        <ErrorBanner message="No pudimos cargar tus pedidos." onRetry={() => query.refetch()} />
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
          <div className="grid gap-4">
            {paginacion.visibles.map((pedido, indice) => {
              const nuevo = String(pedido.id) === resaltado
              const titulo = pedido.asunto ?? "Solicitud de abastecimiento"
              const descripcion = descripcionUtil(pedido)
              const cerrado = esEstadoFinalSinCotizar(pedido.estado)
              return (
                <article
                  key={`${filtro}-${pedido.id}`}
                  style={retardoEntrada(indice)}
                  // Sin tailwind-merge: «border» de la tarjeta no debe borrar el «border-l-4» del estado.
                  className={[
                    "group p-4 sm:p-6",
                    TARJETA_PORTAL,
                    "border-l-4",
                    TARJETA_ELEVABLE,
                    ENTRADA_TARJETA,
                    BORDE_ESTADO[pedido.estado] ?? BORDE_FINAL,
                    nuevo ? "ring-2 ring-[#2E6BA8]/30 dark:ring-[#60A5FA]/30" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span aria-hidden="true" className={cn(ICONO_TARJETA, cerrado && "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10")}>
                      {cerrado ? <Ban className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <span className="tabular-nums">{pedido.codigo ?? `Pedido #${pedido.id}`}</span> · {new Date(pedido.fecha).toLocaleDateString("es-PE")}
                          </p>
                          <h2 className="mt-1 text-base font-semibold leading-snug text-[#183153] dark:text-slate-50 sm:text-lg">
                            <Link to={`/portal/pedidos/${pedido.id}`} className={`rounded-sm hover:underline ${FOCO}`}>{titulo}</Link>
                          </h2>
                          {descripcion && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{descripcion}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {nuevo && <span className="rounded-full bg-[#FACC15]/20 px-2 py-0.5 text-xs font-semibold text-[#854D0E] dark:bg-[#FACC15]/15 dark:text-[#FDE68A]">Recién creada</span>}
                          <EstadoBadge tono={TONO_ESTADO_PEDIDO[pedido.estado] ?? "neutral"}>{etiquetaEstado(pedido.estado)}</EstadoBadge>
                        </div>
                      </div>
                    </div>
                  </div>
                  {cerrado ? (
                    <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white/60 px-3 py-2 text-sm text-muted-foreground dark:border-white/15 dark:bg-white/[0.03]">
                      {avisoEstadoFinal(pedido.estado)}
                    </p>
                  ) : (
                    <ProgresoPedido estado={pedido.estado} etiqueta={`Avance de ${titulo}`} className="mt-5" />
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
                    <button
                      type="button"
                      onClick={(evento) => {
                        disparador.current = evento.currentTarget
                        setVista(pedido)
                      }}
                      aria-label={`Vista rápida de ${titulo}`}
                      className={BOTON_SECUNDARIO}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Vista rápida
                    </button>
                    {pedido.estado === "COTIZADA" && (
                      <Link to="/portal/cotizaciones" className={`inline-flex items-center rounded-lg bg-[#FACC15] px-3 py-1.5 font-bold text-[#183153] shadow-sm hover:bg-[#EAB308] ${FOCO}`}>Ver cotizaciones</Link>
                    )}
                    <Link to={`/portal/pedidos/${pedido.id}`} aria-label={`Ver detalle de ${titulo}`} className={`ml-auto inline-flex items-center gap-1 rounded-sm font-semibold text-[#2E6BA8] hover:text-[#1E3A5F] dark:text-[#93C5FD] dark:hover:text-white ${FOCO}`}>
                      Ver detalle<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
          {paginacion.totalPaginas > 1 ? (
            <nav aria-label="Paginación de pedidos" className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Página {paginacion.pagina + 1} de {paginacion.totalPaginas}</span>
              <div className="flex gap-2">
                <button type="button" disabled={paginacion.pagina === 0} onClick={() => paginacion.onPagina(paginacion.pagina - 1)} className={`${BOTON_SECUNDARIO} disabled:pointer-events-none disabled:opacity-50`}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Anterior</button>
                <button type="button" disabled={paginacion.pagina >= paginacion.totalPaginas - 1} onClick={() => paginacion.onPagina(paginacion.pagina + 1)} className={`${BOTON_SECUNDARIO} disabled:pointer-events-none disabled:opacity-50`}>Siguiente<ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </nav>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Página {paginacion.pagina + 1} de {paginacion.totalPaginas}</p>
          )}
        </>
      )}

      {vista && <VistaRapidaPedido pedido={vista} onCerrar={cerrarVista} />}
    </div>
  )
}
