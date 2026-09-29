import { useOrdenesCompra } from '../hooks/useOrdenesCompra'

export function OrdenesCompraPage() {
  const { data, isLoading, isError } = useOrdenesCompra()
  const ordenes = data?.content ?? []
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Órdenes de compra</h1>
        <p className="text-sm text-muted-foreground">Gestiona la orden de compra que reemplaza el número de orden legado de la cotización.</p>
      </header>
      {isError && <p role="alert" className="text-sm text-red-600">No se pudieron cargar las órdenes de compra.</p>}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3">Número</th><th className="p-3">Cliente</th><th className="p-3">Emisión</th><th className="p-3">Total</th><th className="p-3">Estado</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4">Cargando…</td></tr>}
            {!isLoading && ordenes.length === 0 && <tr><td colSpan={5} className="p-4 text-slate-500">No hay órdenes registradas.</td></tr>}
            {ordenes.map((orden) => <tr key={orden.idOrdenCompra} className="border-t"><td className="p-3 font-medium">{orden.numeroOrdenCompra}</td><td className="p-3">{orden.cliente ?? orden.idCotizacion}</td><td className="p-3">{orden.fechaRecepcion}</td><td className="p-3">{'—'}</td><td className="p-3">{orden.estadoCodigo ?? orden.idEstadoOrdenCompra}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}
