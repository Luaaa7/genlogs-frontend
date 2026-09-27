// src/features/cotizaciones/components/CotizacionForm.tsx

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { CrearCotizacionFormData } from "@/lib/validators/cotizacion.schema";
import { CondicionPago, Moneda } from '@/types/cotizacion.types';
import { mapearCondicionPago } from '@/lib/formatters/codigoCotizacion';

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  empresa?: string;
}

interface CotizacionFormProps {
  clientes: Cliente[];
  isLoadingClientes?: boolean;
}

export const CotizacionForm: React.FC<CotizacionFormProps> = ({
  clientes,
  isLoadingClientes = false,
}) => {
  const { control, formState: { errors } } = useFormContext<CrearCotizacionFormData>();

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información de la Cotización
        </h2>
        <p className="text-sm text-gray-600">
          Selecciona el cliente y configura las condiciones generales
        </p>
      </div>

      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cliente *
        </label>
        <Controller
          name="clienteId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value ? String(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              disabled={isLoadingClientes}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.clienteId
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <option value="">-- Selecciona un cliente --</option>
              {isLoadingClientes ? (
                <option disabled>Cargando clientes...</option>
              ) : (
                clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                    {cliente.empresa ? ` (${cliente.empresa})` : ''}
                  </option>
                ))
              )}
            </select>
          )}
        />
        {errors.clienteId && (
          <p className="mt-1 text-sm text-red-600">{errors.clienteId.message}</p>
        )}
      </div>

      {/* Condición de Pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condición de Pago *
        </label>
        <Controller
          name="condicionPago"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(CondicionPago).map((condicion) => (
                <label
                  key={condicion}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    field.value === condicion
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    {...field}
                    value={condicion}
                    checked={field.value === condicion}
                    onChange={() => field.onChange(condicion)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {mapearCondicionPago(condicion)}
                  </span>
                </label>
              ))}
            </div>
          )}
        />
        {errors.condicionPago && (
          <p className="mt-2 text-sm text-red-600">
            {errors.condicionPago.message}
          </p>
        )}
      </div>

      {/* Moneda */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Moneda *
        </label>
        <Controller
          name="moneda"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {Object.values(Moneda).map((moneda) => (
                <label
                  key={moneda}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition text-center ${
                    field.value === moneda
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    {...field}
                    value={moneda}
                    checked={field.value === moneda}
                    onChange={() => field.onChange(moneda)}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {moneda}
                  </span>
                </label>
              ))}
            </div>
          )}
        />
        {errors.moneda && (
          <p className="mt-2 text-sm text-red-600">{errors.moneda.message}</p>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones
        </label>
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <div>
              <textarea
                {...field}
                value={field.value || ''}
                rows={4}
                placeholder="Notas adicionales sobre la cotización (opcional)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${
                  errors.observaciones
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {field.value && (
                <p className="mt-1 text-xs text-gray-500">
                  {field.value.length}/1000
                </p>
              )}
            </div>
          )}
        />
        {errors.observaciones && (
          <p className="mt-1 text-sm text-red-600">
            {errors.observaciones.message}
          </p>
        )}
      </div>

      {/* Info adicional */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">💡 Consejo:</span> Puedes agregar los
          detalles de productos y servicios en el siguiente paso. Los cálculos
          de subtotal e IGV se realizarán automáticamente.
        </p>
      </div>
    </div>
  );
};