// src/features/cotizaciones/components/CotizacionDetalleForm.tsx

import React, { useCallback } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema';
import { formatearMoneda, calcularSubtotal, calcularTotalConMargen } from '@/lib/formatters/codigoCotizacion';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface CotizacionDetalleFormProps {
  moneda: string;
}

// Inputs compactos de la tabla de ítems (mismos tokens que los formularios)
const celdaInput =
  'h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive';

/** Líneas de la cotización: descripción, cantidad, precio y margen. */
export const CotizacionDetalleForm: React.FC<CotizacionDetalleFormProps> = ({ moneda }) => {
  const { control, register, formState: { errors } } = useFormContext<CrearCotizacionFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });
  const detalles = useWatch({ control, name: 'detalles' });

  const agregarDetalle = useCallback(() => {
    append({ producto: '', cantidad: 1, precioUnitario: 0, margenPorcentaje: 0, subtotal: 0 });
  }, [append]);

  const errorGeneral = typeof errors.detalles?.message === 'string' ? errors.detalles.message : errors.detalles?.root?.message;

  return (
    <section aria-labelledby="items-form-t" className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div>
          <h2 id="items-form-t" className="text-base font-semibold text-foreground">
            Ítems <span className="font-normal tabular-nums text-muted-foreground">({fields.length})</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Repuestos o servicios que incluye la cotización.</p>
        </div>
        {fields.length > 0 && (
          <Button type="button" variant="outline" onClick={agregarDetalle}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar ítem
          </Button>
        )}
      </div>

      {errorGeneral && (
        <p role="alert" className="mx-5 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">
          {errorGeneral === 'Debe agregar al menos un detalle' ? 'Agrega al menos un ítem a la cotización.' : errorGeneral}
        </p>
      )}

      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-t border-border px-4 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent" aria-hidden="true">
            <Package className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">Aún no hay ítems en esta cotización.</p>
          <Button type="button" onClick={agregarDetalle}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar el primer ítem
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <caption className="sr-only">Ítems de la cotización</caption>
            <thead>
              <tr className="border-y border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium sm:pl-6">Descripción</th>
                <th className="w-24 px-2 py-2.5 text-right font-medium">Cant.</th>
                <th className="w-32 px-2 py-2.5 text-right font-medium">P. unitario</th>
                <th className="w-24 px-2 py-2.5 text-right font-medium">Margen %</th>
                <th className="w-32 px-2 py-2.5 text-right font-medium">Subtotal</th>
                <th className="w-12 px-2 py-2.5 sm:pr-4"><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const d = detalles?.[index];
                const subtotal = d ? calcularSubtotal(d.cantidad || 0, d.precioUnitario || 0) : 0;
                const margen = d ? calcularTotalConMargen(subtotal, d.margenPorcentaje || 0) - subtotal : 0;
                const err = errors.detalles?.[index];
                const n = index + 1;
                return (
                  <tr key={field.id} className="border-t border-border align-top first:border-t-0">
                    <td className="px-5 py-2.5 sm:pl-6">
                      <input
                        {...register(`detalles.${index}.producto`)}
                        placeholder="Placa de desgaste para chancadora"
                        aria-label={`Descripción del ítem ${n}`}
                        aria-invalid={!!err?.producto}
                        className={celdaInput}
                      />
                      {err?.producto && <p className="mt-1 text-xs text-destructive">{err.producto.message}</p>}
                    </td>
                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        {...register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                        aria-label={`Cantidad del ítem ${n}`}
                        aria-invalid={!!err?.cantidad}
                        className={cn(celdaInput, 'text-right tabular-nums')}
                      />
                      {err?.cantidad && <p className="mt-1 text-xs text-destructive">{err.cantidad.message}</p>}
                    </td>
                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...register(`detalles.${index}.precioUnitario`, { valueAsNumber: true })}
                        aria-label={`Precio unitario del ítem ${n}`}
                        aria-invalid={!!err?.precioUnitario}
                        className={cn(celdaInput, 'text-right tabular-nums')}
                      />
                      {err?.precioUnitario && <p className="mt-1 text-xs text-destructive">{err.precioUnitario.message}</p>}
                    </td>
                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        inputMode="decimal"
                        {...register(`detalles.${index}.margenPorcentaje`, { valueAsNumber: true })}
                        aria-label={`Margen del ítem ${n} en porcentaje`}
                        aria-invalid={!!err?.margenPorcentaje}
                        className={cn(celdaInput, 'text-right tabular-nums')}
                      />
                      {err?.margenPorcentaje && <p className="mt-1 text-xs text-destructive">{err.margenPorcentaje.message}</p>}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <p className="h-9 leading-9 font-medium tabular-nums">{formatearMoneda(subtotal, moneda)}</p>
                      {margen > 0 && <p className="text-xs tabular-nums text-success">+{formatearMoneda(margen, moneda)} margen</p>}
                    </td>
                    <td className="px-2 py-2.5 text-right sm:pr-4">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Quitar el ítem ${n}`}
                        title="Quitar ítem"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
