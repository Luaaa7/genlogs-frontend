import { Loader2, Receipt } from 'lucide-react'
import { useFacturas } from '../hooks/useFacturacion'
import { ErrorBanner } from '@/components/ui/ErrorBanner'

export function FacturacionPage() {
  const { data, isLoading, isError, refetch } = useFacturas()
  const facturas = data?.content ?? []

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Facturación</h1>
        <p className="text-sm text-muted-foreground">Comprobantes, tipos y estados de emisión.</p>
      </header>

      {isError && (
        <ErrorBanner message="No se pudieron cargar los comprobantes." onRetry={() => refetch()} />
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 font-medium text-muted-foreground">Comprobante</th>
              <th className="p-3 font-medium text-muted-foreground">Cliente</th>
              <th className="p-3 font-medium text-muted-foreground">Emisión</th>
              <th className="p-3 font-medium text-muted-foreground">Total</th>
              <th className="p-3 font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-accent" />
                  Cargando comprobantes…
                </td>
              </tr>
            )}
            {!isLoading && !isError && facturas.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                  <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  No hay comprobantes registrados.
                </td>
              </tr>
            )}
            {facturas.map((factura) => (
              <tr key={factura.idFacturacion} className="border-t border-border hover:bg-muted/50">
                <td className="p-3 font-medium text-foreground">{factura.codigoComprobante}</td>
                <td className="p-3">{factura.cliente ?? factura.idOrdenCompra}</td>
                <td className="p-3">{factura.fechaEmision}</td>
                <td className="p-3 font-mono">{'—'}</td>
                <td className="p-3">{factura.estadoCodigo ?? factura.idEstadoFacturacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
