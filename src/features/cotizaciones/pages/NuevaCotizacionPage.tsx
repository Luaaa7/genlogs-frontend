// src/features/cotizaciones/pages/NuevaCotizacionPage.tsx

import React, { useState } from 'react';
import { useForm, useWatch, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmarCotizacionModal } from '../components/ConfirmarCotizacionModal';
import { CotizacionCreadaModal } from '../components/CotizacionCreadaModal';
import { crearCotizacionSchema, type CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema';
import { useCrearCotizacion } from '../hooks/useCrearCotizacion';
import { CotizacionForm } from '../components/CotizacionForm';
import { CotizacionDetalleForm } from '../components/CotizacionDetalleForm';
import { useClientes } from '@/features/clientes-proveedores/hooks/useClientes';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { calcularSubtotal, formatearMoneda, mapearCondicionPago } from '@/lib/formatters/codigoCotizacion';
import type { CreateCotizacionRequest } from '@/types/cotizacion.types';
import { Loader2 } from 'lucide-react';
import { avisar } from '@/lib/avisos';
import { useIgvVigente } from '@/features/configuracion/hooks/useIgv';
import { mensajeError } from '@/lib/errores'


/** Nueva cotización en una sola pantalla: datos generales e ítems a la
 *  izquierda; resumen con el total y la acción de crear, fijo a la derecha. */
export const NuevaCotizacionPage: React.FC = () => {
  const navigate = useNavigate();
  // Desde la ficha del cliente se llega con ?cliente=ID: ese cliente ya queda elegido (#74).
  const [searchParams] = useSearchParams();
  const clienteDeUrl = Number(searchParams.get('cliente'));
  const { data: clientes = [], isLoading: cargandoClientes } = useClientes({});

  const valoresIniciales = {
    clienteId: Number.isInteger(clienteDeUrl) && clienteDeUrl > 0 ? clienteDeUrl : (undefined as number | undefined),
    condicionPago: undefined,
    moneda: undefined,
    observaciones: '',
    detalles: [],
  };
  const methods = useForm<CrearCotizacionFormData>({
    resolver: zodResolver(crearCotizacionSchema),
    mode: 'onTouched',
    defaultValues: valoresIniciales,
  });
  // Ventanas: primero se revisa el resumen; al guardar, aviso de éxito.
  const [porConfirmar, setPorConfirmar] = useState<CrearCotizacionFormData | null>(null);
  const [creada, setCreada] = useState<{ id: number; codigo: string } | null>(null);

  const { mutate: crearCotizacion, isPending, isError, error } = useCrearCotizacion();
  // La tasa que rige hoy (configurable por el administrador en IGV).
  const { porcentaje: porcentajeIgv } = useIgvVigente();

  const [clienteId, moneda, condicionPago, detalles] = useWatch({
    control: methods.control,
    name: ['clienteId', 'moneda', 'condicionPago', 'detalles'],
  });
  const monedaActual = moneda || 'PEN';
  const subtotal = (detalles ?? []).reduce((s, d) => s + calcularSubtotal(d?.cantidad || 0, d?.precioUnitario || 0), 0);
  const igv = subtotal * (porcentajeIgv / 100);
  const cliente = clientes.find((c) => (c.idCliente ?? c.id) === clienteId);

  // Lo mínimo para poder crear: mientras falte algo, el botón queda desactivado
  // y se dice qué falta (el detalle de cada error sale en su campo al enviar).
  const items = detalles ?? [];
  const faltantes = [
    !clienteId && 'cliente',
    !condicionPago && 'condición de pago',
    !moneda && 'moneda',
    items.length === 0 && 'al menos un ítem',
    items.some((d) => d?.idProducto === undefined && d?.idServicio === undefined) && 'producto o servicio de cada ítem',
    items.some((d) => !(Number(d?.precioUnitario) > 0)) && 'precio de los ítems',
    items.some((d) => !(Number(d?.cantidad) >= 1)) && 'cantidad de los ítems',
  ].filter(Boolean) as string[];

  const onSubmit = (data: CrearCotizacionFormData) => setPorConfirmar(data);

  const confirmar = () => {
    if (!porConfirmar) return;
    crearCotizacion(porConfirmar as unknown as CreateCotizacionRequest, {
      onSuccess: (nueva) => {
        avisar('Cotización registrada correctamente como borrador');
        setPorConfirmar(null);
        const idNueva = (nueva.idCotizacion ?? nueva.id) as number;
        setCreada({ id: idNueva, codigo: nueva.codigoCotizacion ?? `#${idNueva}` });
      },
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
              <dt className="text-muted-foreground">IGV ({porcentajeIgv.toLocaleString('es-PE', { maximumFractionDigits: 2 })}%)</dt>
              <dd className="text-right tabular-nums">{formatearMoneda(igv, monedaActual)}</dd>
              <dt className="text-base font-semibold">Total</dt>
              <dd className="text-right text-base font-semibold tabular-nums">{formatearMoneda(subtotal + igv, monedaActual)}</dd>
            </dl>


            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isPending || faltantes.length > 0} aria-describedby={faltantes.length ? 'cot-faltantes' : undefined} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                Revisar y crear
              </Button>
              {faltantes.length > 0 && (
                <p id="cot-faltantes" className="text-center text-xs text-muted-foreground">
                  Falta: {faltantes.join(', ')}.
                </p>
              )}
              <Button variant="ghost" asChild className="w-full">
                <Link to="/cotizaciones">Cancelar</Link>
              </Button>
            </div>
          </aside>
        </form>
      </FormProvider>

      {porConfirmar && (
        <ConfirmarCotizacionModal
          cliente={cliente?.tercero.razonSocial ?? '—'}
          condicion={porConfirmar.condicionPago ? mapearCondicionPago(porConfirmar.condicionPago) : '—'}
          moneda={porConfirmar.moneda}
          observaciones={porConfirmar.observaciones}
          items={porConfirmar.detalles.map((d) => ({
            producto: d.producto,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: calcularSubtotal(d.cantidad || 0, d.precioUnitario || 0),
          }))}
          subtotal={subtotal}
          igv={igv}
          porcentajeIgv={porcentajeIgv}
          isPending={isPending}
          error={isError ? mensajeError(error, 'No se pudo crear la cotización. Revisa los datos e inténtalo de nuevo.') : undefined}
          onConfirmar={confirmar}
          onVolver={() => setPorConfirmar(null)}
        />
      )}

      {creada && (
        <CotizacionCreadaModal
          id={creada.id}
          codigo={creada.codigo}
          onVer={() => navigate(`/cotizaciones/${creada.id}`)}
          onOtra={() => {
            methods.reset(valoresIniciales);
            setCreada(null);
          }}
        />
      )}
    </div>
  );
};