import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Loader2, Search, Info, AlertCircle } from 'lucide-react'
import type { ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import { useConsultarDocumento } from '../hooks/useConsultarDocumento'
import { Campo, SeccionForm } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { Button } from '@/components/ui/button'
import { listarDistritos } from '@/api/distritosApi'
import { DistritoSelector } from './DistritoSelector'

/** Lo que comparten cliente y proveedor: los datos del tercero. */
type ConTercero = { tercero: ClienteFormValues['tercero'] }

const TIPOS_DOCUMENTO = [
  { id: 1, label: 'RUC' },
  { id: 2, label: 'DNI' },
  { id: 3, label: 'Carné de extranjería' },
  { id: 4, label: 'Pasaporte' },
] as const

type TipoDocumentoId = (typeof TIPOS_DOCUMENTO)[number]['id']

/** Mapa de placeholders por tipo de documento */
const PLACEHOLDERS: Record<TipoDocumentoId, string> = {
  1: '20512345671', // RUC
  2: '12345678',    // DNI
  3: '00123456',    // CE
  4: '12345678',    // Pasaporte
}

/** Etiquetas para el campo razonSocial según tipo de documento */
const RAZON_SOCIAL_LABELS: Record<TipoDocumentoId, string> = {
  1: 'Razón social',
  2: 'Nombres y apellidos',
  3: 'Nombres y apellidos',
  4: 'Nombres y apellidos',
}

/** Mensajes de ayuda para el campo de documento según tipo */
const DOCUMENTO_AYUDA: Record<TipoDocumentoId, string> = {
  1: 'Ingresa el RUC de 11 dígitos. Con "Buscar" se completan la razón social y la dirección desde SUNAT.',
  2: 'Ingresa el DNI de 8 dígitos. Con "Buscar" se completan los nombres, apellidos y la dirección desde RENIEC.',
  3: 'Ingresa el número de carné de extranjería. La consulta automática no está disponible para este tipo de documento.',
  4: 'Ingresa el número de pasaporte. La consulta automática no está disponible para este tipo de documento.',
}

/** Mensajes de ayuda para el campo razonSocial según tipo */
const RAZON_AYUDA: Record<TipoDocumentoId, string> = {
  1: 'Se completa automáticamente al buscar el RUC. Si la consulta falla, ingrésalo manualmente.',
  2: 'Se completa automáticamente al buscar el DNI (nombres + apellidos). Si la consulta falla, ingrésalo manualmente.',
  3: 'Ingresa los nombres y apellidos del titular del carné de extranjería.',
  4: 'Ingresa los nombres y apellidos del titular del pasaporte.',
}

/** Campos del tercero (documento, datos fiscales y contacto) con autocompletado
 *  por RUC/DNI (RF-08). Debe ir dentro de un <FormProvider>. */
export function CamposTercero() {
  const { register, setValue, getValues, trigger, setError, watch, formState: { errors } } = useFormContext<ConTercero>()
  const e = errors.tercero
  const consultar = useConsultarDocumento()

  const { data: distritos, isLoading: cargandoDistritos, isError: errorDistritos } = useQuery({
    queryKey: ['distritos'],
    queryFn: listarDistritos,
    staleTime: 10 * 60_000,
  })

  const idDistritoSeleccionado = watch('tercero.idDistrito') as number | undefined
  const selectedDistrito = distritos?.find((d) => d.idDistrito === idDistritoSeleccionado)

  // Observa el tipo de documento para actualizar placeholders, etiquetas y ayudas
  const idTipoDocumento = watch('tercero.idTipoDocumento') as TipoDocumentoId | undefined

  // Completa razón social y dirección desde Factiliza (vía backend)
  async function buscarDocumento() {
    const numero = getValues('tercero.numeroDocumento')?.trim()
    const tipo = idTipoDocumento
    if (!numero || !tipo) return
    
    // Solo RUC (1) y DNI (2) tienen consulta automática
    if (tipo !== 1 && tipo !== 2) return
    if (!/^\d{8}$|^\d{11}$/.test(numero)) return
    
    try {
      const datos = await consultar.mutateAsync(numero)
      if (datos.razonSocial) {
        setValue('tercero.razonSocial', datos.razonSocial, { shouldValidate: true })
      }
      if (datos.direccion) {
        setValue('tercero.direccion', datos.direccion)
      }
    } catch {
      // El error se muestra bajo el campo con consultar.isError
    }
  }

  // Maneja cambios en el tipo de documento
  useEffect(() => {
    if (idTipoDocumento === undefined) return
    
    // Limpiar campo de número de documento al cambiar tipo
    setValue('tercero.numeroDocumento', '', { shouldValidate: true })
    
    // Para CE y Pasaporte, limpiar razón social ya que no hay autocompletado
    if (idTipoDocumento === 3 || idTipoDocumento === 4) {
      setValue('tercero.razonSocial', '', { shouldValidate: true })
      setValue('tercero.direccion', '')
    }
  }, [idTipoDocumento, setValue])

  const errorDoc = e?.numeroDocumento?.message ?? (consultar.isError ? 'No se pudo consultar el documento. Completa los datos a mano.' : undefined)
  
  // Mensaje de ayuda dinámico para el campo de documento
  const ayudaDoc = idTipoDocumento
    ? DOCUMENTO_AYUDA[idTipoDocumento]
    : 'Selecciona un tipo de documento para ver las instrucciones.'

  // Mensaje de ayuda para distrito
  const ayudaDistrito = errorDistritos
    ? 'No se pudo cargar el catálogo de distritos. Puedes ingresar el código manualmente.'
    : cargandoDistritos
    ? 'Cargando catálogo de distritos...'
    : 'Selecciona el distrito del cliente.'

  // Mensaje de ayuda para razonSocial
  const ayudaRazon = idTipoDocumento
    ? RAZON_AYUDA[idTipoDocumento]
    : 'Selecciona un tipo de documento.'

  // Determinar si mostrar el campo razonSocial (ocultar para CE y Pasaporte según requerimiento)
  const mostrarRazonSocial = idTipoDocumento !== 3 && idTipoDocumento !== 4

  function handleDistritoChange(idDistrito: number) {
    setValue('tercero.idDistrito', idDistrito, { shouldValidate: true })
  }

  return (
    <>
      <SeccionForm titulo="Identificación">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Campo id="tercero-tipo" label="Tipo de documento">
            <select
              id="tercero-tipo"
              {...register('tercero.idTipoDocumento', { valueAsNumber: true })}
              className={inputFormClass}
            >
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Campo>
          <Campo
            id="tercero-numero"
            label="Número de documento"
            error={errorDoc}
            ayuda={ayudaDoc}
          >
            <div className="flex gap-2">
              <input
                id="tercero-numero"
                inputMode="numeric"
                autoComplete="off"
                placeholder={idTipoDocumento ? PLACEHOLDERS[idTipoDocumento] : 'Ej: 20512345671'}
                {...register('tercero.numeroDocumento')}
                aria-invalid={!!errorDoc}
                className={inputFormClass}
                disabled={!idTipoDocumento}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void buscarDocumento()}
                disabled={consultar.isPending || !idTipoDocumento || (idTipoDocumento !== 1 && idTipoDocumento !== 2)}
                aria-label="Buscar datos del documento"
              >
                {consultar.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  : <Search className="mr-2 h-4 w-4" aria-hidden="true" />}
                Buscar
              </Button>
            </div>
          </Campo>
        </div>

        {mostrarRazonSocial && (
          <Campo
            id="tercero-razon"
            label={idTipoDocumento ? RAZON_SOCIAL_LABELS[idTipoDocumento] : 'Razón social / Nombres y apellidos'}
            error={e?.razonSocial?.message}
            ayuda={ayudaRazon}
          >
            <input
              id="tercero-razon"
              autoComplete={idTipoDocumento === 1 ? 'organization' : 'name'}
              placeholder={idTipoDocumento === 1 ? 'Empresa S.A.C.' : 'Juan Pérez Gómez'}
              {...register('tercero.razonSocial')}
              aria-invalid={!!e?.razonSocial}
              aria-describedby={describedBy('tercero-razon', { error: e?.razonSocial })}
              className={inputFormClass}
            />
          </Campo>
        )}

        {/* Mostrar indicador cuando el campo está oculto para CE/Pasaporte */}
        {idTipoDocumento === 3 || idTipoDocumento === 4 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" aria-hidden="true" />
            <span>Para {idTipoDocumento === 3 ? 'Carné de extranjería' : 'Pasaporte'} el campo de nombres se completa manualmente.</span>
          </div>
        ) : null}

        {/* Indicador de modo simulado */}
        {consultar.data?.simulado && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>Modo simulado: la consulta a SUNAT/RENIEC no está conectada. Los datos son de prueba.</span>
          </div>
        )}
      </SeccionForm>

      <SeccionForm titulo="Ubicación y contacto">
        <Campo
          id="tercero-direccion"
          label="Dirección"
          opcional
        >
          <input
            id="tercero-direccion"
            autoComplete="street-address"
            maxLength={255}
            {...register('tercero.direccion')}
            className={inputFormClass}
          />
        </Campo>
        <Campo
          id="tercero-distrito"
          label="Distrito"
          ayuda={ayudaDistrito}
          error={e?.idDistrito?.message}
        >
          <div className="flex gap-2">
            <DistritoSelector
              distritos={distritos}
              isLoading={cargandoDistritos || errorDistritos}
              value={idDistritoSeleccionado}
              onChange={handleDistritoChange}
              className={inputFormClass}
              disabled={errorDistritos}
            />
            {selectedDistrito && (
              <input
                id="tercero-ubigeo"
                type="text"
                readOnly
                value={selectedDistrito.ubigeo}
                className={`${inputFormClass} max-w-40 bg-muted`}
                tabIndex={-1}
                aria-readonly="true"
                placeholder="UBIGEO"
              />
            )}
          </div>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="tercero-telefono" label="Teléfono" opcional>
            <input
              id="tercero-telefono"
              type="tel"
              maxLength={15}
              autoComplete="tel"
              placeholder="+51 984 215 330"
              {...register('tercero.telefono')}
              onChange={(ev) => {
                ev.target.value = ev.target.value.replace(/[^0-9+]/g, '')
              }}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="tercero-correo" label="Correo" opcional error={e?.correo?.message}>
            <input
              id="tercero-correo"
              type="email"
              maxLength={100}
              autoComplete="email"
              placeholder="compras@empresa.pe"
              {...register('tercero.correo')}
              onChange={(ev) => {
                const valor = ev.target.value
                if (valor && !valor.includes('@')) {
                  setError('tercero.correo', { type: 'pattern', message: 'El correo debe incluir el carácter @' })
                } else {
                  void trigger('tercero.correo')
                }
              }}
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