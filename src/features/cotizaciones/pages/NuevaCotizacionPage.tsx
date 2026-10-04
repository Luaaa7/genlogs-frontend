// src/features/cotizaciones/pages/NuevaCotizacionPage.tsx

import React from 'react';
import { useForm, useWatch, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { crearCotizacionSchema, type CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema';
import { useCrearCotizacion } from '../hooks/useCrearCotizacion';
import { CotizacionForm } from '../components/CotizacionForm';
import { CotizacionDetalleForm } from '../components/CotizacionDetalleForm';
import { useClientes } from '@/features/clientes-proveedores/hooks/useClientes';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Button } from '@/components/ui/button';
import { calcularSubtotal, formatearMoneda, mapearCondicionPago } from '@/lib/formatters/codigoCotizacion';
import type { CreateCotizacionRequest } from '@/types/cotizacion.types';
import { Loader2 } from 'lucide-react';

const IGV = 0.18;

/** Nueva cotización en una sola pantalla: datos generales e ítems a la
 *  izquierda; resumen con el total y la acción de crear, fijo a la derecha. */
export const NuevaCotizacionPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: clientes = [], isLoading: cargandoClientes } = useClientes({});

  const methods = useForm<CrearCotizacionFormData>({
    resolver: zodResolver(crearCotizacionSchema),
    mode: 'onTouched',
    defaultValues: {
      clienteId: undefined as number | undefined,
      condicionPago: undefined,
      moneda: undefined,
      observaciones: '',
      detalles: [],
    },
  });

  const { mutate: crearCotizacion, isPending, isError, error } = useCrearCotizacion();

  const [clienteId, moneda, condicionPago, detalles] = useWatch({
    control: methods.control,
    name: ['clienteId', 'moneda', 'condicionPago', 'detalles'],
  });
  const monedaActual = moneda || 'PEN';
  const subtotal = (detalles ?? []).reduce((s, d) => s + calcularSubtotal(d?.cantidad || 0, d?.precioUnitario || 0), 0);
  const igv = subtotal * IGV;
  const cliente = clientes.find((c) => (c.idCliente ?? c.id) === clienteId);

  const onSubmit = (data: CrearCotizacionFormData) => {
    crearCotizacion(data as unknown as CreateCotizacionRequest, {
      onSuccess: (creada) => navigate(`/cotizaciones/${creada.idCotizacion ?? creada.id}`),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Nueva cotización" descripcion="Completa los datos generales y agrega los ítems; se crea como borrador." />

      <FormProvider<CrearCotizacionFormData> {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <CotizacionForm clientes={clientes} isLoadingClientes={cargandoClientes} />
            <CotizacionDetalleForm moneda={monedaActual} />
          </div>

          {/* Resumen fijo: total y acción principal siempre a la vista */}
          <aside aria-labelledby="resumen-t" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
            <h2 id="resumen-t" className="text-base font-semibold">Resumen</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="text-right">{cliente?.tercero.razonSocial ?? '—'}</dd>
              <dt className="text-muted-foreground">Pago</dt>
              <dd className="text-right">{condicionPago ? mapearCondicionPago(condicionPago) : '—'}</dd>
              <dt className="text-muted-foreground">Ítems</dt>
              <dd className="text-right tabular-nums">{detalles?.length ?? 0}</dd>
            </dl>
            <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-border pt-4 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-right tabular-nums">{formatearMoneda(subtotal, monedaActual)}</dd>
              <dt className="text-muted-foreground">IGV (18%)</dt>
              <dd className="text-right tabular-nums">{formatearMoneda(igv, monedaActual)}</dd>
              <dt className="text-base font-semibold">Total</dt>
              <dd className="text-right text-base font-semibold tabular-nums">{formatearMoneda(subtotal + igv, monedaActual)}</dd>
            </dl>

            {isError && (
              <ErrorBanner message={error?.response?.data?.message ?? 'No se pudo crear la cotización. Revisa los datos e inténtalo de nuevo.'} />
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {isPending ? 'Creando…' : 'Crear cotización'}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/cotizaciones">Cancelar</Link>
              </Button>
            </div>
          </aside>
        </form>
      </FormProvider>
    </div>
  );
};
