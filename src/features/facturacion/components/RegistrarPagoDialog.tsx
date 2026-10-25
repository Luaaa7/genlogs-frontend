import { useEffect, useRef, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { hoyISO } from '@/lib/formatters/fechaLocal'
import type { RegistrarPagoInput } from '@/types/facturacion.types'

const MEDIOS_PAGO = ['Transferencia bancaria', 'Depósito en cuenta', 'Yape / Plin', 'Cheque', 'Efectivo'] as const

interface Props {
  open: boolean
  comprobante: string
  saldo: number
  moneda: string
  isLoading?: boolean
  error?: string | null
  onConfirm: (pago: RegistrarPagoInput) => void
  onCancel: () => void
}

/** Modal para registrar un pago (total o parcial) de un comprobante. */
export function RegistrarPagoDialog(props: Props) {
  if (!props.open) return null
  // key: cada vez que se abre para otro comprobante, el formulario se reinicia con su saldo
  return <Contenido key={`${props.comprobante}-${props.saldo}`} {...props} />
}

/** Solo números con hasta 2 decimales (acepta coma o punto). */
const FORMATO_MONTO = /^\d+([.,]\d{1,2})?$/

function Contenido({ comprobante, saldo, moneda, isLoading = false, error, onConfirm, onCancel }: Props) {
  const [monto, setMonto] = useState(saldo.toFixed(2))
  const [fecha, setFecha] = useState(hoyISO())
  const [medio, setMedio] = useState('')
  const [operacion, setOperacion] = useState('')
  const [intentado, setIntentado] = useState(false)
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

  // Se compara en céntimos para que 4209.301 no pase como 4209.30.
  const texto = monto.trim()
  const centimos = FORMATO_MONTO.test(texto) ? Math.round(Number(texto.replace(',', '.')) * 100) : NaN
  const saldoCentimos = Math.round(saldo * 100)

  const errorMonto =
    texto === '' ? 'Ingresa un monto.'
    : Number.isNaN(centimos) ? 'Usa solo números, con 2 decimales como máximo (ej. 1500.50).'
    : centimos <= 0 ? 'El monto debe ser mayor a cero.'
    : centimos > saldoCentimos ? `No puede superar el saldo (${formatearMoneda(saldo, moneda)}).`
    : undefined
  const errorFecha = !fecha ? 'Indica la fecha del pago.' : fecha > hoyISO() ? 'La fecha no puede ser futura.' : undefined
  const errorMedio = !medio ? 'Elige el medio de pago.' : undefined
  const hayErrores = !!(errorMonto || errorFecha || errorMedio)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="pago-titulo"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setIntentado(true)
          if (hayErrores) return
          onConfirm({
            montoPagado: centimos / 100,
            fechaPago: fecha,
            medioPago: medio,
            numeroOperacion: operacion.trim() || undefined,
          })
        }}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
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

        <div className="mt-5 flex flex-col gap-4">
          {/* El monto se valida mientras se escribe; el resto, al intentar guardar. */}
          <Campo id="pago-monto" label={`Monto pagado (${moneda})`} error={errorMonto}>
            <input
              ref={inputRef}
              id="pago-monto"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              aria-invalid={!!errorMonto}
              aria-describedby={describedBy('pago-monto', { error: errorMonto })}
              className={`${inputFormClass} tabular-nums`}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo id="pago-fecha" label="Fecha del pago" error={intentado ? errorFecha : undefined}>
              <input
                id="pago-fecha"
                type="date"
                value={fecha}
                max={hoyISO()}
                onChange={(e) => setFecha(e.target.value)}
                aria-invalid={intentado && !!errorFecha}
                aria-describedby={describedBy('pago-fecha', { error: intentado && errorFecha })}
                className={inputFormClass}
              />
            </Campo>
            <Campo id="pago-medio" label="Medio de pago" error={intentado ? errorMedio : undefined}>
              <select
                id="pago-medio"
                value={medio}
                onChange={(e) => setMedio(e.target.value)}
                aria-invalid={intentado && !!errorMedio}
                aria-describedby={describedBy('pago-medio', { error: intentado && errorMedio })}
                className={inputFormClass}
              >
                <option value="" disabled>Elegir…</option>
                {MEDIOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Campo>
          </div>

          <Campo id="pago-operacion" label="N.° de operación" opcional>
            <input
              id="pago-operacion"
              type="text"
              maxLength={40}
              autoComplete="off"
              value={operacion}
              onChange={(e) => setOperacion(e.target.value)}
              placeholder="Ej. 004512873"
              className={inputFormClass}
            />
          </Campo>
        </div>

        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading || !!errorMonto}>{isLoading ? 'Guardando…' : 'Registrar pago'}</Button>
        </div>
      </form>
    </div>
  )
}