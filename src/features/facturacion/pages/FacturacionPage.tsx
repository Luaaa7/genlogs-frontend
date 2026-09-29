import { useFacturas } from '../hooks/useFacturacion'

export function FacturacionPage() {
  const { data, isLoading, isError } = useFacturas()
  const facturas = data?.content ?? []
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Facturación</h1>
        <p className="text-sm text-muted-foreground">Comprobantes, tipos y estados de emisión.</p>
      </header>
      {isError && <p role="alert" className="text-sm text-red-600">No se pudieron cargar los comprobantes.</p>}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3">Comprobante</th><th className="p-3">Cliente</th><th className="p-3">Emisión</th><th className="p-3">Total</th><th className="p-3">Estado</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4">Cargando…</td></tr>}
            {!isLoading && facturas.length === 0 && <tr><td colSpan={5} className="p-4 text-slate-500">No hay comprobantes registrados.</td></tr>}
            {facturas.map((factura) => <tr key={factura.idFacturacion} className="border-t"><td className="p-3 font-medium">{factura.codigoComprobante}</td><td className="p-3">{factura.cliente ?? factura.idOrdenCompra}</td><td className="p-3">{factura.fechaEmision}</td><td className="p-3">{'—'}</td><td className="p-3">{factura.estadoCodigo ?? factura.idEstadoFacturacion}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}
