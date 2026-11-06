import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertCircle, Check, Info, Loader2, Search } from 'lucide-react'
import type { ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import { useConsultarDocumento } from '../hooks/useConsultarDocumento'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { Button } from '@/components/ui/button'
import { listarDistritos } from '@/api/distritosApi'
import { esDistritoExtranjero } from '@/lib/terceroExtranjero'
import { separarNombreCompleto } from '@/lib/nombreTercero'
import { cn } from '@/lib/utils/utils'
import { PestanasTipoDocumento } from './PestanasTipoDocumento'
import { UbicacionCampos } from './UbicacionCampos'
import { infoTipoDocumento, type TipoDocumentoId } from '../constants/tiposDocumento'

/** Lo que comparten cliente y proveedor: los datos del tercero. */
type ConTercero = { tercero: ClienteFormValues['tercero'] }

const PLACEHOLDER_DOCUMENTO: Record<TipoDocumentoId, string> = {
  1: '20512345671',
  2: '12345678',
  4: 'AB123456',
}

const AYUDA_DOCUMENTO: Record<TipoDocumentoId, string> = {
  1: 'RUC de 11 dígitos, empieza con 10 o 20. Con "Consultar SUNAT" se completan los datos.',
  2: 'DNI de 8 dígitos. Con "Consultar RENIEC" se completan los nombres, apellidos y la dirección.',
  4: 'De 6 a 12 letras o números, tal como figura en el pasaporte.',
}

const ORIGEN: Record<TipoDocumentoId, string> = {
  1: 'Datos desde SUNAT',
  2: 'Datos desde RENIEC',
  4: 'Registro manual',
}

/** Clase extra de las casillas que llenó la consulta (siguen siendo editables). */
const claseAutocompletado = 'border-teal-400 bg-teal-50/60 dark:border-teal-700 dark:bg-teal-950/40'

/**
 * Datos del tercero (cliente o proveedor) en tres pestañas: RUC, DNI y
 * Pasaporte. Cada pestaña muestra su propio formulario:
 * - RUC: razón social, desde SUNAT.
 * - DNI: nombres, apellido paterno y apellido materno, desde RENIEC.
 * - Pasaporte: los mismos campos que el DNI, escritos a mano.
 * Lo que trae la consulta queda en casillas editables, incluidos el
 * departamento, la provincia y el distrito. Al cambiar de pestaña, la ficha
 * queda en blanco. Debe ir dentro de un <FormProvider>.
 */
export function CamposTercero() {
  const { register, setValue, getValues, setError, clearErrors, setFocus, watch, formState: { errors } } = useFormContext<ConTercero>()
  const e = errors.tercero
  const consultar = useConsultarDocumento()
  const [autocompletado, setAutocompletado] = useState(false)

  const { data: distritos, isLoading: cargandoDistritos, isError: errorDistritos, refetch: reintentarDistritos, isFetching: recargandoDistritos } = useQuery({
    queryKey: ['distritos'],
    queryFn: listarDistritos,
    staleTime: 10 * 60_000,
  })

  const tipo = ((watch('tercero.idTipoDocumento') as number | undefined) ?? 1) as TipoDocumentoId
  const info = infoTipoDocumento(tipo)
  const esPersona = tipo !== 1
  const tieneConsulta = tipo === 1 || tipo === 2

  const idDistrito = watch('tercero.idDistrito') as number | undefined
  const distritoElegido = distritos?.find((d) => d.idDistrito === idDistrito)
  const esExtranjero = esDistritoExtranjero(distritoElegido)

  function cambiarTipo(nuevo: TipoDocumentoId) {
    if (nuevo === tipo) return
    setValue('tercero.idTipoDocumento', nuevo, { shouldDirty: true })
    // Cualquier cambio entre RUC, DNI y pasaporte deja la ficha en blanco: los
    // datos del documento anterior no deben quedar en la pestaña nueva.
    setValue('tercero.numeroDocumento', '', { shouldDirty: true })
    setValue('tercero.razonSocial', '')
    setValue('tercero.nombres', '')
    setValue('tercero.apellidoPaterno', '')
    setValue('tercero.apellidoMaterno', '')
    setValue('tercero.direccion', '')
    setValue('tercero.telefono', '')
    setValue('tercero.correo', '')
    setValue('tercero.lugarExtranjero', '')
    setValue('tercero.ubigeo', '')
    setValue('tercero.idDistrito', undefined as unknown as number, { shouldValidate: false })
    clearErrors('tercero')
    setAutocompletado(false)
    consultar.reset()
  }

  // Completa los datos desde Factiliza (vía backend): SUNAT para RUC, RENIEC para DNI.
  async function buscarDocumento() {
    if (!tieneConsulta) return
    const numero = getValues('tercero.numeroDocumento')?.trim() ?? ''
    const largo = tipo === 1 ? 11 : 8
    if (!new RegExp(`^\\d{${largo}}$`).test(numero)) {
      setError('tercero.numeroDocumento', {
        type: 'manual',
        message: numero
          ? `El ${info.label} debe tener ${largo} dígitos (tiene ${numero.replace(/\D/g, '').length}).`
          : `Escribe el ${info.label} antes de consultar.`,
      })
      return
    }
    if (tipo === 1 && !/^(10|20)/.test(numero)) {
      setError('tercero.numeroDocumento', { type: 'manual', message: 'El RUC debe empezar con 10 o 20.' })
      return
    }
    clearErrors('tercero.numeroDocumento')

    try {
      const datos = await consultar.mutateAsync(numero)
      const opciones = { shouldValidate: true, shouldDirty: true }
      if (tipo === 1) {
        if (datos.razonSocial) setValue('tercero.razonSocial', datos.razonSocial, opciones)
      } else {
        // Si el backend aún no separa los apellidos, se proponen a partir del nombre completo.
        const propuesta = separarNombreCompleto(datos.razonSocial)
        setValue('tercero.nombres', datos.nombres ?? propuesta.nombres, opciones)
        setValue('tercero.apellidoPaterno', datos.apellidoPaterno ?? propuesta.apellidoPaterno, opciones)
        setValue('tercero.apellidoMaterno', datos.apellidoMaterno ?? propuesta.apellidoMaterno, { shouldDirty: true })
      }
      if (datos.direccion) setValue('tercero.direccion', datos.direccion, { shouldDirty: true })
      if (datos.idDistrito) elegirDistrito(datos.idDistrito)
      setAutocompletado(true)
    } catch {
      // El error se muestra bajo el número con consultar.isError
    }
  }

  function elegirDistrito(id: number | undefined) {
    setValue('tercero.idDistrito', id as number, { shouldValidate: id !== undefined, shouldDirty: true })
    const distrito = distritos?.find((d) => d.idDistrito === id)
    setValue('tercero.ubigeo', distrito?.ubigeo ?? '')
    if (esDistritoExtranjero(distrito)) {
      // "Extranjero": se pide la ciudad y el país, y se lleva el foco ahí.
      setTimeout(() => setFocus('tercero.lugarExtranjero'), 0)
    } else {
      setValue('tercero.lugarExtranjero', '')
      clearErrors('tercero.lugarExtranjero')
    }
  }

  const errorDoc = e?.numeroDocumento?.message ?? (consultar.isError ? 'No se pudo consultar el documento. Completa los datos a mano.' : undefined)
  const ayudaDoc = AYUDA_DOCUMENTO[tipo]
  const resaltar = (valor: unknown) => autocompletado && typeof valor === 'string' && valor.trim() !== ''

  const nombres = watch('tercero.nombres')
  const apellidoPaterno = watch('tercero.apellidoPaterno')
  const apellidoMaterno = watch('tercero.apellidoMaterno')
  const razonSocial = watch('tercero.razonSocial')
  const direccion = watch('tercero.direccion')

  return (
    <PestanasTipoDocumento idBase="tercero-tipo" value={tipo} onChange={cambiarTipo} compacto>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{info.titulo}</h3>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', info.iconoClass)}>{ORIGEN[tipo]}</span>
        </div>

        {tipo === 4 && (
          <p className="flex gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            El pasaporte no se consulta en SUNAT ni en RENIEC. Escribe los datos tal como figuran en el documento.
          </p>
        )}

        <Campo id="tercero-numero" label={tipo === 4 ? 'Número de pasaporte' : `Número de ${info.label}`} error={errorDoc} ayuda={ayudaDoc} obligatorio>
          <div className="flex flex-wrap gap-2">
            <input
              id="tercero-numero"
              // El pasaporte lleva letras; RUC y DNI solo números.
              inputMode={tipo === 4 ? 'text' : 'numeric'}
              maxLength={tipo === 1 ? 11 : tipo === 2 ? 8 : 12}
              autoComplete="off"
              placeholder={PLACEHOLDER_DOCUMENTO[tipo]}
              {...register('tercero.numeroDocumento', {
                onChange: (ev) => {
                  const valor: string = ev.target.value
                  const limpio = tipo === 4 ? valor.toUpperCase().replace(/[^A-Z0-9]/g, '') : valor.replace(/\D/g, '')
                  if (limpio !== valor) setValue('tercero.numeroDocumento', limpio)
                },
              })}
              aria-invalid={!!errorDoc}
              aria-describedby={describedBy('tercero-numero', { error: errorDoc, ayuda: ayudaDoc })}
              className={cn(inputFormClass, 'min-w-0 flex-1 tabular-nums tracking-wide')}
            />
            {tieneConsulta && (
              <Button type="button" onClick={() => void buscarDocumento()} disabled={consultar.isPending}>
                {consultar.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  : <Search className="mr-2 h-4 w-4" aria-hidden="true" />}
                {tipo === 1 ? 'Consultar SUNAT' : 'Consultar RENIEC'}
              </Button>
            )}
          </div>
        </Campo>

        {consultar.data?.simulado && (
          <p role="status" className="flex items-center gap-2 text-sm text-warning-text">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Modo simulado: la consulta a SUNAT/RENIEC no está conectada. Los datos son de prueba.
          </p>
        )}

        {autocompletado && (
          <p role="status" className="flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Datos completados desde {tipo === 1 ? 'SUNAT' : 'RENIEC'}. Puedes corregir cualquier casilla.
          </p>
        )}

        {esPersona ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="tercero-nombres" label="Nombres" error={e?.nombres?.message} obligatorio>
              <input
                id="tercero-nombres"
                autoComplete="given-name"
                maxLength={120}
                {...register('tercero.nombres')}
                aria-invalid={!!e?.nombres}
                aria-describedby={describedBy('tercero-nombres', { error: e?.nombres })}
                className={cn(inputFormClass, resaltar(nombres) && claseAutocompletado)}
              />
            </Campo>
            <Campo id="tercero-paterno" label="Apellido paterno" error={e?.apellidoPaterno?.message} obligatorio>
              <input
                id="tercero-paterno"
                autoComplete="family-name"
                maxLength={60}
                {...register('tercero.apellidoPaterno')}
                aria-invalid={!!e?.apellidoPaterno}
                aria-describedby={describedBy('tercero-paterno', { error: e?.apellidoPaterno })}
                className={cn(inputFormClass, resaltar(apellidoPaterno) && claseAutocompletado)}
              />
            </Campo>
            <Campo id="tercero-materno" label="Apellido materno" opcional>
              <input
                id="tercero-materno"
                autoComplete="off"
                maxLength={60}
                {...register('tercero.apellidoMaterno')}
                className={cn(inputFormClass, resaltar(apellidoMaterno) && claseAutocompletado)}
              />
            </Campo>
          </div>
        ) : (
          <Campo id="tercero-razon" label="Razón social" error={e?.razonSocial?.message} obligatorio>
            <input
              id="tercero-razon"
              autoComplete="organization"
              maxLength={200}
              placeholder="Empresa S.A.C."
              {...register('tercero.razonSocial')}
              aria-invalid={!!e?.razonSocial}
              aria-describedby={describedBy('tercero-razon', { error: e?.razonSocial })}
              className={cn(inputFormClass, resaltar(razonSocial) && claseAutocompletado)}
            />
          </Campo>
        )}

        <Campo id="tercero-direccion" label={tipo === 1 ? 'Dirección fiscal' : 'Dirección'} opcional>
          <input
            id="tercero-direccion"
            autoComplete="street-address"
            maxLength={255}
            placeholder="Calle, número, referencia"
            {...register('tercero.direccion')}
            className={cn(inputFormClass, resaltar(direccion) && claseAutocompletado)}
          />
        </Campo>

        <div className="flex flex-col gap-2">
          <UbicacionCampos
            // Se reinicia con cada pestaña para que no queden el departamento y la provincia anteriores.
            key={tipo}
            idBase="tercero-ubicacion"
            distritos={distritos}
            isLoading={cargandoDistritos}
            value={idDistrito}
            onChange={elegirDistrito}
            error={e?.idDistrito?.message}
            autocompletado={autocompletado}
            disabled={errorDistritos}
          />
          {errorDistritos && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              No se pudo cargar el catálogo de distritos.
              <Button type="button" variant="outline" size="sm" onClick={() => void reintentarDistritos()} disabled={recargandoDistritos}>
                {recargandoDistritos ? 'Cargando…' : 'Reintentar'}
              </Button>
            </div>
          )}
        </div>

        {esExtranjero && (
          <Campo
            id="tercero-lugar-extranjero"
            label="Ciudad y país"
            ayuda="Por ejemplo: Santiago, Chile. Se guarda junto a la dirección."
            error={e?.lugarExtranjero?.message}
            obligatorio
          >
            <input
              id="tercero-lugar-extranjero"
              autoComplete="address-level2"
              placeholder="Santiago, Chile"
              maxLength={120}
              {...register('tercero.lugarExtranjero')}
              aria-invalid={!!e?.lugarExtranjero}
              aria-describedby={describedBy('tercero-lugar-extranjero', {
                error: e?.lugarExtranjero,
                ayuda: 'Por ejemplo: Santiago, Chile. Se guarda junto a la dirección.',
              })}
              className={inputFormClass}
            />
          </Campo>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="tercero-telefono" label={tipo === 4 ? 'Teléfono con código de país' : 'Teléfono'} opcional>
            <input
              id="tercero-telefono"
              type="tel"
              maxLength={15}
              autoComplete="tel"
              placeholder={tipo === 4 ? '+1 000 000 0000' : '+51 984 215 330'}
              {...register('tercero.telefono', {
                // Solo números y "+". Va dentro de register para que el valor sí llegue al formulario.
                onChange: (ev) => {
                  const limpio = ev.target.value.replace(/[^0-9+]/g, '')
                  if (limpio !== ev.target.value) setValue('tercero.telefono', limpio)
                },
              })}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="tercero-correo" label="Correo" opcional error={e?.correo?.message}>
            <input
              id="tercero-correo"
              type="email"
              maxLength={100}
              autoComplete="email"
              placeholder={tipo === 1 ? 'compras@empresa.pe' : 'nombre@correo.com'}
              {...register('tercero.correo')}
              aria-invalid={!!e?.correo}
              aria-describedby={describedBy('tercero-correo', { error: e?.correo })}
              className={inputFormClass}
            />
          </Campo>
        </div>
      </div>
    </PestanasTipoDocumento>
  )
}