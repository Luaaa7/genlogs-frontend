import { FormProvider, useForm } from 'react-hook-form'
import { unirLugarExtranjero } from '@/lib/terceroExtranjero'
import { zodResolver } from '@hookform/resolvers/zod'
import { proveedorSchema, type ProveedorFormValues } from '../../../lib/validators/rucDni.schema'
import { CamposTercero } from './CamposTercero'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'

interface Props { defaultValues?: Partial<ProveedorFormValues>; onSubmit: (data: ProveedorFormValues) => void; isSubmitting?: boolean; serverError?: string }

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
      <form onSubmit={form.handleSubmit((d) => onSubmit(unirLugarExtranjero(d)))} className="flex flex-col gap-5" noValidate>
        <CamposTercero />

        {serverError && <ErrorBanner message={serverError} />}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar proveedor'}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
