import { FormProvider, useForm } from 'react-hook-form'
import { unirLugarExtranjero } from '@/lib/terceroExtranjero'
import { armarNombrePersona } from '@/lib/persona'
import { zodResolver } from '@hookform/resolvers/zod'
import { proveedorSchema, type ProveedorFormValues } from '../../../lib/validators/rucDni.schema'
import type { ProveedorRequest } from '../../../types/proveedor.types'
import { CamposTercero } from './CamposTercero'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'

interface Props { defaultValues?: Partial<ProveedorFormValues>; onSubmit: (data: ProveedorRequest) => void; isSubmitting?: boolean; serverError?: string }

export function ProveedorForm({ defaultValues, onSubmit, isSubmitting, serverError }: Props) {
  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    mode: 'onBlur',
    defaultValues: {
      tercero: { idTipoDocumento: 1, idDistrito: undefined, numeroDocumento: undefined, razonSocial: '', direccion: '', telefono: '', correo: '' },
      situacion: 'ACTIVO',
      ...defaultValues,
    },
  })

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((d) => {
          const limpio = unirLugarExtranjero(d)
          const persona = limpio.tercero.idTipoDocumento !== 1
          const razonSocial = persona ? armarNombrePersona(limpio.tercero) : limpio.tercero.razonSocial.trim()
          onSubmit({
            situacion: limpio.situacion,
            tercero: {
              idTipoDocumento: limpio.tercero.idTipoDocumento,
              idDistrito: Number(limpio.tercero.idDistrito),
              numeroDocumento: limpio.tercero.numeroDocumento,
              razonSocial,
              direccion: limpio.tercero.direccion,
              telefono: limpio.tercero.telefono,
              correo: limpio.tercero.correo,
            },
          })
        })}
        className="flex flex-col gap-5"
        noValidate
      >
        <CamposTercero separarNombres />

        {serverError && <ErrorBanner message={serverError} />}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar proveedor'}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
