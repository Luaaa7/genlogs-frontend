import { useFormContext } from 'react-hook-form'
import { Loader2, Search } from 'lucide-react'
import type { ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import { useConsultarDocumento } from '../hooks/useConsultarDocumento'
import { Campo, SeccionForm } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { Button } from '@/components/ui/button'

/** Lo que comparten cliente y proveedor: los datos del tercero. */
type ConTercero = { tercero: ClienteFormValues['tercero'] }

const TIPOS_DOCUMENTO = [
  { id: 1, label: 'RUC' },
  { id: 2, label: 'DNI' },
  { id: 3, label: 'Carné de extranjería' },
  { id: 4, label: 'Pasaporte' },
]

/** Campos del tercero (documento, datos fiscales y contacto) con autocompletado
 *  por RUC/DNI (RF-08). Debe ir dentro de un <FormProvider>. */
export function CamposTercero() {
  const { register, setValue, getValues, formState: { errors } } = useFormContext<ConTercero>()
  const e = errors.tercero
  const consultar = useConsultarDocumento()

  // Completa razón social y dirección desde Factiliza (vía backend)
  async function buscarDocumento() {
    const numero = getValues('tercero.numeroDocumento')?.trim()
    if (!numero || !/^\d{8}$|^\d{11}$/.test(numero)) return
    try {
      const datos = await consultar.mutateAsync(numero)
      if (datos.razonSocial) setValue('tercero.razonSocial', datos.razonSocial, { shouldValidate: true })
      if (datos.direccion) setValue('tercero.direccion', datos.direccion)
    } catch {
      // El error se muestra bajo el campo con consultar.isError
    }
  }

  const errorDoc = e?.numeroDocumento?.message ?? (consultar.isError ? 'No se pudo consultar el documento. Completa los datos a mano.' : undefined)
  const ayudaDoc = consultar.data?.simulado
    ? 'Datos simulados: la consulta a SUNAT/RENIEC aún no está conectada.'
    : 'Con "Buscar" se completan la razón social y la dirección.'

  return (
    <>
      <SeccionForm titulo="Identificación">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Campo id="tercero-tipo" label="Tipo de documento">
            <select id="tercero-tipo" {...register('tercero.idTipoDocumento', { valueAsNumber: true })} className={inputFormClass}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Campo>
          <Campo id="tercero-numero" label="Número de documento" error={errorDoc} ayuda={ayudaDoc}>
            <div className="flex gap-2">
              <input
                id="tercero-numero"
                inputMode="numeric"
                autoComplete="off"
                placeholder="20512345671"
                {...register('tercero.numeroDocumento')}
                aria-invalid={!!errorDoc}
                aria-describedby={describedBy('tercero-numero', { error: errorDoc, ayuda: ayudaDoc })}
                className={inputFormClass}
              />
              <Button type="button" variant="outline" onClick={() => void buscarDocumento()} disabled={consultar.isPending}>
                {consultar.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  : <Search className="mr-2 h-4 w-4" aria-hidden="true" />}
                Buscar
              </Button>
            </div>
          </Campo>
        </div>
        <Campo id="tercero-razon" label="Razón social" error={e?.razonSocial?.message}>
          <input
            id="tercero-razon"
            autoComplete="organization"
            {...register('tercero.razonSocial')}
            aria-invalid={!!e?.razonSocial}
            aria-describedby={describedBy('tercero-razon', { error: e?.razonSocial })}
            className={inputFormClass}
          />
        </Campo>
      </SeccionForm>

      <SeccionForm titulo="Ubicación y contacto">
        <Campo id="tercero-direccion" label="Dirección" opcional>
          <input id="tercero-direccion" autoComplete="street-address" {...register('tercero.direccion')} className={inputFormClass} />
        </Campo>
        <Campo
          id="tercero-distrito"
          label="Código de distrito"
          ayuda="Identificador interno del distrito. Pronto se reemplazará por un buscador."
          error={e?.idDistrito?.message}
        >
          <input
            id="tercero-distrito"
            type="number"
            min={1}
            {...register('tercero.idDistrito', { valueAsNumber: true })}
            aria-invalid={!!e?.idDistrito}
            aria-describedby={describedBy('tercero-distrito', { error: e?.idDistrito, ayuda: true })}
            className={`${inputFormClass} max-w-40`}
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="tercero-telefono" label="Teléfono" opcional>
            <input id="tercero-telefono" type="tel" autoComplete="tel" placeholder="+51 984 215 330" {...register('tercero.telefono')} className={inputFormClass} />
          </Campo>
          <Campo id="tercero-correo" label="Correo" opcional error={e?.correo?.message}>
            <input
              id="tercero-correo"
              type="email"
              autoComplete="email"
              placeholder="compras@empresa.pe"
              {...register('tercero.correo')}
              aria-invalid={!!e?.correo}
              aria-describedby={describedBy('tercero-correo', { error: e?.correo })}
              className={inputFormClass}
            />
          </Campo>
        </div>
      </SeccionForm>
    </>
  )
}
