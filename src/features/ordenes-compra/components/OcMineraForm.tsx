import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import type { ConfirmarOcCliente, OrdenCompra } from '@/types/ordenCompra.types'
import { montosDistintos } from '../lib/montosOc'

const schema = z.object({
  numeroOcCliente: z.string().trim().min(1, 'Indica el N.º de OC de la minera.'),
  fechaEmisionCliente: z.string().min(1, 'Indica la fecha de la OC.'),
  montoOcCliente: z.string().trim().refine((valor) => /^\d+([.,]\d+)?$/.test(valor), 'El monto debe ser numérico.'),
})

type Campos = z.infer<typeof schema>

interface Props {
  orden: OrdenCompra
  puedeEditar: boolean
  confirmando?: boolean
  error?: string | null
  onConfirmar: (body: ConfirmarOcCliente) => void
}

export function OcMineraForm({ orden, puedeEditar, confirmando = false, error, onConfirmar }: Props) {
  const moneda = orden.moneda ?? 'PEN'
  const distinto = montosDistintos(orden.montoOcCliente, orden.total)
  const { register, handleSubmit, formState: { errors } } = useForm<Campos>({
    resolver: zodResolver(schema),
    defaultValues: {
      numeroOcCliente: orden.numeroOcCliente ?? '',
      fechaEmisionCliente: orden.fechaEmisionCliente ?? '',
      montoOcCliente: orden.montoOcCliente == null ? '' : String(orden.montoOcCliente),
    },
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((valores) => onConfirmar({
      numeroOcCliente: valores.numeroOcCliente.trim(),
      fechaEmisionCliente: valores.fechaEmisionCliente,
      montoOcCliente: Number(valores.montoOcCliente.replace(',', '.')),
    }))}>
      {distinto && (
        <div role="status" className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-text">
          <p className="font-medium">El monto leído no coincide con el total</p>
          <p className="mt-1">
            OC de la minera: {formatearMoneda(orden.montoOcCliente as number, moneda)}. Total de la cotización: {formatearMoneda(orden.total, moneda)}.
          </p>
        </div>
      )}
      {puedeEditar ? (
        <>
          <Campo id="oc-numero" label="N.º de OC de la minera" error={errors.numeroOcCliente?.message}>
            <input id="oc-numero" className={inputFormClass} aria-invalid={!!errors.numeroOcCliente} {...register('numeroOcCliente')} />
          </Campo>
          <Campo id="oc-fecha" label="Fecha de emisión" error={errors.fechaEmisionCliente?.message}>
            <input id="oc-fecha" type="date" className={inputFormClass} aria-invalid={!!errors.fechaEmisionCliente} {...register('fechaEmisionCliente')} />
          </Campo>
          <Campo id="oc-monto" label="Monto" error={errors.montoOcCliente?.message}>
            <input id="oc-monto" inputMode="decimal" className={inputFormClass} aria-invalid={!!errors.montoOcCliente} {...register('montoOcCliente')} />
          </Campo>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={confirmando}>Confirmar</Button>
          </div>
        </>
      ) : (
        <dl className="grid gap-3 text-sm">
          <div><dt className="text-muted-foreground">N.º de OC de la minera</dt><dd className="mt-0.5 font-medium">{orden.numeroOcCliente || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Fecha de emisión</dt><dd className="mt-0.5 tabular-nums">{formatearFechaCorta(orden.fechaEmisionCliente)}</dd></div>
          <div><dt className="text-muted-foreground">Monto</dt><dd className="mt-0.5 tabular-nums">{orden.montoOcCliente == null ? '—' : formatearMoneda(orden.montoOcCliente, moneda)}</dd></div>
        </dl>
      )}
    </form>
  )
}

function Campo({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-foreground" htmlFor={id}>
      {label}
      {children}
      {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
    </label>
  )
}
