import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema'
import { FormularioCotizacion } from '../components/FormularioCotizacion'

/** Nueva cotización. El formulario vive en FormularioCotizacion, compartido con la edición. */
export const NuevaCotizacionPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const clienteDeUrl = Number(searchParams.get('cliente'))
  const valoresIniciales = {
    clienteId: Number.isInteger(clienteDeUrl) && clienteDeUrl > 0 ? clienteDeUrl : undefined,
    condicionPago: undefined,
    moneda: undefined,
    observaciones: '',
    detalles: [],
  } as unknown as CrearCotizacionFormData

  return <FormularioCotizacion modo="crear" valoresIniciales={valoresIniciales} />
}
