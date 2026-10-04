import type { Cliente } from '@/types/cliente.types'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema'
import { CondicionPago, Moneda } from '@/types/cotizacion.types'
import { mapearCondicionPago } from '@/lib/formatters/codigoCotizacion'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass, textareaFormClass } from '@/components/ui/campoEstilos'
import { cn } from '@/lib/utils/utils'

interface CotizacionFormProps {
  clientes: Cliente[]
  isLoadingClientes?: boolean
}

const MONEDAS: Record<string, string> = { PEN: 'Soles (S/)', USD: 'Dólares (US$)', EUR: 'Euros (€)' }

/** Grupo de opciones tipo "tarjeta" (radio) para valores cortos. */
function OpcionesRadio<T extends string>({ name, legend, opciones, valor, onChange, error, columnas }: {
  name: string
  legend: string
  opciones: { valor: T; label: string }[]
  valor?: T
  onChange: (v: T) => void
  error?: string
  columnas: string
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-foreground">{legend}</legend>
      <div className={cn('grid gap-2', columnas)}>
        {opciones.map((o) => (
          <label
            key={o.valor}
            className={cn(
              'flex h-10 cursor-pointer items-center gap-2.5 rounded-md border px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              valor === o.valor ? 'border-accent bg-accent/10 font-medium text-foreground' : 'border-input text-foreground hover:bg-muted'
            )}
          >
            <input type="radio" name={name} checked={valor === o.valor} onChange={() => onChange(o.valor)} className="accent-[var(--accent)]" />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-destructive">{error}</p>}
    </fieldset>
  )
}

/** Datos generales de la cotización: cliente, condiciones y observaciones. */
export const CotizacionForm: React.FC<CotizacionFormProps> = ({ clientes, isLoadingClientes = false }) => {
  const { control, formState: { errors } } = useFormContext<CrearCotizacionFormData>()

  return (
    <section aria-labelledby="datos-generales-t" className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 id="datos-generales-t" className="text-base font-semibold text-foreground">Datos generales</h2>

      <Campo id="cot-cliente" label="Cliente" error={errors.clienteId?.message} ayuda={clientes.length === 0 && !isLoadingClientes ? 'Aún no hay clientes: regístralo primero en Clientes.' : undefined}>
        <Controller
          name="clienteId"
          control={control}
          render={({ field }) => (
            <select
              id="cot-cliente"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value ? String(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              disabled={isLoadingClientes}
              aria-invalid={!!errors.clienteId}
              aria-describedby={describedBy('cot-cliente', { error: errors.clienteId })}
              className={inputFormClass}
            >
              <option value="">{isLoadingClientes ? 'Cargando clientes…' : 'Selecciona un cliente'}</option>
              {clientes.map((cliente) => (
                <option key={cliente.idCliente ?? cliente.id} value={cliente.idCliente ?? cliente.id}>
                  {cliente.tercero.razonSocial} · {cliente.tercero.numeroDocumento}
                </option>
              ))}
            </select>
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
          <OpcionesRadio
            name="cot-moneda"
            legend="Moneda"
            opciones={Object.values(Moneda).map((m) => ({ valor: m, label: MONEDAS[m] ?? m }))}
            valor={field.value}
            onChange={field.onChange}
            error={errors.moneda?.message}
            columnas="grid-cols-1 sm:grid-cols-3"
          />
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
