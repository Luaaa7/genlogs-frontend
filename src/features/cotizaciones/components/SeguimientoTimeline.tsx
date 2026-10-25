// src/features/cotizaciones/components/SeguimientoTimeline.tsx

import React from 'react';
import type { SeguimientoCotizacion } from '@/types/cotizacion.types';
import { formatearFechaHora, mapearEstadoCotizacion } from '@/lib/formatters/codigoCotizacion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface SeguimientoTimelineProps {
  seguimientos?: SeguimientoCotizacion[];
}

/** Historial de cambios de estado, del más reciente al más antiguo. El estado
 *  actual ya se ve en el encabezado de la página: aquí solo va el recorrido. */
export const SeguimientoTimeline: React.FC<SeguimientoTimelineProps> = ({ seguimientos = [] }) => {
  const ordenados = [...seguimientos].sort(
    (a, b) => new Date(b.fecha ?? b.fechaEvento).getTime() - new Date(a.fecha ?? a.fechaEvento).getTime()
  );

  return (
    <section aria-labelledby="seguimiento-t" className="rounded-xl border border-border bg-card p-5">
      <h2 id="seguimiento-t" className="mb-4 text-base font-semibold text-foreground">Seguimiento</h2>

      {ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cambios de estado todavía.</p>
      ) : (
        <ol className="flex flex-col">
          {ordenados.map((s, i) => {
            const negativo = s.estadoNuevo === 'RECHAZADA' || s.estadoNuevo === 'ANULADA';
            const ultimo = i === ordenados.length - 1;
            const nota = s.observaciones || s.comentario;
            return (
              <li key={s.idSeguimiento ?? s.id ?? i} className="grid grid-cols-[20px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      negativo ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                    )}
                    aria-hidden="true"
                  >
                    {negativo ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </span>
                  {!ultimo && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                </div>
                <div className={cn('min-w-0', !ultimo && 'pb-4')}>
                  <p className="text-sm font-medium text-foreground">
                    {s.estadoAnterior ? `${mapearEstadoCotizacion(s.estadoAnterior)} → ` : ''}
                    {mapearEstadoCotizacion(s.estadoNuevo)}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {formatearFechaHora(s.fecha ?? s.fechaEvento)}
                    {s.usuarioNombre ? ` · ${s.usuarioNombre}` : ''}
                  </p>
                  {nota && <p className="mt-1 text-[13px] text-foreground">{nota}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
