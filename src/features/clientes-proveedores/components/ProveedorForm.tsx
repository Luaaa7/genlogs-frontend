import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { proveedorSchema, type ProveedorFormValues } from '../../../lib/validators/rucDni.schema'
import { useConsultarDocumento } from '../hooks/useConsultarDocumento'

interface Props { defaultValues?: Partial<ProveedorFormValues>; onSubmit: (data: ProveedorFormValues) => void; isSubmitting?: boolean; serverError?: string }

const input = 'w-full rounded border border-border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

export function ProveedorForm({ defaultValues, onSubmit, isSubmitting, serverError }: Props) {
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      tercero: { idTipoDocumento: 1, idDistrito: 1, numeroDocumento: '', razonSocial: '', direccion: '', telefono: '', correo: '' },
      situacion: 'ACTIVO',
      ...defaultValues,
    },
  })

  // Autocompletado RUC/DNI (RF-08): consulta Factiliza vía el backend y
  // precarga razón social y dirección con lo que devuelva.
  const consultarDocumento = useConsultarDocumento()

  const handleBuscarDocumento = async () => {
    const numero = getValues('tercero.numeroDocumento')?.trim()
    if (!numero || !/^\d{8}$|^\d{11}$/.test(numero)) return

    try {
      const datos = await consultarDocumento.mutateAsync(numero)
      if (datos.razonSocial) setValue('tercero.razonSocial', datos.razonSocial)
      if (datos.direccion) setValue('tercero.direccion', datos.direccion)
    } catch {
      // El error se muestra más abajo con consultarDocumento.isError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Tipo
          <select {...register('tercero.idTipoDocumento', { valueAsNumber: true })} className={input}>
            <option value={1}>RUC</option>
            <option value={2}>DNI</option>
            <option value={3}>CE</option>
            <option value={4}>Pasaporte</option>
          </select>
        </label>
        <label className="text-sm">
          ID distrito
          <input {...register('tercero.idDistrito', { valueAsNumber: true })} type="number" min={1} className={input} />
        </label>
      </div>

      <label className="block text-sm">
        RUC/DNI
        <div className="flex gap-2">
          <input {...register('tercero.numeroDocumento')} className={input} />
          <button
            type="button"
            onClick={handleBuscarDocumento}
            disabled={consultarDocumento.isPending}
            className="whitespace-nowrap rounded border border-border px-3 py-2 text-sm hover:bg-accent/10 disabled:opacity-50"
          >
            {consultarDocumento.isPending ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {errors.tercero?.numeroDocumento && <span className="text-xs text-destructive">{errors.tercero.numeroDocumento.message}</span>}
        {consultarDocumento.isError && <span className="text-xs text-destructive">No se pudo consultar el documento</span>}
        {consultarDocumento.data?.simulado && <span className="text-xs text-muted-foreground">Datos simulados (Factiliza aún no está conectado)</span>}
      </label>

      <label className="block text-sm">
        Razón social
        <input {...register('tercero.razonSocial')} className={input} />
      </label>
      <label className="block text-sm">
        Dirección
        <input {...register('tercero.direccion')} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Teléfono
          <input {...register('tercero.telefono')} className={input} />
        </label>
        <label className="text-sm">
          Correo
          <input {...register('tercero.correo')} className={input} />
        </label>
      </div>

      {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {isSubmitting ? 'Guardando…' : 'Guardar proveedor'}
      </button>
    </form>
  )
}
