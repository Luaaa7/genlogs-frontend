import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, ClipboardList } from "lucide-react"
import { usePedidos } from "../hooks/usePedidos"
import { usePaginacionLocal } from "@/hooks/usePaginacionLocal"
import { EstadoBadge, type EstadoBadgeTono } from "@/components/ui/EstadoBadge"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import type { EstadoPedido } from "@/types/portal.types"

const estados: Array<"TODOS" | EstadoPedido> = ["TODOS", "PENDIENTE", "EN_PROCESO", "ATENDIDO", "CANCELADO"]
const tonoEstado: Record<string, EstadoBadgeTono> = { PENDIENTE: "warning", EN_PROCESO: "info", ATENDIDO: "success", CANCELADO: "destructive" }

function etiquetaEstado(estado: string) { return estado.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letra) => letra.toUpperCase()) }

export function MisPedidosPage() {
  const query = usePedidos()
  const [filtro, setFiltro] = useState<"TODOS" | EstadoPedido>("TODOS")
  const filtrados = useMemo(() => (query.data ?? []).filter((pedido) => filtro === "TODOS" || pedido.estado === filtro), [query.data, filtro])
  const paginacion = usePaginacionLocal(filtrados)
  return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p><h1 className="mt-2 text-3xl font-bold">Mis pedidos</h1><p className="mt-2 text-muted-foreground">Consulta el avance de tus solicitudes.</p></div><Link to="/portal/solicitud" className="inline-flex justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Nueva solicitud</Link></div><div className="mt-8 flex flex-wrap gap-2" aria-label="Filtrar pedidos">{estados.map((estado) => <button key={estado} type="button" onClick={() => setFiltro(estado)} className={`rounded-full border px-3 py-1.5 text-sm ${filtro === estado ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{estado === "TODOS" ? "Todos" : etiquetaEstado(estado)}</button>)}</div>{query.isPending ? <CargandoSpinner texto="Cargando pedidos..." /> : query.isError ? <div className="mt-6"><ErrorBanner message="No pudimos cargar tus pedidos." onRetry={() => query.refetch()} /></div> : filtrados.length === 0 ? <EstadoVacio icono={<ClipboardList className="h-5 w-5" />} titulo="No hay pedidos para mostrar" descripcion={filtro === "TODOS" ? "Cuando envíes una solicitud aparecerá aquí." : "Prueba con otro estado."} /> : <><div className="mt-6 grid gap-3">{paginacion.visibles.map((pedido) => <Link key={pedido.id} to={`/portal/pedidos/${pedido.id}`} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{pedido.codigo ?? `Pedido #${pedido.id}`} · {new Date(pedido.fecha).toLocaleDateString("es-PE")}</p><h2 className="mt-1 font-semibold">{pedido.asunto ?? "Solicitud de abastecimiento"}</h2></div><EstadoBadge tono={tonoEstado[pedido.estado] ?? "neutral"}>{etiquetaEstado(pedido.estado)}</EstadoBadge></div><div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>{pedido.descripcion ?? "Ver detalle del pedido"}</span><ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div></Link>)}</div><div className="mt-6 flex items-center justify-between text-sm text-muted-foreground"><span>Página {paginacion.pagina + 1} de {paginacion.totalPaginas}</span><div className="flex gap-2"><button type="button" disabled={paginacion.pagina === 0} onClick={() => paginacion.onPagina(paginacion.pagina - 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Anterior</button><button type="button" disabled={paginacion.pagina >= paginacion.totalPaginas - 1} onClick={() => paginacion.onPagina(paginacion.pagina + 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Siguiente</button></div></div></>}</div>
}
