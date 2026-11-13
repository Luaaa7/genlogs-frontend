import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { AlertCircle, Check, Info, Loader2, Search } from 'lucide-react'
import type { ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import { useConsultarDocumento } from '../hooks/useConsultarDocumento'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { Button } from '@/components/ui/button'
import { listarDistritos } from '@/api/distritosApi'
import { esPeru, listarPaises } from '@/api/paisesApi'
import { separarNombreCompleto } from '@/lib/nombreTercero'
import { cambiarPrefijo, completarPrefijo, ejemploTelefono, limpiarTelefono } from '@/lib/telefono'
import { cn } from '@/lib/utils/utils'
import { IconoTipoDocumento, PestanasTipoDocumento } from './PestanasTipoDocumento'
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

/** Aviso según de dónde salieron los datos de la consulta. */
function textoOrigen(origen: string | undefined, tipo: TipoDocumentoId): string {
  if (origen === 'REGISTRADO') return 'Este documento ya está registrado en GENLOGS: se usaron sus datos.'
  if (origen === 'GUARDADO') return `Datos de una consulta anterior a ${tipo === 1 ? 'SUNAT' : 'RENIEC'}, guardada en GENLOGS.`
  return `Datos completados desde ${tipo === 1 ? 'SUNAT' : 'RENIEC'}.`
}

/** Clase extra de las casillas que llenó la consulta (siguen siendo editables). */
const claseAutocompletado = 'border-teal-400 bg-teal-50/60 dark:border-teal-700 dark:bg-teal-950/40'

/**
 * Datos del tercero (cliente o proveedor) en tres pestañas: RUC, DNI y
 * Pasaporte. Cada pestaña muestra su propio formulario:
 * - RUC: razón social, desde SUNAT.
 * - DNI: nombres, apellido paterno y apellido materno, desde RENIEC.
 *   La consulta mira primero en GENLOGS (clientes, proveedores y consultas
 *   anteriores) y solo si no lo encuentra pregunta a Factiliza.
 * - Pasaporte: los mismos campos que el DNI, escritos a mano.
 * Lo que trae la consulta queda en casillas editables, incluidos el
 * departamento, la provincia y el distrito. Debe ir dentro de un <FormProvider>.
 *
 * D-15: primero se elige el país (Perú por defecto). En Perú, departamento,
 * provincia y distrito en cascada desde el catálogo del INEI; fuera de Perú,
 * región, ciudad y código postal en texto libre.
 *
 * Con `tipoFijo` (p. ej. al pulsar "Nueva persona" en la pestaña DNI) no se
 * muestran las pestañas: solo la página de ese documento.
 */
export function CamposTercero({ tipoFijo }: { tipoFijo?: TipoDocumentoId } = {}) {
  const { register, setValue, getValues, setError, clearErrors, setFocus, watch, formState: { errors } } = useFormContext<ConTercero>()
  const e = errors.tercero
  const consultar = useConsultarDocumento()
  const [autocompletado, setAutocompletado] = useState(false)
  // Número con el que se llenó la ficha; si se cambia o se borra, la ficha se vacía.
  const [numeroConsultado, setNumeroConsultado] = useState<string | null>(null)

  const { data: distritos, isLoading: cargandoDistritos, isError: errorDistritos, refetch: reintentarDistritos, isFetching: recargandoDistritos } = useQuery({
    queryKey: ['distritos'],
    queryFn: listarDistritos,
    staleTime: 10 * 60_000,
  })
  // D-15: país del tercero. Si no se puede cargar la lista, queda Perú (el backend lo asume).
  const { data: paises, isLoading: cargandoPaises } = useQuery({
    queryKey: ['paises'],
    queryFn: listarPaises,
    staleTime: 30 * 60_000,
  })
  const tipo = (tipoFijo ?? (watch('tercero.idTipoDocumento') as number | undefined) ?? 1) as TipoDocumentoId
  const esPasaporte = tipo === 4
  const peru = paises?.find(esPeru)
  const idPais = watch('tercero.idPais') as number | undefined
  const paisElegido = idPais !== undefined ? paises?.find((p) => p.idPais === idPais) : undefined
  // Con pasaporte la ubicación siempre es en texto libre y el país no puede ser Perú.
  // Con RUC o DNI: sin país elegido, o con Perú, se usa el catálogo de distritos.
  const esExtranjero = esPasaporte || (!!paisElegido && !esPeru(paisElegido))
  const paisesVisibles = esPasaporte ? paises?.filter((p) => !esPeru(p)) : paises
  // País con el que se arma el teléfono (sin elegir = Perú, salvo con pasaporte).
  const paisDelTelefono = paisElegido ?? (esPasaporte ? undefined : peru)
  const prefijo = paisDelTelefono?.codigoTelefono ?? null

  // El esquema necesita saber si es extranjero para pedir distrito o ciudad.
  useEffect(() => {
    setValue('tercero.esExtranjero', esExtranjero)
  }, [esExtranjero, setValue])

  function cambiarPais(valor: string) {
    const id = valor ? Number(valor) : undefined
    setValue('tercero.idPais', id, { shouldDirty: true })
    const pais = paises?.find((p) => p.idPais === id)
    // Si el teléfono tenía el prefijo del país anterior, pasa al del nuevo.
    const telefono = getValues('tercero.telefono') ?? ''
    const conPrefijoNuevo = cambiarPrefijo(telefono, prefijo, pais?.codigoTelefono)
    if (conPrefijoNuevo !== telefono) setValue('tercero.telefono', conPrefijoNuevo, { shouldDirty: true })
    if (esPasaporte || (pais && !esPeru(pais))) {
      // Fuera de Perú no hay distrito del catálogo: se escriben región, ciudad y código postal.
      setValue('tercero.idDistrito', undefined, { shouldValidate: false })
      setValue('tercero.ubigeo', '')
      clearErrors('tercero.idDistrito')
      if (id) clearErrors('tercero.idPais')
      setTimeout(() => setFocus('tercero.ciudadExtranjero'), 0)
    } else {
      setValue('tercero.regionExtranjero', '')
      setValue('tercero.ciudadExtranjero', '')
      setValue('tercero.codigoPostalExtranjero', '')
      clearErrors('tercero.ciudadExtranjero')
    }
  }

  const info = infoTipoDocumento(tipo)
  const esPersona = tipo !== 1
  const tieneConsulta = tipo === 1 || tipo === 2

  const idDistrito = watch('tercero.idDistrito') as number | undefined

  /** Deja en blanco todo lo que no es el número: nombre, dirección, ubicación y contacto. */
  function vaciarDatos() {
    setValue('tercero.razonSocial', '')
    setValue('tercero.nombres', '')
    setValue('tercero.apellidoPaterno', '')
    setValue('tercero.apellidoMaterno', '')
    setValue('tercero.direccion', '')
    setValue('tercero.telefono', '')
    setValue('tercero.correo', '')
    setValue('tercero.idPais', undefined)
    setValue('tercero.regionExtranjero', '')
    setValue('tercero.ciudadExtranjero', '')
    setValue('tercero.codigoPostalExtranjero', '')
    setValue('tercero.ubigeo', '')
    setValue('tercero.idDistrito', undefined as unknown as number, { shouldValidate: false })
    setAutocompletado(false)
    setNumeroConsultado(null)
    consultar.reset()
  }

  function cambiarTipo(nuevo: TipoDocumentoId) {
    if (nuevo === tipo) return
    setValue('tercero.idTipoDocumento', nuevo, { shouldDirty: true })
    // Cualquier cambio entre RUC, DNI y pasaporte deja la ficha en blanco: los
    // datos del documento anterior no deben quedar en la pestaña nueva.
    setValue('tercero.numeroDocumento', '', { shouldDirty: true })
    vaciarDatos()
    clearErrors('tercero')
  }

  // Completa los datos: primero GENLOGS y, si no está, Factiliza (SUNAT para RUC, RENIEC para DNI).
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
        setValue('tercero.apellidoMaterno', datos.apellidoMaterno ?? propuesta.apellidoMaterno, opciones)
      }
      if (datos.direccion) setValue('tercero.direccion', datos.direccion, { shouldDirty: true })
      if (datos.idDistrito) {
        // SUNAT y RENIEC son de Perú: el país vuelve a Perú y se usa el distrito que trajo la consulta.
        if (esExtranjero) cambiarPais(peru ? String(peru.idPais) : '')
        elegirDistrito(datos.idDistrito)
      }
      setAutocompletado(true)
      setNumeroConsultado(numero)
    } catch {
      // El error se muestra bajo el número con consultar.isError
    }
  }

  function elegirDistrito(id: number | undefined) {
    setValue('tercero.idDistrito', id as number, { shouldValidate: id !== undefined, shouldDirty: true })
    const distrito = distritos?.find((d) => d.idDistrito === id)
    setValue('tercero.ubigeo', distrito?.ubigeo ?? '')
  }

  const errorDoc = e?.numeroDocumento?.message ?? (consultar.isError ? 'No se pudo consultar el documento. Completa los datos a mano.' : undefined)
  const ayudaDoc = AYUDA_DOCUMENTO[tipo]
  const ayudaPais = esPasaporte
    ? 'Con pasaporte la persona es del extranjero: elige su país y escribe la ubicación.'
    : 'Si no es Perú, se escribe la ubicación en lugar de elegir el distrito.'
  const resaltar = (valor: unknown) => autocompletado && typeof valor === 'string' && valor.trim() !== ''

  const nombres = watch('tercero.nombres')
  const apellidoPaterno = watch('tercero.apellidoPaterno')
  const apellidoMaterno = watch('tercero.apellidoMaterno')
  const razonSocial = watch('tercero.razonSocial')
  const direccion = watch('tercero.direccion')

  const contenido = (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {tipoFijo && <IconoTipoDocumento id={tipo} className="h-10 w-10" />}
          <h3 className="text-base font-semibold text-foreground">{info.titulo}</h3>
        </div>
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
                // Si se borra o cambia el número ya consultado, los datos de esa persona o empresa ya no valen.
                if (numeroConsultado !== null && limpio !== numeroConsultado) {
                  vaciarDatos()
                  clearErrors('tercero')
                }
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
          {textoOrigen(consultar.data?.origen, tipo)} Puedes corregir cualquier casilla.
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
          <Campo id="tercero-materno" label="Apellido materno" error={e?.apellidoMaterno?.message} obligatorio>
            <input
              id="tercero-materno"
              autoComplete="off"
              maxLength={60}
              {...register('tercero.apellidoMaterno')}
              aria-invalid={!!e?.apellidoMaterno}
              aria-describedby={describedBy('tercero-materno', { error: e?.apellidoMaterno })}
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

      <Campo id="tercero-pais" label="País" ayuda={ayudaPais} error={e?.idPais?.message} obligatorio>
        <select
          id="tercero-pais"
          value={String(esPasaporte ? (paisElegido && !esPeru(paisElegido) ? idPais : '') : (idPais ?? peru?.idPais ?? ''))}
          onChange={(ev) => cambiarPais(ev.target.value)}
          disabled={cargandoPaises || !paises?.length}
          aria-invalid={!!e?.idPais}
          aria-describedby={describedBy('tercero-pais', { error: e?.idPais, ayuda: ayudaPais })}
          className={inputFormClass}
        >
          {/* Sin lista de países (cargando o sin catálogo) se trabaja con Perú. */}
          {!paises?.length && <option value="">{cargandoPaises ? 'Cargando…' : esPasaporte ? 'Elige el país' : 'Perú'}</option>}
          {esPasaporte && !!paises?.length && <option value="">Elige el país</option>}
          {paisesVisibles?.map((p) => (
            <option key={p.idPais} value={p.idPais}>{p.nombrePais}</option>
          ))}
        </select>
      </Campo>

      {esExtranjero ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="tercero-region-extranjero" label="Región o estado" opcional error={e?.regionExtranjero?.message}>
            <input
              id="tercero-region-extranjero"
              autoComplete="address-level1"
              maxLength={100}
              placeholder="Antofagasta"
              {...register('tercero.regionExtranjero')}
              aria-invalid={!!e?.regionExtranjero}
              aria-describedby={describedBy('tercero-region-extranjero', { error: e?.regionExtranjero })}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="tercero-ciudad-extranjero" label="Ciudad" error={e?.ciudadExtranjero?.message} obligatorio>
            <input
              id="tercero-ciudad-extranjero"
              autoComplete="address-level2"
              maxLength={100}
              placeholder="Calama"
              {...register('tercero.ciudadExtranjero')}
              aria-invalid={!!e?.ciudadExtranjero}
              aria-describedby={describedBy('tercero-ciudad-extranjero', { error: e?.ciudadExtranjero })}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="tercero-cp-extranjero" label="Código postal" opcional error={e?.codigoPostalExtranjero?.message}>
            <input
              id="tercero-cp-extranjero"
              autoComplete="postal-code"
              maxLength={20}
              placeholder="1390000"
              {...register('tercero.codigoPostalExtranjero')}
              aria-invalid={!!e?.codigoPostalExtranjero}
              aria-describedby={describedBy('tercero-cp-extranjero', { error: e?.codigoPostalExtranjero })}
              className={inputFormClass}
            />
          </Campo>
        </div>
      ) : (
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
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="tercero-telefono"
          label="Teléfono con código de país"
          opcional
          error={e?.telefono?.message}
          ayuda={prefijo ? `Si lo escribes sin "+", se le pone ${prefijo}.` : 'Escribe el código del país con "+".'}
        >
          <input
            id="tercero-telefono"
            type="tel"
            maxLength={16}
            autoComplete="tel"
            placeholder={ejemploTelefono(prefijo)}
            {...register('tercero.telefono', {
              // Solo números y "+". Va dentro de register para que el valor sí llegue al formulario.
              onChange: (ev) => {
                const limpio = limpiarTelefono(ev.target.value)
                if (limpio !== ev.target.value) setValue('tercero.telefono', limpio)
              },
              // Al salir, si falta el código de país se pone el del país elegido.
              onBlur: (ev) => {
                const completo = completarPrefijo(ev.target.value, prefijo)
                if (completo !== ev.target.value) setValue('tercero.telefono', completo, { shouldDirty: true, shouldValidate: true })
              },
            })}
            aria-invalid={!!e?.telefono}
            aria-describedby={describedBy('tercero-telefono', {
              error: e?.telefono,
              ayuda: prefijo ? `Si lo escribes sin "+", se le pone ${prefijo}.` : 'Escribe el código del país con "+".',
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
  )

  // Abierto desde una pestaña: solo la página de ese documento, sin las otras pestañas.
  if (tipoFijo) {
    return <section aria-label={info.titulo} className="rounded-xl border border-border bg-card p-4">{contenido}</section>
  }

  return (
    <PestanasTipoDocumento idBase="tercero-tipo" value={tipo} onChange={cambiarTipo} compacto>
      {contenido}
    </PestanasTipoDocumento>
  )
}