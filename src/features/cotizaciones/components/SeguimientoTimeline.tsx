// src/features/cotizaciones/components/SeguimientoTimeline.tsx

import React from 'react';
import { EstadoCotizacion } from "@/types/cotizacion.types";
import type { SeguimientoCotizacion } from "@/types/cotizacion.types";
import { formatearFechaHora, mapearEstadoCotizacion, colorEstadoCotizacion } from '@/lib/formatters/codigoCotizacion';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface SeguimientoTimelineProps {
  seguimientos?: SeguimientoCotizacion[];
  estadoActual: EstadoCotizacion;
}

export const SeguimientoTimeline: React.FC<SeguimientoTimelineProps> = ({
  seguimientos = [],
  estadoActual,
}) => {
  const getSeguimientoIcon = (estado: EstadoCotizacion) => {
    switch (estado) {
      case EstadoCotizacion.APROBADA:
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case EstadoCotizacion.RECHAZADA:
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case EstadoCotizacion.CADUCADA:
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      default:
        return <Clock className="w-6 h-6 text-blue-600" />;
    }
  };

  const sortedSeguimientos = [...(seguimientos || [])].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Historial y Seguimiento
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Registro de cambios de estado de la cotización
        </p>
      </div>

      {sortedSeguimientos.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Sin historial de cambios. Esta es la cotización inicial.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedSeguimientos.map((seguimiento, index) => (
            <div key={seguimiento.id || index} className="flex gap-4">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className="relative z-10">
                  {getSeguimientoIcon(seguimiento.estadoNuevo)}
                </div>
                {index < sortedSeguimientos.length - 1 && (
                  <div className="w-1 h-16 bg-gray-300 mt-2"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {mapearEstadoCotizacion(seguimiento.estadoAnterior)}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span
                        className={`font-semibold px-2 py-1 rounded ${colorEstadoCotizacion(
                          seguimiento.estadoNuevo
                        )}`}
                      >
                        {mapearEstadoCotizacion(seguimiento.estadoNuevo)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatearFechaHora(seguimiento.fecha)}
                    </p>
                  </div>
                </div>

                {seguimiento.usuarioNombre && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Por:</span>{' '}
                    {seguimiento.usuarioNombre}
                  </p>
                )}

                {seguimiento.observaciones && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm text-gray-700">
                      {seguimiento.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current status */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm text-blue-600 font-medium">
              Estado actual de la cotización
            </p>
            <p className={`text-lg font-bold mt-1 ${colorEstadoCotizacion(estadoActual)}`}>
              {mapearEstadoCotizacion(estadoActual)}
            </p>
          </div>
          {getSeguimientoIcon(estadoActual)}
        </div>
      </div>
    </div>
  );
};
