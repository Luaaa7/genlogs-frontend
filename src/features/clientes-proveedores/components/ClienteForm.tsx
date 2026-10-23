import { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { clienteSchema, type ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import type { ClienteRequest } from '../../../types/cliente.types'
import { listarSectoresEconomicos } from '@/api/sectoresEconomicosApi'
import { CamposTercero } from './CamposTercero'
import { Campo, SeccionForm } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'

interface Props { onSubmit: (data: ClienteRequest) => void; isSubmitting?: boolean; serverError?: string }

export function ClienteForm({ onSubmit, isSubmitting, serverError }: Props) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    mode: 'onBlur',
    defaultValues: {
      tercero: { idTipoDocumento: 1, idDistrito: undefined, numeroDocumento: undefined, razonSocial: '', direccion: '', telefono: '', correo: '' },
      idSectorEconomico: 1,
      situacion: 'ACTIVO',
    },
  })
  const { register, handleSubmit, formState: { errors } } = form
  const { data: sectores = [] } = useQuery({ queryKey: ['sectores-economicos'], queryFn: listarSectoresEconomicos, staleTime: 10 * 60_000 })

  // Catálogo del backend + opción "Alimentario": si el catálogo ya la incluye
  // se usa su id real (evitando duplicarla); si no, se añade con el siguiente
  // id disponible.
  const opcionesSector = useMemo(() => {
    const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (sectores.some((s) => normalizar(s.nombreSector).includes('alimentario'))) return sectores
    const idProvisional = sectores.reduce((max, s) => Math.max(max, s.idSectorEconomico), 0) + 1
    return [...sectores, { idSectorEconomico: idProvisional, nombreSector: 'Alimentario' }]
  }, [sectores])

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((d) => onSubmit(d as ClienteRequest))} className="flex flex-col gap-5" noValidate>
        <CamposTercero />

        <SeccionForm titulo="Clasificación">
          <Campo id="cliente-sector" label="Sector económico" error={errors.idSectorEconomico?.message}>
            {sectores.length > 0 ? (
              <select
                id="cliente-sector"
                {...register('idSectorEconomico', { valueAsNumber: true })}
                aria-invalid={!!errors.idSectorEconomico}
                aria-describedby={describedBy('cliente-sector', { error: errors.idSectorEconomico })}
                className={inputFormClass}
              >
                {opcionesSector.map((s) => <option key={s.idSectorEconomico} value={s.idSectorEconomico}>{s.nombreSector}</option>)}
              </select>
            ) : (
              // Sin catálogo de sectores disponible: se ingresa el código
              <input id="cliente-sector" type="number" min={1} {...register('idSectorEconomico', { valueAsNumber: true })} className={`${inputFormClass} max-w-40`} />
            )}
          </Campo>
        </SeccionForm>

        {serverError && <ErrorBanner message={serverError} />}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar cliente'}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
