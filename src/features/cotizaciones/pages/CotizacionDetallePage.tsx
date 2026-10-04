// src/features/cotizaciones/pages/CotizacionDetallePage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCotizacion } from '../hooks/useCotizaciones';
import { useCambiarEstado } from '../hooks/useCambiarEstado';
import { useDescargarPDF } from '../hooks/useCotizacionesMutations';
import { useOrdenesCompra } from '@/features/ordenes-compra/hooks/useOrdenesCompra';
import { useFacturas } from '@/features/facturacion/hooks/useFacturacion';
import { SeguimientoTimeline } from '../components/SeguimientoTimeline';
import { AdjuntoCotizacionUploader } from '../components/AdjuntoCotizacionUploader';
import { ConfirmacionEnvioModal } from '../components/ConfirmacionEnvioModal';
import { PipelineBreadcrumb, type PipelineStep } from '@/components/ui/PipelineBreadcrumb';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoCotizacion, type Cotizacion } from '@/types/cotizacion.types';
import {
  formatearMoneda,
  mapearEstadoCotizacion,
  mapearCondicionPago,
  tonoEstadoCotizacion,
} from '@/lib/formatters/codigoCotizacion';
import { formatearFechaCorta, parsearFechaLocal } from '@/lib/formatters/fechaLocal';
import { cn } from '@/lib/utils/utils';
import { AlertCircle, Check, ChevronDown, Clock, Download, Loader2, Send, ShoppingCart } from 'lucide-react';

const ESTADOS_ABIERTOS = new Set<string>(['BORRADOR', 'ENVIADA', 'EN_NEGOCIACION']);
/** Estados que se pueden elegir a mano (CADUCADA es alias de VENCIDA). */
const ESTADOS_ELEGIBLES = [...new Set(Object.values(EstadoCotizacion))];

const MENU_ENTRADA = 'origin-top-right animate-in fade-in-0 zoom-in-95 duration-150 ease-out motion-reduce:animate-none';

