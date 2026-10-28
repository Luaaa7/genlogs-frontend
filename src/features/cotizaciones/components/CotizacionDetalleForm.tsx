// src/features/cotizaciones/components/CotizacionDetalleForm.tsx

import React, { useCallback } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema';
import { formatearMoneda, calcularSubtotal, calcularTotalConMargen } from '@/lib/formatters/codigoCotizacion';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2 } from 'lucide-react';
import { MarcaObligatorio } from '@/components/ui/campo';
import { cn } from '@/lib/utils/utils';
import { SelectorCatalogoItem, type ItemCatalogo } from './SelectorCatalogoItem';

interface CotizacionDetalleFormProps {
  moneda: string;
}

// Inputs compactos de las líneas (mismos tokens que los formularios)
const celdaInput =
  'h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive';

// Columnas en pantallas anchas: ítem | cantidad | precio | margen | subtotal | quitar.
// Se decide por el ancho de esta tarjeta (container query), no por el de la ventana.
const COLUMNAS = '@2xl:grid-cols-[minmax(0,1fr)_5rem_7rem_5rem_7.5rem_2.5rem]';

// Etiqueta visible solo cuando la línea va apilada; en ancho amplio la dan los encabezados.
const etiquetaApilada = 'mb-1 block text-xs text-muted-foreground @2xl:sr-only';

/** Líneas de la cotización: producto o servicio del catálogo, cantidad, precio y margen. */
export const CotizacionDetalleForm: React.FC<CotizacionDetalleFormProps> = ({ moneda }) => {
  const { control, register, setValue, formState: { errors } } = useFormContext<CrearCotizacionFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });
  const detalles = useWatch({ control, name: 'detalles' });

  const agregarDetalle = useCallback(() => {
    append({ producto: '', cantidad: 1, precioUnitario: 0, margenPorcentaje: 0, subtotal: 0 });
  }, [append]);

  // Al escribir se pierde el vínculo con el catálogo hasta que se elija una opción.
  const escribirItem = (index: number, texto: string) => {
    setValue(`detalles.${index}.producto`, texto, { shouldDirty: true });
    setValue(`detalles.${index}.idProducto`, undefined, { shouldDirty: true });
    setValue(`detalles.${index}.idServicio`, undefined, { shouldDirty: true });
    setValue(`detalles.${index}.idUnidadMedida`, undefined, { shouldDirty: true });
  };

  const elegirItem = (index: number, item: ItemCatalogo) => {
    const opciones = { shouldDirty: true, shouldValidate: true } as const;
    setValue(`detalles.${index}.producto`, item.nombre, opciones);
    setValue(`detalles.${index}.idProducto`, item.tipo === 'producto' ? item.id : undefined, opciones);
    setValue(`detalles.${index}.idServicio`, item.tipo === 'servicio' ? item.id : undefined, opciones);
    setValue(`detalles.${index}.idUnidadMedida`, item.idUnidadMedida, opciones);
  };

  const errorGeneral = typeof errors.detalles?.message === 'string' ? errors.detalles.message : errors.detalles?.root?.message;

  return (
    <section aria-labelledby="items-form-t" className="@container rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div>
          <h2 id="items-form-t" className="text-base font-semibold text-foreground">
            Ítems <span className="font-normal tabular-nums text-muted-foreground">({fields.length})</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Productos o servicios del catálogo que incluye la cotización.</p>
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
        <div>
          {/* Encabezados: solo en ancho amplio; apilado, cada campo trae su etiqueta */}
          <div
            aria-hidden="true"
            className={cn('hidden gap-x-2 border-y border-border px-5 py-2.5 text-xs font-medium text-muted-foreground sm:px-6 @2xl:grid', COLUMNAS)}
          >
            <span>Producto o servicio<MarcaObligatorio /></span>
            <span className="text-right">Cantidad<MarcaObligatorio /></span>
            <span className="text-right">Precio unitario<MarcaObligatorio /></span>
            <span className="text-right">Margen %</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>

          <ul>
            {fields.map((field, index) => {
              const d = detalles?.[index];
              const subtotal = d ? calcularSubtotal(d.cantidad || 0, d.precioUnitario || 0) : 0;
              const margen = d ? calcularTotalConMargen(subtotal, d.margenPorcentaje || 0) - subtotal : 0;
              const err = errors.detalles?.[index];
              const n = index + 1;
              return (
                <li
                  key={field.id}
                  className={cn(
                    'grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border px-5 py-3.5 first:border-t-0 sm:px-6 @2xl:items-start @2xl:gap-x-2',
                    COLUMNAS,
                  )}
                >
                  <div className="col-span-2 @2xl:col-span-1">
                    <span className={etiquetaApilada}>Producto o servicio<MarcaObligatorio /></span>
                    <SelectorCatalogoItem
                      valor={d?.producto ?? ''}
                      seleccionado={d?.idProducto !== undefined || d?.idServicio !== undefined}
                      onEscribir={(texto) => escribirItem(index, texto)}
                      onSeleccionar={(item) => elegirItem(index, item)}
                      ariaLabel={`Producto o servicio del ítem ${n}`}
                      invalido={!!err?.producto}
                    />
                    {err?.producto && <p className="mt-1 text-xs text-destructive">{err.producto.message}</p>}
                  </div>

                  <div>
                    <span className={etiquetaApilada}>Cantidad<MarcaObligatorio /></span>
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
                  </div>

                  <div>
                    <span className={etiquetaApilada}>Precio unitario<MarcaObligatorio /></span>
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
                  </div>

                  <div>
                    <span className={etiquetaApilada}>Margen %</span>
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
                  </div>

                  <div className="text-right">
                    <span className={etiquetaApilada}>Subtotal</span>
                    <p className="h-9 leading-9 font-medium tabular-nums">{formatearMoneda(subtotal, moneda)}</p>
                    {margen > 0 && <p className="text-xs tabular-nums text-success">+{formatearMoneda(margen, moneda)} margen</p>}
                  </div>

                  <div className="col-span-2 flex justify-end @2xl:col-span-1">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Quitar el ítem ${n}`}
                      title="Quitar ítem"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};
