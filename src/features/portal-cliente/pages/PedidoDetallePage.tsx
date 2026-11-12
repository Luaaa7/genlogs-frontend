import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Package } from "lucide-react"
import { usePedido } from "../hooks/usePedido"
import { BarraEstadosPedido } from "../components/BarraEstadosPedido"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

export function PedidoDetallePage() {
  const { id } = useParams()
  const query = usePedido(id)
  if (query.isPending) return <CargandoSpinner texto="Cargando pedido..." />
  if (query.isError || !query.data) return <ErrorBanner message="No pudimos cargar el detalle del pedido." onRetry={() => query.refetch()} />
  const pedido = query.data
  return <div className="mx-auto max-w-3xl"><Link to="/portal/pedidos" className="inline-flex items-center gap-2 text-sm text-accent hover:underline"><ArrowLeft className="h-4 w-4" /> Volver a mis pedidos</Link><div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">{pedido.codigo ?? `Pedido #${pedido.id}`}</p><h1 className="mt-2 text-3xl font-bold">{pedido.asunto ?? "Solicitud de abastecimiento"}</h1><p className="mt-2 text-sm text-muted-foreground">{new Date(pedido.fecha).toLocaleDateString("es-PE")}</p></div></div><div className="mt-8"><BarraEstadosPedido estado={pedido.estado} /></div>{pedido.descripcion && <p className="mt-8 whitespace-pre-wrap text-muted-foreground">{pedido.descripcion}</p>}{pedido.items && pedido.items.length > 0 && <div className="mt-8"><h2 className="font-semibold">Ítems solicitados</h2><div className="mt-3 divide-y divide-border rounded-lg border border-border">{pedido.items.map((item, index) => <div key={item.id ?? index} className="flex items-center justify-between gap-4 p-4 text-sm"><span className="flex items-center gap-2"><Package className="h-4 w-4 text-accent" />{item.descripcion}</span><span className="text-muted-foreground">{item.cantidad} {item.unidad ?? "unidades"}</span></div>)}</div></div>}</div></div>
}