function vencimiento(c: Cotizacion): { texto: string; tono: 'warning' | 'destructive' } | null {
  if (!ESTADOS_ABIERTOS.has(c.estadoCodigo ?? c.estadoCotizacion)) return null;
  const fecha = parsearFechaLocal(c.fechaValidez);
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000);
  if (dias < 0) return { texto: `Venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}`, tono: 'destructive' };
  if (dias === 0) return { texto: 'Vence hoy', tono: 'warning' };
  if (dias <= 7) return { texto: dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`, tono: 'warning' };
  return null;
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton variant="rectangular" className="h-80 lg:col-span-2" />
        <Skeleton variant="rectangular" className="h-80" />
      </div>
    </div>
  );
}

export const CotizacionDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cotizacionId = id ? Number(id) : null;

  const { data: cotizacion, isLoading, isError, refetch } = useCotizacion(cotizacionId);
  const { mutate: cambiarEstado, isPending: isChangingState } = useCambiarEstado(cotizacionId || 0);
  const { mutate: descargarPDF, isPending: isDownloadingPDF } = useDescargarPDF(
    cotizacionId || 0,
    cotizacion ? `${cotizacion.codigoCotizacion ?? cotizacion.codigo}.pdf` : undefined
  );

  // Para el flujo "Cotización → Orden de compra → Factura": se busca si ya existe
  // una orden generada a partir de esta cotización, y si esa orden ya tiene factura.
  const { data: ordenesData } = useOrdenesCompra();
  const ordenGenerada = ordenesData?.content?.find((o) => o.idCotizacion === cotizacionId);
  const { data: facturasData } = useFacturas();
  const facturaGenerada = facturasData?.content?.find((f) => f.idOrdenCompra === ordenGenerada?.idOrdenCompra);

  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [menuEstado, setMenuEstado] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuEstado) return;
    function cerrar(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuEstado(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuEstado(false);
    }
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', escape);
    };
  }, [menuEstado]);

  const handleCambiarEstado = (nuevo: EstadoCotizacion) => {
    setErrorAccion(null);
    cambiarEstado(
      { estadoNuevo: nuevo, observaciones: '' },
      {
        onSuccess: () => setMenuEstado(false),
        onError: (e) => setErrorAccion(`No se pudo cambiar el estado a "${mapearEstadoCotizacion(nuevo)}". ${e.response?.data?.message ?? ''}`.trim()),
      }
    );
  };

  const handleDescargar = () => {
    setErrorAccion(null);
    descargarPDF(undefined, { onError: () => setErrorAccion('No se pudo descargar el PDF. Inténtalo de nuevo.') });
  };

  if (!cotizacionId) {
    return <ErrorBanner message="El enlace de la cotización no es válido." />;
  }

  if (isLoading) return <DetalleSkeleton />;

  if (isError || !cotizacion) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">No se pudo cargar la cotización</h1>
          <p className="mt-1 text-sm text-muted-foreground">Puede que no exista o que haya un problema de conexión.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/cotizaciones">Volver a cotizaciones</Link></Button>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  const codigo = cotizacion.codigoCotizacion ?? cotizacion.codigo ?? `#${cotizacionId}`;
  const estado = cotizacion.estadoCodigo ?? cotizacion.estadoCotizacion;
  const moneda = cotizacion.monedaCodigo ?? cotizacion.moneda ?? 'PEN';
  const cliente = cotizacion.clienteNombre ?? cotizacion.cliente ?? 'Cliente sin nombre';
  const aviso = vencimiento(cotizacion);
  const detalles = cotizacion.detalles ?? [];

  // Totales: los del servidor; si no vienen, se calculan de las líneas.
  const subtotal = cotizacion.subtotal ?? detalles.reduce((s, d) => s + (d.subtotal || 0), 0);
  const igv = cotizacion.igv ?? subtotal * 0.18;
  const total = cotizacion.total ?? subtotal + igv;

  const pasos: PipelineStep[] = [
    { label: 'Cotización', status: 'current' },
    {
      label: ordenGenerada ? `Orden ${ordenGenerada.numeroOrdenCompra}` : 'Orden de compra',
      status: ordenGenerada ? 'completed' : 'pending',
      href: ordenGenerada ? '/ordenes-compra' : undefined,
    },
    {
      label: facturaGenerada ? `Factura ${facturaGenerada.codigoComprobante}` : 'Factura',
      status: facturaGenerada ? 'completed' : 'pending',
      href: facturaGenerada ? '/facturacion' : undefined,
    },
  ];

  // Una sola acción principal, la que corresponde al momento del flujo.
  let accionPrincipal: React.ReactNode = null;
  if (estado === 'BORRADOR' || estado === 'ENVIADA') {
    accionPrincipal = (
      <Button onClick={() => setShowEnvioModal(true)}>
        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
        {estado === 'BORRADOR' ? 'Enviar al cliente' : 'Reenviar'}
      </Button>
    );
  } else if (estado === 'EN_NEGOCIACION') {
    accionPrincipal = (
      <Button onClick={() => handleCambiarEstado(EstadoCotizacion.APROBADA)} disabled={isChangingState}>
        <Check className="mr-2 h-4 w-4" aria-hidden="true" />
        Marcar como aprobada
      </Button>
    );
  } else if (estado === 'APROBADA' && !ordenGenerada) {
    accionPrincipal = (
      <Button asChild>
        <Link to="/ordenes-compra"><ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />Registrar orden de compra</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado: código, estado y vencimiento; acciones a la derecha */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{codigo}</h1>
            <EstadoBadge tono={tonoEstadoCotizacion(estado)}>{mapearEstadoCotizacion(estado)}</EstadoBadge>
            {aviso && (
              <EstadoBadge tono={aviso.tono}>
                <Clock className="h-3 w-3" aria-hidden="true" />
                {aviso.texto}
              </EstadoBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {cliente} · emitida el {formatearFechaCorta(cotizacion.fechaCotizacion ?? cotizacion.fechaCreacion)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleDescargar} disabled={isDownloadingPDF}>
            {isDownloadingPDF
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
            PDF
          </Button>
          {estado !== 'BORRADOR' && estado !== 'ENVIADA' && (
            <Button variant="outline" onClick={() => setShowEnvioModal(true)}>
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              Enviar
            </Button>
          )}

          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              onClick={() => setMenuEstado((v) => !v)}
              aria-expanded={menuEstado}
              aria-haspopup="menu"
            >
              Cambiar estado
              <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', menuEstado && 'rotate-180')} aria-hidden="true" />
            </Button>
            {menuEstado && (
              <div role="menu" className={cn('absolute right-0 z-20 mt-2 w-52 rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/5', MENU_ENTRADA)}>
                {ESTADOS_ELEGIBLES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    role="menuitemradio"
                    aria-checked={e === estado}
                    disabled={isChangingState || e === estado}
                    onClick={() => handleCambiarEstado(e)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default',
                      e === estado ? 'font-medium text-accent' : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {mapearEstadoCotizacion(e)}
                    {e === estado && <Check className="h-4 w-4" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {accionPrincipal}
        </div>
      </div>

      <PipelineBreadcrumb steps={pasos} />

      {errorAccion && <ErrorBanner message={errorAccion} />}

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <section aria-labelledby="items-t" className="overflow-hidden rounded-xl border border-border bg-card">
            <h2 id="items-t" className="px-5 pt-4 pb-3 text-base font-semibold">
              Ítems <span className="font-normal tabular-nums text-muted-foreground">({detalles.length})</span>
            </h2>
            {detalles.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-muted-foreground">Esta cotización aún no tiene ítems.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-y border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-2.5 font-medium">Descripción</th>
                      <th className="px-5 py-2.5 text-right font-medium">Cant.</th>
                      <th className="px-5 py-2.5 text-right font-medium">P. unitario</th>
                      <th className="px-5 py-2.5 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d, i) => (
                      <tr key={d.idCotizacionDetalle ?? d.id ?? i} className="border-t border-border first:border-t-0">
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">
                            {d.descripcionPersonalizada || d.producto || d.servicio || d.descripcion || 'Ítem'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.idServicio || d.servicio ? 'Servicio' : 'Repuesto'}
                            {d.descuentoUnitario > 0 && ` · descuento ${formatearMoneda(d.descuentoUnitario, moneda)} c/u`}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{d.cantidad}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{formatearMoneda(d.precioUnitario, moneda)}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums">{formatearMoneda(d.subtotal ?? d.importeLinea ?? 0, moneda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <dl className="grid grid-cols-[1fr_auto] justify-items-end gap-x-6 gap-y-2 border-t border-border px-5 py-4 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatearMoneda(subtotal, moneda)}</dd>
              <dt className="text-muted-foreground">IGV (18%)</dt>
              <dd className="tabular-nums">{formatearMoneda(igv, moneda)}</dd>
              <dt className="text-base font-semibold">Total</dt>
              <dd className="text-base font-semibold tabular-nums">{formatearMoneda(total, moneda)}</dd>
            </dl>
          </section>

          <section aria-labelledby="condiciones-t" className="rounded-xl border border-border bg-card p-5">
            <h2 id="condiciones-t" className="mb-4 text-base font-semibold">Condiciones comerciales</h2>
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 text-sm">
              <div><dt className="text-[13px] text-muted-foreground">Forma de pago</dt><dd className="mt-1">{mapearCondicionPago(String(cotizacion.condicionPago))}</dd></div>
              <div><dt className="text-[13px] text-muted-foreground">Moneda</dt><dd className="mt-1">{moneda}</dd></div>
              <div><dt className="text-[13px] text-muted-foreground">Emitida</dt><dd className="mt-1 tabular-nums">{formatearFechaCorta(cotizacion.fechaCotizacion ?? cotizacion.fechaCreacion)}</dd></div>
              <div><dt className="text-[13px] text-muted-foreground">Válida hasta</dt><dd className="mt-1 tabular-nums">{formatearFechaCorta(cotizacion.fechaValidez)}</dd></div>
            </dl>
            {cotizacion.observaciones && (
              <p className="mt-4 max-w-prose text-sm text-muted-foreground">{cotizacion.observaciones}</p>
            )}
          </section>

          <AdjuntoCotizacionUploader
            cotizacionId={cotizacionId}
            adjuntos={cotizacion.adjuntos || []}
            readonly={estado !== EstadoCotizacion.BORRADOR}
          />
        </div>

        {/* Columna lateral */}
        <aside className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="cliente-t" className="rounded-xl border border-border bg-card p-5">
            <h2 id="cliente-t" className="mb-3 text-base font-semibold">Cliente</h2>
            <p className="font-medium">
              <Link to={`/clientes/${cotizacion.idCliente}`} className="rounded text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {cliente}
              </Link>
            </p>
            {cotizacion.clienteEmail && (
              <p className="mt-1 text-sm">
                <a href={`mailto:${cotizacion.clienteEmail}`} className="rounded text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {cotizacion.clienteEmail}
                </a>
              </p>
            )}
          </section>

          <SeguimientoTimeline seguimientos={cotizacion.seguimientos} />
        </aside>
      </div>

      <ConfirmacionEnvioModal
        isOpen={showEnvioModal}
        onClose={() => setShowEnvioModal(false)}
        cotizacionId={cotizacionId}
        emailPredeterminado={cotizacion.clienteEmail}
      />
    </div>
  );
};
