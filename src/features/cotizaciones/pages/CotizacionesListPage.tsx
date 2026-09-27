// src/features/cotizaciones/pages/CotizacionesListPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { useDuplicarCotizacion } from '../hooks/useCotizacionesMutations';
import {
  EstadoCotizacion,
  Moneda,
  type CotizacionesFilterParams,
} from '@/types/cotizacion.types';
import {
  formatearMoneda,
  mapearEstadoCotizacion,
  formatearFecha,
  colorEstadoCotizacion,
} from '@/lib/formatters/codigoCotizacion';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

export const CotizacionesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<CotizacionesFilterParams>({
    page: 0,
    size: 10,
    sortBy: 'fechaCreacion',
    sortDir: 'DESC',
  });

  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading, error } = useCotizaciones(filtros);
  const { mutate: duplicarCotizacion, isPending: isDuplicarPending } =
    useDuplicarCotizacion();

  const handleFilterChange = (newFiltros: Partial<CotizacionesFilterParams>) => {
    setFiltros((prev) => ({
      ...prev,
      ...newFiltros,
      page: 0, // Reset a primera página al cambiar filtros
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFiltros((prev) => ({ ...prev, page: newPage }));
  };

  const handleDuplicar = (id: number) => {
    duplicarCotizacion(id, {
      onSuccess: (data) => {
        navigate(`/cotizaciones/${data.id}/editar`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus cotizaciones y seguimiento de clientes
              </p>
            </div>
            <button
              onClick={() => navigate('/cotizaciones/nueva')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Cotización
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros {filtros.estadoCotizacion && '(1)'}
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filtros.estadoCotizacion || ''}
                  onChange={(e) =>
                    handleFilterChange({
                      estadoCotizacion: (e.target.value as EstadoCotizacion) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Todos los estados</option>
                  {Object.values(EstadoCotizacion).map((estado) => (
                    <option key={estado} value={estado}>
                      {mapearEstadoCotizacion(estado)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={filtros.moneda || ''}
                  onChange={(e) =>
                    handleFilterChange({ moneda: (e.target.value as Moneda) || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Todas las monedas</option>
                  {Object.values(Moneda).map((moneda) => (
                    <option key={moneda} value={moneda}>
                      {moneda}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={filtros.sortDir || 'DESC'}
                  onChange={(e) =>
                    handleFilterChange({
                      sortDir: (e.target.value as 'ASC' | 'DESC'),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="DESC">Más recientes</option>
                  <option value="ASC">Más antiguos</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Error al cargar cotizaciones
              </h3>
              <p className="text-red-700">
                {error instanceof Error ? error.message : 'Intenta recargar la página'}
              </p>
            </div>
          </div>
        ) : data && data.content.length > 0 ? (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((cotizacion) => (
                      <tr
                        key={cotizacion.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-gray-900">
                            {cotizacion.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {cotizacion.clienteNombre}
                            </p>
                            <p className="text-xs text-gray-600">
                              {cotizacion.clienteEmail}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorEstadoCotizacion(
                              cotizacion.estadoCotizacion
                            )}`}
                          >
                            {mapearEstadoCotizacion(
                              cotizacion.estadoCotizacion
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {formatearMoneda(cotizacion.total, cotizacion.moneda)}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {formatearFecha(cotizacion.fechaCreacion || '')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                navigate(`/cotizaciones/${cotizacion.id}`)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicar(cotizacion.id!)}
                              disabled={isDuplicarPending}
                              className="p-2 text-green-600 hover:bg-green-50 disabled:opacity-50 rounded-lg transition"
                              title="Duplicar"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando {data.content.length} de {data.totalElements} cotizaciones
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(filtros.page! - 1)}
                    disabled={filtros.page === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: data.totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-1 rounded-lg transition ${
                          filtros.page === i
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(filtros.page! + 1)}
                    disabled={filtros.page! >= data.totalPages - 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin cotizaciones
            </h3>
            <p className="text-gray-600 mb-6">
              No hay cotizaciones disponibles con los filtros seleccionados
            </p>
            <button
              onClick={() => navigate('/cotizaciones/nueva')}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Cotización
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
