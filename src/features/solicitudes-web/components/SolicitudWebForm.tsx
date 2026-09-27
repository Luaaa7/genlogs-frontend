// src/features/solicitudes-web/components/SolicitudWebForm.tsx

import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { crearSolicitudWebSchema, type CrearSolicitudWebFormData } from '@/lib/validators/solicitudWeb.schema';
import { useCrearSolicitudWeb } from '../hooks/useCrearSolicitudWeb';
import { Trash2, Plus, Loader2, CheckCircle } from 'lucide-react';

interface SolicitudWebFormProps {
  onSuccess?: () => void;
}

export const SolicitudWebForm: React.FC<SolicitudWebFormProps> = ({
  onSuccess,
}) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<CrearSolicitudWebFormData>({
    resolver: zodResolver(crearSolicitudWebSchema),
    mode: 'onChange',
    defaultValues: {
      nombreContacto: '',
      email: '',
      telefono: '',
      empresaNombre: '',
      ruc: '',
      ciudadUbicacion: '',
      direccion: '',
      descripcionNecesidad: '',
      presupuestoAproximado: undefined,
      tiempoEntregaRequerido: '',
      detalles: [{ descripcion: '', cantidad: 1, especificaciones: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'detalles',
  });

  const { mutate: crearSolicitud, isPending, isSuccess } =
    useCrearSolicitudWeb();

  const onSubmit = (data: CrearSolicitudWebFormData) => {
    crearSolicitud(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Solicitud Enviada Exitosamente!
        </h3>
        <p className="text-gray-600 mb-2">
          Hemos recibido tu solicitud de cotización
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Nuestro equipo de ventas te contactará dentro de 24 horas para
          proporcionar una cotización personalizada.
        </p>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Enviar Nueva Solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Sección de Contacto */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Información de Contacto
          </h2>
          <p className="text-gray-600 mt-1">
            Déjanos tus datos para poder asistirte mejor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <Controller
              name="nombreContacto"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Juan Pérez"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.nombreContacto
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.nombreContacto && (
              <p className="mt-1 text-sm text-red-600">
                {errors.nombreContacto.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico *
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  placeholder="juan@empresa.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.email
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="tel"
                  placeholder="+51 (1) 2345-6789"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.telefono
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">
                {errors.telefono.message}
              </p>
            )}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad *
            </label>
            <Controller
              name="ciudadUbicacion"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Lima, Ica, Arequipa..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.ciudadUbicacion
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.ciudadUbicacion && (
              <p className="mt-1 text-sm text-red-600">
                {errors.ciudadUbicacion.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa
            </label>
            <Controller
              name="empresaNombre"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  value={field.value || ''}
                  placeholder="Tu empresa (opcional)"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.empresaNombre
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}
            />
          </div>

          {/* RUC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUC (Opcional)
            </label>
            <Controller
              name="ruc"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  value={field.value || ''}
                  placeholder="12345678901"
                  maxLength={11}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.ruc
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.ruc && (
              <p className="mt-1 text-sm text-red-600">
                {errors.ruc.message}
              </p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección (Opcional)
          </label>
          <Controller
            name="direccion"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                value={field.value || ''}
                placeholder="Av. Principal 123, Apt 456"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.direccion
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
            )}
          />
        </div>
      </div>

      {/* Sección de Necesidades */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Descripción de tu Necesidad
          </h2>
          <p className="text-gray-600 mt-1">
            Cuéntanos qué productos o servicios requieres
          </p>
        </div>

        {/* Descripción General */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción de la Necesidad *
          </label>
          <Controller
            name="descripcionNecesidad"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={5}
                placeholder="Por favor, describe detalladamente qué necesitas. Incluye especificaciones, cantidades aproximadas y cualquier requisito especial."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${
                  errors.descripcionNecesidad
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
            )}
          />
          {errors.descripcionNecesidad && (
            <p className="mt-1 text-sm text-red-600">
              {errors.descripcionNecesidad.message}
            </p>
          )}
        </div>

        {/* Detalles Adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto Aproximado (Opcional)
            </label>
            <Controller
              name="presupuestoAproximado"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="50000"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de Entrega Requerido (Opcional)
            </label>
            <Controller
              name="tiempoEntregaRequerido"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="">-- Selecciona --</option>
                  <option value="urgente">Urgente (1-2 semanas)</option>
                  <option value="normal">Normal (2-4 semanas)</option>
                  <option value="flexible">Flexible (Más de un mes)</option>
                </select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Detalles de Productos/Servicios */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Productos o Servicios Específicos
            </h2>
            <p className="text-gray-600 mt-1">
              Detalla cada uno de los artículos que necesitas
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              append({
                descripcion: '',
                cantidad: 1,
                especificaciones: '',
              })
            }
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Línea
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Sin detalles agregados</p>
            <button
              type="button"
              onClick={() =>
                append({
                  descripcion: '',
                  cantidad: 1,
                  especificaciones: '',
                })
              }
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Detalle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    Línea {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <Controller
                    name={`detalles.${index}.descripcion`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Ej: Válvula de control de presión"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                          errors?.detalles?.[index]?.descripcion
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    )}
                  />
                  {errors?.detalles?.[index]?.descripcion && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.detalles[index]?.descripcion?.message}
                    </p>
                  )}
                </div>

                {/* Cantidad y Especificaciones */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <Controller
                      name={`detalles.${index}.cantidad`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especificaciones
                    </label>
                    <Controller
                      name={`detalles.${index}.especificaciones`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          value={field.value || ''}
                          placeholder="Ej: Tamaño 2 pulgadas"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.detalles && (
          <p className="text-sm text-red-600">
            {typeof errors.detalles.message === 'string'
              ? errors.detalles.message
              : 'Error en los detalles'}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Solicitud'
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">✓ 100% Seguro:</span> Tus datos están
          protegidos y solo serán usados para preparar tu cotización
        </p>
      </div>
    </form>
  );
};
