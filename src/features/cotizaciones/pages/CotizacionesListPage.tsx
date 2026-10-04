// src/features/cotizaciones/pages/CotizacionesListPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCotizaciones, useCotizacionesEstadisticas } from '../hooks/useCotizaciones';
import { useDuplicarCotizacion } from '../hooks/useCotizacionesMutations';
import { cotizacionesApi } from '@/api/cotizacionesApi';
import {
  EstadoCotizacion,
  Moneda,
  type Cotizacion,
  type CotizacionesFilterParams,
} from '@/types/cotizacion.types';
import {
  formatearMoneda,
  mapearEstadoCotizacion,
  tonoEstadoCotizacion,
} from '@/lib/formatters/codigoCotizacion';
import { formatearFechaCorta, parsearFechaLocal } from '@/lib/formatters/fechaLocal';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows';
import { cn } from '@/lib/utils/utils';
import { ChevronLeft, ChevronRight, Copy, Download, FileText, Loader2, Plus } from 'lucide-react';

/** Filtros por estado, en el orden del flujo comercial. */
const PESTANAS: { estado?: EstadoCotizacion; label: string }[] = [
  { label: 'Todas' },
  { estado: EstadoCotizacion.BORRADOR, label: 'Borrador' },
  { estado: EstadoCotizacion.ENVIADA, label: 'Enviadas' },
  { estado: EstadoCotizacion.EN_NEGOCIACION, label: 'En negociación' },
  { estado: EstadoCotizacion.APROBADA, label: 'Aprobadas' },
  { estado: EstadoCotizacion.RECHAZADA, label: 'Rechazadas' },
  { estado: EstadoCotizacion.VENCIDA, label: 'Vencidas' },
  { estado: EstadoCotizacion.ANULADA, label: 'Anuladas' },
];

const ESTADOS_ABIERTOS = new Set<string>(['BORRADOR', 'ENVIADA', 'EN_NEGOCIACION']);
const TAMANOS = [10, 20, 50];
const selectClass =
  'h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const idDe = (c: Cotizacion) => c.idCotizacion ?? c.id!;
const codigoDe = (c: Cotizacion) => c.codigoCotizacion ?? c.codigo ?? `#${idDe(c)}`;
const estadoDe = (c: Cotizacion) => c.estadoCodigo ?? c.estadoCotizacion;

