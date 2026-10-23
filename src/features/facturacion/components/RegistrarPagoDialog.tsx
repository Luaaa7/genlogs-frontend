import { useEffect, useRef, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'

interface Props {
  open: boolean
  comprobante: string
  saldo: number
  moneda: string
  isLoading?: boolean
  error?: string | null
  onConfirm: (monto: number) => void
  onCancel: () => void
}

/** Modal para registrar un pago (total o parcial) de un comprobante. */
export function RegistrarPagoDialog(props: Props) {
  if (!props.open) return null
  // key: cada vez que se abre para otro comprobante, el monto se reinicia con su saldo
  return <Contenido key={`${props.comprobante}-${props.saldo}`} {...props} />
}

function Contenido({ comprobante, saldo, moneda, isLoading = false, error, onConfirm, onCancel }: Props) {
  const [monto, setMonto] = useState(saldo.toFixed(2))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  const valor = Number(monto)
  const errorLocal =
    monto === '' || Number.isNaN(valor) ? 'Ingresa un monto.'
    : valor <= 0 ? 'El monto debe ser mayor a cero.'
    : valor > saldo + 0.001 ? `No puede superar el saldo (${formatearMoneda(saldo, moneda)}).`
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="pago-titulo"
        onSubmit={(e) => {
          e.preventDefault()
          if (!errorLocal) onConfirm(Math.round(valor * 100) / 100)
        }}
        className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="pago-titulo" className="text-base font-semibold text-foreground">Registrar pago</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {comprobante} · Saldo pendiente: <span className="font-medium text-foreground tabular-nums">{formatearMoneda(saldo, moneda)}</span>
            </p>
          </div>
        </div>

        <label htmlFor="pago-monto" className="mt-5 block text-sm font-medium text-foreground">Monto pagado ({moneda})</label>
        <Input
          ref={inputRef}
          id="pago-monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          max={saldo}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          aria-invalid={!!errorLocal}
          className="mt-1.5 tabular-nums"
        />
        {(errorLocal || error) && <p className="mt-1.5 text-xs text-destructive">{errorLocal ?? error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading || !!errorLocal}>{isLoading ? 'Guardando…' : 'Registrar pago'}</Button>
        </div>
      </form>
    </div>
  )
}