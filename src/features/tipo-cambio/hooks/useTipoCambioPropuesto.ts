import { useTipoCambio } from './useTipoCambio'

/** Lo que el alta en USD manda al backend, y lo que el FE-2 reutilizará en el ítem. */
export interface TipoCambioPropuesto {
  valor: number
  /** yyyy-mm-dd, la misma cadena de TipoCambioDia.fecha. */
  fecha: string
  esDeHoy: boolean
  cargando: boolean
  /** true cuando el backend respondió 404: no hay ningún tipo de cambio guardado. */
  sinDato: boolean
}

/**
 * En USD, el tipo de cambio vigente (o el último guardado). En PEN, null:
 * esa cotización no propone cambio.
 */
export function useTipoCambioPropuesto(moneda: string | undefined): TipoCambioPropuesto | null {
  const consulta = useTipoCambio()
  if (moneda !== 'USD') return null
  if (consulta.isPending) {
    return { valor: 0, fecha: '', esDeHoy: false, cargando: true, sinDato: false }
  }
  if (consulta.data == null) {
    return { valor: 0, fecha: '', esDeHoy: false, cargando: false, sinDato: true }
  }
  return {
    valor: consulta.data.valor,
    fecha: consulta.data.fecha,
    esDeHoy: consulta.data.esDeHoy,
    cargando: false,
    sinDato: false,
  }
}
