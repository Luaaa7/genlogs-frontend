import { Loader2, ShoppingCart } from 'lucide-react'
import { useOrdenesCompra } from '../hooks/useOrdenesCompra'
import { ErrorBanner } from '@/components/ui/ErrorBanner'

export function OrdenesCompraPage() {
  const { data, isLoading, isError, refetch } = useOrdenesCompra()
  const ordenes = data?.content ?? []

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Órdenes de compra</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la orden de compra que reemplaza el número de orden legado de la cotización.
        </p>
      </header>

      {isError && (
        <ErrorBanner message="No se pudieron cargar las órdenes de compra." onRetry={() => refetch()} />
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 font-medium text-muted-foreground">Número</th>
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
                  Cargando órdenes de compra…
                </td>
              </tr>
            )}
            {!isLoading && !isError && ordenes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  No hay órdenes registradas.
                </td>
              </tr>
            )}
            {ordenes.map((orden) => (
              <tr key={orden.idOrdenCompra} className="border-t border-border hover:bg-muted/50">
                <td className="p-3 font-medium text-foreground">{orden.numeroOrdenCompra}</td>
                <td className="p-3">{orden.cliente ?? orden.idCotizacion}</td>
                <td className="p-3">{orden.fechaRecepcion}</td>
                <td className="p-3 font-mono">{'—'}</td>
                <td className="p-3">{orden.estadoCodigo ?? orden.idEstadoOrdenCompra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
