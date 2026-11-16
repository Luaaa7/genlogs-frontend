import type { Cliente } from '@/types/cliente.types'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema'
import { CondicionPago, Moneda } from '@/types/cotizacion.types'
import { mapearCondicionPago } from '@/lib/formatters/codigoCotizacion'
import { Campo, MarcaObligatorio } from '@/components/ui/campo'
import { describedBy, textareaFormClass } from '@/components/ui/campoEstilos'
import { cn } from '@/lib/utils/utils'
import { ClienteBuscador } from './ClienteBuscador'

interface CotizacionFormProps {
  clientes: Cliente[]
  isLoadingClientes?: boolean
  /**
   * SUPUESTO a confirmar con el equipo: en edición la moneda queda fija
   * para no desalinear el tipo de cambio ya guardado. El cliente sí se cambia.
   * Para revertirlo, no pases monedaBloqueada.
   */
  monedaBloqueada?: boolean
}

// El sistema solo trabaja con soles y dólares.
const MONEDAS: Record<string, string> = { PEN: 'Soles (S/)', USD: 'Dólares ($)' }

/** Grupo de opciones tipo "tarjeta" (radio) para valores cortos. */
function OpcionesRadio<T extends string>({ name, legend, opciones, valor, onChange, error, columnas, disabled, ayudaId }: {
  name: string
  legend: string
  opciones: { valor: T; label: string }[]
  valor?: T
  onChange: (v: T) => void
  error?: string
  columnas: string
  disabled?: boolean
  ayudaId?: string
}) {
  const descrito = [error ? `${name}-error` : null, ayudaId].filter(Boolean).join(' ') || undefined
  return (
    <fieldset aria-describedby={descrito}>
      <legend className="mb-1.5 text-sm font-medium text-foreground">{legend}<MarcaObligatorio /></legend>
      <div className={cn('grid gap-2', columnas)}>
        {opciones.map((o) => (
          <label
            key={o.valor}
            className={cn(
              'flex h-10 items-center gap-2.5 rounded-md border px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
              valor === o.valor ? 'border-accent bg-accent/10 font-medium text-foreground' : 'border-input text-foreground hover:bg-muted'
            )}
          >
            <input type="radio" name={name} required checked={valor === o.valor} disabled={disabled} aria-describedby={descrito} onChange={() => onChange(o.valor)} className="accent-[var(--accent)]" />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-destructive">{error}</p>}
    </fieldset>
  )
}

/** Datos generales de la cotización: cliente, condiciones y observaciones. */
export const CotizacionForm: React.FC<CotizacionFormProps> = ({ clientes, isLoadingClientes = false, monedaBloqueada = false }) => {
  const { control, formState: { errors } } = useFormContext<CrearCotizacionFormData>()

  return (
    <section aria-labelledby="datos-generales-t" className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="datos-generales-t" className="text-base font-semibold text-foreground">Datos generales</h2>
        <p className="text-xs text-muted-foreground"><span className="text-destructive" aria-hidden="true">*</span> Obligatorio</p>
      </div>

      <Campo id="cot-cliente" label="Cliente" obligatorio error={errors.clienteId?.message} ayuda="Busca por RUC, DNI o razón social. Si no es cliente, puedes registrarlo aquí mismo.">
        <Controller
          name="clienteId"
          control={control}
          render={({ field }) => (
            <ClienteBuscador
              id="cot-cliente"
              clientes={clientes}
              isLoading={isLoadingClientes}
              value={field.value ? Number(field.value) : undefined}
              onChange={field.onChange}
              invalid={!!errors.clienteId}
              describedBy={describedBy('cot-cliente', { error: errors.clienteId, ayuda: true })}
            />
          )}
        />
      </Campo>

      <Controller
        name="condicionPago"
        control={control}
        render={({ field }) => (
          <OpcionesRadio
            name="cot-pago"
            legend="Condición de pago"
            opciones={Object.values(CondicionPago).map((c) => ({ valor: c, label: mapearCondicionPago(c) }))}
            valor={field.value}
            onChange={field.onChange}
            error={errors.condicionPago?.message}
            columnas="grid-cols-2 sm:grid-cols-3"
          />
        )}
      />

      <Controller
        name="moneda"
        control={control}
        render={({ field }) => (
          <>
            <OpcionesRadio
              name="cot-moneda"
              legend="Moneda"
              opciones={Object.values(Moneda).map((m) => ({ valor: m, label: MONEDAS[m] ?? m }))}
              valor={field.value}
              onChange={field.onChange}
              error={errors.moneda?.message}
              columnas="grid-cols-1 sm:grid-cols-3"
              disabled={monedaBloqueada}
              ayudaId={monedaBloqueada ? 'cot-moneda-ayuda' : undefined}
            />
            {monedaBloqueada && (
              <p id="cot-moneda-ayuda" className="mt-1.5 text-xs text-muted-foreground">
                La moneda no se puede cambiar al editar un borrador. Para cotizar en otra moneda, duplica la cotización.
              </p>
            )}
          </>
        )}
      />

      <Campo id="cot-observaciones" label="Observaciones" opcional error={errors.observaciones?.message} ayuda="Condiciones de entrega, alcance del servicio u otras notas para el cliente.">
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <textarea
              id="cot-observaciones"
              {...field}
              value={field.value || ''}
              rows={3}
              aria-describedby={describedBy('cot-observaciones', { error: errors.observaciones, ayuda: true })}
              className={textareaFormClass}
              placeholder="Incluye traslado a unidad minera."
            />
          )}
        />
      </Campo>
    </section>
  )
}