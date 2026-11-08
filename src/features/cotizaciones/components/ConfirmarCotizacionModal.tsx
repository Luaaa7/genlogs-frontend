import { Loader2 } from 'lucide-react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { simboloMoneda } from '@/lib/formatters/currency'

interface Props {
  cliente: string
  condicion: string
  moneda: string
  observaciones?: string
  items: { producto: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  subtotal: number
  igv: number
  porcentajeIgv: number
  isPending: boolean
  error?: string
  onConfirmar: () => void
  onVolver: () => void
}

/** Resumen antes de guardar: se revisa todo y recién ahí se crea el borrador. */
export function ConfirmarCotizacionModal({ cliente, condicion, moneda, observaciones, items, subtotal, igv, porcentajeIgv, isPending, error, onConfirmar, onVolver }: Props) {
  return (
    <Ventana
      titulo="Revisa la cotización antes de crearla"
      descripcion="Se guardará como borrador; podrás editarla y enviarla después."
      onCerrar={onVolver}
      cerrable={!isPending}
      ancho="max-w-2xl"
      acciones={
        <>
          <Button type="button" variant="ghost" onClick={onVolver} disabled={isPending}>Volver y corregir</Button>
          <Button type="button" onClick={onConfirmar} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {isPending ? 'Creando…' : 'Confirmar y crear'}
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Cliente</dt>
        <dd className="font-medium">{cliente}</dd>
        <dt className="text-muted-foreground">Condición de pago</dt>
        <dd>{condicion}</dd>
        <dt className="text-muted-foreground">Moneda</dt>
        <dd>{simboloMoneda(moneda)}</dd>
        {observaciones?.trim() && (
          <>
            <dt className="text-muted-foreground">Observaciones</dt>
            <dd className="whitespace-pre-line">{observaciones}</dd>
          </>
        )}
      </dl>

      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Ítem</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Precio</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2">{d.producto}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.cantidad}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(d.precioUnitario, moneda)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(d.subtotal, moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right tabular-nums">{formatearMoneda(subtotal, moneda)}</dd>
        <dt className="text-muted-foreground">IGV ({porcentajeIgv.toLocaleString('es-PE', { maximumFractionDigits: 2 })}%)</dt>
        <dd className="text-right tabular-nums">{formatearMoneda(igv, moneda)}</dd>
        <dt className="font-semibold">Total</dt>
        <dd className="text-right font-semibold tabular-nums">{formatearMoneda(subtotal + igv, moneda)}</dd>
      </dl>

      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
    </Ventana>
  )
}
