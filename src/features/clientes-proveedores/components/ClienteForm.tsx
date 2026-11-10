import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import type { ClienteRequest } from '../../../types/cliente.types'
import { CamposTercero } from './CamposTercero'
import type { TipoDocumentoId } from '../constants/tiposDocumento'
import { unirLugarExtranjero } from '@/lib/terceroExtranjero'
import { prepararNombreTercero } from '@/lib/nombreTercero'
import { LeyendaObligatorio, ResumenFaltantes } from '@/components/ui/campo'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'

interface Props {
  onSubmit: (data: ClienteRequest) => void
  isSubmitting?: boolean
  serverError?: string
  /** Valores iniciales para modo edición */
  valoresIniciales?: Partial<ClienteFormValues>
  /**
   * Tipo de documento elegido antes de abrir el formulario (pestaña RUC, DNI
   * o Pasaporte). Con él solo se muestra la página de ese documento.
   */
  tipoFijo?: TipoDocumentoId
}

/**
 * Formulario del cliente: solo los datos del documento (RUC, DNI o pasaporte).
 * La sección "Clasificación" ya no se muestra: el sector económico se envía
 * igual, porque el backend lo pide. Al crear va el sector 1; al editar se
 * conserva el que ya tenía el cliente.
 */
export function ClienteForm({ onSubmit, isSubmitting, serverError, valoresIniciales, tipoFijo }: Props) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    mode: 'onBlur',
    defaultValues: {
      idSectorEconomico: 1,
      situacion: 'ACTIVO',
      ...valoresIniciales,
      // Después de valoresIniciales: si solo trae parte del tercero (p. ej. el tipo), el resto queda vacío y no indefinido.
      tercero: {
        idTipoDocumento: 1,
        idDistrito: undefined,
        numeroDocumento: '',
        razonSocial: '',
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        direccion: '',
        telefono: '',
        correo: '',
        ...valoresIniciales?.tercero,
        ...(tipoFijo ? { idTipoDocumento: tipoFijo } : {}),
      },
    },
  })
  const { handleSubmit, formState: { errors } } = form

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((d) => onSubmit(prepararNombreTercero(unirLugarExtranjero(d)) as ClienteRequest))} className="flex flex-col gap-5" noValidate>
        <LeyendaObligatorio />
        <ResumenFaltantes
          errors={errors}
          etiquetas={{ 'tercero.idTipoDocumento': 'Tipo de documento', 'tercero.numeroDocumento': 'Número de documento', 'tercero.razonSocial': 'Razón social', 'tercero.nombres': 'Nombres', 'tercero.apellidoPaterno': 'Apellido paterno', 'tercero.apellidoMaterno': 'Apellido materno', 'tercero.direccion': 'Dirección', 'tercero.idDistrito': 'Distrito', 'tercero.lugarExtranjero': 'Ciudad y país', 'tercero.correo': 'Correo', 'tercero.telefono': 'Teléfono' }}
        />
        <CamposTercero tipoFijo={tipoFijo} />

        {serverError && <ErrorBanner message={serverError} />}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar cliente'}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
