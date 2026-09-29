// src/features/cotizaciones/pages/NuevaCotizacionPage.tsx

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { crearCotizacionSchema, type CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema';
import { useCrearCotizacion } from '../hooks/useCrearCotizacion';
import { CotizacionForm } from '../components/CotizacionForm';
import { CotizacionDetalleForm } from '../components/CotizacionDetalleForm';
import { ArrowLeft, Save, Loader2, CheckCircle } from 'lucide-react';
import { useClientes } from '@/features/clientes-proveedores/hooks/useClientes';



export const NuevaCotizacionPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'detalles' | 'success'>('info');
  
  // FIX: Usar hook real en lugar de mock
  const { data: clientes = [], isLoading: cargandoClientes } = useClientes({});

  const methods = useForm<CrearCotizacionFormData>({
    resolver: zodResolver(crearCotizacionSchema),
    mode: 'onChange',
    defaultValues: {
      clienteId: undefined as number | undefined,
      condicionPago: undefined,
      moneda: undefined,
      observaciones: '',
      detalles: [],
    },
  });

  const { mutate: crearCotizacion, isPending, isSuccess, data: cotizacionCreada } =
    useCrearCotizacion();

  const moneda = methods.watch('moneda');

  const handlePrimerPaso = async () => {
    const isValid = await methods.trigger(['clienteId', 'condicionPago', 'moneda'] as const);
    if (isValid) {
      setStep('detalles');
    }
  };

  const onSubmit = (data: CrearCotizacionFormData) => {
    crearCotizacion(data);
  };

  if (step === 'success' && isSuccess && cotizacionCreada) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Cotización Creada!
          </h2>
          <p className="text-gray-600 mb-2">
            La cotización <span className="font-semibold">{cotizacionCreada.codigo}</span> ha sido
            creada exitosamente
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Total: {cotizacionCreada.moneda} {cotizacionCreada.total.toFixed(2)}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/cotizaciones')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Ver Todas
            </button>
            <button
              onClick={() =>
                navigate(`/cotizaciones/${cotizacionCreada.id}`)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/cotizaciones')}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Nueva Cotización
            </h1>
            <p className="text-gray-600 mt-1">
              {step === 'info'
                ? 'Paso 1: Información General'
                : 'Paso 2: Detalles de Productos y Servicios'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-4">
          <div
            className={`flex-1 h-2 rounded-full transition ${
              step === 'info' || step === 'detalles'
                ? 'bg-blue-600'
                : 'bg-green-600'
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full transition ${
              step === 'detalles' || step === 'success'
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
          />
        </div>

        {/* Form */}
        <FormProvider<CrearCotizacionFormData> {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {step === 'info' && (
             <CotizacionForm clientes={clientes} isLoadingClientes={cargandoClientes} />
            )}

            {step === 'detalles' && (
              <CotizacionDetalleForm moneda={moneda || 'PEN'} />
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              {step === 'detalles' && (
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Atrás
                </button>
              )}

              {step === 'info' && (
                <button
                  type="button"
                  onClick={handlePrimerPaso}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Siguiente
                </button>
              )}

              {step === 'detalles' && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Crear Cotización
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </FormProvider>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">💡 Consejo:</span> Puedes guardar
            como borrador y continuar más tarde. Los datos se guardarán
            automáticamente en el navegador.
          </p>
        </div>
      </div>
    </div>
  );
};
