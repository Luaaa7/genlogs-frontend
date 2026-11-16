import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Ventana } from '@/components/ui/Ventana'
import { textareaFormClass } from '@/components/ui/campoEstilos'

const anularSchema = z.object({
  motivo: z.string().trim().min(5, 'Indica el motivo para anular la cotización (mínimo 5 caracteres)'),
})

interface Props {
  ocupado: boolean
  onCerrar: () => void
  onConfirmar: (motivo: string) => void
}

/** El PATCH a ANULADA exige motivo. Mínimo 5, igual que devolver. */
export function AnularCotizacionModal({ ocupado, onCerrar, onConfirmar }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ motivo: string }>({
    resolver: zodResolver(anularSchema),
    defaultValues: { motivo: '' },
  })
  return (
    <Ventana
      titulo="Anular cotización"
      descripcion="La cotización queda anulada. El motivo queda en el seguimiento."
      onCerrar={onCerrar}
      acciones={<Button type="submit" form="anular-cotizacion" disabled={ocupado}>Confirmar anulación</Button>}
    >
      <form id="anular-cotizacion" onSubmit={handleSubmit((v) => onConfirmar(v.motivo))}>
        <label className="text-sm text-foreground" htmlFor="motivo-anulacion">Motivo
          <textarea id="motivo-anulacion" className={`${textareaFormClass} mt-1`} {...register('motivo')} />
        </label>
        {errors.motivo && <p role="alert" className="mt-2 text-sm text-destructive">{errors.motivo.message}</p>}
      </form>
    </Ventana>
  )
}