/** "En 3 días", "Hoy", "Hace 2 días" para la fecha de validez de una cotización abierta. */
function notaVencimiento(c: Cotizacion): { texto: string; clase: string } | null {
  if (!ESTADOS_ABIERTOS.has(estadoDe(c))) return null;
  const fecha = parsearFechaLocal(c.fechaValidez);
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000);
  if (dias < 0) return { texto: dias === -1 ? 'Venció ayer' : `Venció hace ${-dias} días`, clase: 'text-destructive' };
  if (dias === 0) return { texto: 'Vence hoy', clase: 'text-warning-text' };
  if (dias <= 7) return { texto: dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`, clase: 'text-warning-text' };
  return null;
}

/** Páginas visibles alrededor de la actual (máx. 5), para no listar 40 botones. */
function paginasVisibles(actual: number, total: number) {
  const inicio = Math.max(0, Math.min(actual - 2, total - 5));
  return Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
}

export const CotizacionesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<CotizacionesFilterParams>({
    page: 0,
    size: 10,
    sortBy: 'fechaCreacion',
    sortDir: 'DESC',
  });
  const [descargando, setDescargando] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useCotizaciones(filtros);
  const { data: estadisticas } = useCotizacionesEstadisticas();
  const { mutate: duplicarCotizacion, isPending: isDuplicarPending } = useDuplicarCotizacion();

  const cambiarFiltros = (nuevos: Partial<CotizacionesFilterParams>) =>
    setFiltros((prev) => ({ ...prev, ...nuevos, page: 0 }));

  const handleDuplicar = (c: Cotizacion) => {
    setErrorAccion(null);
    duplicarCotizacion(idDe(c), {
      onSuccess: (copia) => navigate(`/cotizaciones/${copia.idCotizacion ?? copia.id}`),
      onError: () => setErrorAccion(`No se pudo duplicar ${codigoDe(c)}. Inténtalo de nuevo.`),
    });
  };

  const handleDescargar = async (c: Cotizacion) => {
    setErrorAccion(null);
    setDescargando(idDe(c));
    try {
      const pdf = await cotizacionesApi.descargarCotizacionPDF(idDe(c));
      const url = URL.createObjectURL(pdf);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `${codigoDe(c)}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorAccion(`No se pudo descargar el PDF de ${codigoDe(c)}.`);
    } finally {
      setDescargando(null);
    }
  };

  const contenido = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPaginas = data?.totalPages ?? 0;
  const pagina = filtros.page ?? 0;
  const tamano = filtros.size ?? 10;
  const desde = total === 0 ? 0 : pagina * tamano + 1;
  const hasta = pagina * tamano + contenido.length;
  const conteo = (estado?: string) =>
    estado ? estadisticas?.totalPorEstado?.[estado] : estadisticas?.totalCotizaciones;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado: título con contexto y una sola acción principal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cotizaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {estadisticas
              ? <><span className="tabular-nums">{estadisticas.totalCotizaciones}</span> cotizaciones · <span className="tabular-nums">{formatearMoneda(estadisticas.montoTotalPendiente)}</span> pendiente de aprobación</>
              : 'Cotizaciones a clientes y su seguimiento'}
          </p>
        </div>
        <Button asChild>
          <Link to="/cotizaciones/nueva">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva cotización
          </Link>
        </Button>
      </div>

      {/* Filtro por estado */}
      <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {PESTANAS.map((p) => {
          const activa = filtros.estadoCotizacion === p.estado;
          const n = conteo(p.estado);
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={activa}
              onClick={() => cambiarFiltros({ estadoCotizacion: p.estado })}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activa
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              {p.label}
              {n !== undefined && (
                <span className={cn('tabular-nums', activa ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {(isError || errorAccion) && (
        <ErrorBanner
          message={errorAccion ?? (error instanceof Error ? `No se pudieron cargar las cotizaciones: ${error.message}` : 'No se pudieron cargar las cotizaciones.')}
          onRetry={errorAccion ? undefined : () => refetch()}
        />
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Barra de filtros secundarios */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <label className="sr-only" htmlFor="cot-moneda">Moneda</label>
          <select
            id="cot-moneda"
            value={filtros.moneda ?? ''}
            onChange={(e) => cambiarFiltros({ moneda: (e.target.value as Moneda) || undefined })}
            className={selectClass}
          >
            <option value="">Todas las monedas</option>
            {Object.values(Moneda).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <label className="sr-only" htmlFor="cot-orden">Ordenar por</label>
          <select
            id="cot-orden"
            value={filtros.sortDir ?? 'DESC'}
            onChange={(e) => cambiarFiltros({ sortDir: e.target.value as 'ASC' | 'DESC' })}
            className={selectClass}
          >
            <option value="DESC">Más recientes primero</option>
            <option value="ASC">Más antiguas primero</option>
          </select>
        </div>

        {!isLoading && !isError && contenido.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <FileText className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold">
              {filtros.estadoCotizacion || filtros.moneda ? 'No hay cotizaciones con estos filtros' : 'Aún no hay cotizaciones'}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {filtros.estadoCotizacion || filtros.moneda
                ? 'Prueba con otro estado o moneda, o crea una nueva.'
                : 'Crea la primera para empezar a hacer seguimiento a tus clientes.'}
            </p>
            <Button asChild className="mt-2">
              <Link to="/cotizaciones/nueva"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Nueva cotización</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Lista de cotizaciones</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Código</th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Emitida</th>
                  <th className="px-4 py-2.5 font-medium">Vence</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonRows columns={7} rows={tamano > 10 ? 10 : tamano} />
                ) : (
                  contenido.map((c) => {
                    const nota = notaVencimiento(c);
                    const estado = estadoDe(c);
                    return (
                      <tr key={idDe(c)} className="border-t border-border first:border-t-0 hover:bg-muted/60">
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link to={`/cotizaciones/${idDe(c)}`} className="rounded font-medium tabular-nums text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {codigoDe(c)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{c.clienteNombre ?? c.cliente ?? '—'}</p>
                          {c.clienteEmail && <p className="text-xs text-muted-foreground">{c.clienteEmail}</p>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatearFechaCorta(c.fechaCotizacion ?? c.fechaCreacion)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="tabular-nums">{formatearFechaCorta(c.fechaValidez)}</p>
                          {nota && <p className={cn('text-xs', nota.clase)}>{nota.texto}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge tono={tonoEstadoCotizacion(estado)}>{mapearEstadoCotizacion(estado)}</EstadoBadge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                          {formatearMoneda(c.total ?? 0, c.monedaCodigo ?? c.moneda ?? 'PEN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicar(c)}
                              disabled={isDuplicarPending}
                              aria-label={`Duplicar ${codigoDe(c)}`}
                              title="Duplicar"
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDescargar(c)}
                              disabled={descargando === idDe(c)}
                              aria-label={`Descargar PDF de ${codigoDe(c)}`}
                              title="Descargar PDF"
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {descargando === idDe(c)
                                ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                : <Download className="h-4 w-4" aria-hidden="true" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie: rango, tamaño de página y paginación */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13px]">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>Mostrando <span className="tabular-nums">{desde}–{hasta}</span> de <span className="tabular-nums">{total}</span></span>
              <label className="sr-only" htmlFor="cot-tamano">Filas por página</label>
              <select
                id="cot-tamano"
                value={tamano}
                onChange={(e) => cambiarFiltros({ size: Number(e.target.value) })}
                className={cn(selectClass, 'h-8 px-2 text-[13px]')}
              >
                {TAMANOS.map((t) => <option key={t} value={t}>{t} por página</option>)}
              </select>
            </div>
            {totalPaginas > 1 && (
              <nav aria-label="Paginación" className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setFiltros((f) => ({ ...f, page: pagina - 1 }))} disabled={pagina === 0} aria-label="Página anterior">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                {paginasVisibles(pagina, totalPaginas).map((i) => (
                  <Button
                    key={i}
                    variant={i === pagina ? 'default' : 'ghost'}
                    size="sm"
                    aria-current={i === pagina ? 'page' : undefined}
                    onClick={() => setFiltros((f) => ({ ...f, page: i }))}
                    className="min-w-9 tabular-nums"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setFiltros((f) => ({ ...f, page: pagina + 1 }))} disabled={pagina >= totalPaginas - 1} aria-label="Página siguiente">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
