import { useFormContext } from 'react-hook-form'
import { Loader2, Search, Info, User, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ClienteFormValues } from '../../../lib/validators/rucDni.schema'
import { useConsultarDocumento } from '../hooks/useConsultarDocumento'
import { listarDistritos } from '@/api/distritosApi'
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
] as const

/** Tipos que soportan autocompletado vía Factiliza (backend). */
const TIPOS_CON_AUTOCONSULTA = new Set([1, 2]) // RUC, DNI

/** Campos del tercero (documento, datos fiscales y contacto) con autocompletado
 *  por RUC/DNI (RF-08). Debe ir dentro de un <FormProvider>. */
export function CamposTercero() {
  const { register, setValue, getValues, trigger, setError, watch, formState: { errors } } = useFormContext<ConTercero>()
  const e = errors.tercero
  const consultar = useConsultarDocumento()

  // Watch document type and number to react to changes
  const tipoDocActual = watch('tercero.idTipoDocumento')
  const numeroDocumentoActual = watch('tercero.numeroDocumento')

  // Clear incompatible fields when document type changes
  useEffect(() => {
    if (tipoDocActual === 2 || tipoDocActual === 1) {
      // The field will be repopulated by search or user input
    }
  }, [tipoDocActual])

  // Entrada en tiempo real: el valor se filtra ANTES de que react-hook-form lo
  // lea, de modo que el form siempre recibe el dato ya saneado. Se conserva
  // `valueAsNumber` donde el schema espera un número.
  const { onChange: onChangeDistrito, ...propsDistrito } = register('tercero.idDistrito', { valueAsNumber: true })
  const { onChange: onChangeTelefono, ...propsTelefono } = register('tercero.telefono')
  const { onChange: onChangeCorreo, ...propsCorreo } = register('tercero.correo')

  // Catálogo de distritos (buscador)
  const { data: distritos = [], isLoading: cargandoDistritos, isError: errorDistritos } = useQuery({
    queryKey: ['distritos'],
    queryFn: listarDistritos,
    staleTime: 10 * 60_000,
  })

  // Completa datos desde Factiliza (vía backend)
  async function buscarDocumento() {
    const numero = getValues('tercero.numeroDocumento')?.trim()
    if (!numero) return
    
    // Validar longitud según tipo
    if (tipoDocActual === 1 && !/^\d{11}$/.test(numero)) return // RUC: 11 dígitos
    if (tipoDocActual === 2 && !/^\d{8}$/.test(numero)) return // DNI: 8 dígitos
    if (!TIPOS_CON_AUTOCONSULTA.has(tipoDocActual ?? 0)) return

    try {
      const datos = await consultar.mutateAsync(numero)
      
      if (tipoDocActual === 2) {
        // DNI: usar nombres y apellidos si vienen separados, si no usar razonSocial
        const nombresCompletos = datos.nombres && datos.apellidos
          ? `${datos.nombres} ${datos.apellidos}`.trim()
          : datos.razonSocial
        if (nombresCompletos) {
          setValue('tercero.razonSocial', nombresCompletos, { shouldValidate: true })
        }
      } else if (tipoDocActual === 1) {
        // RUC: usar razonSocial directamente
        if (datos.razonSocial) {
          setValue('tercero.razonSocial', datos.razonSocial, { shouldValidate: true })
        }
      }
      
      if (datos.direccion) {
        setValue('tercero.direccion', datos.direccion)
      }
    } catch {
      // El error se muestra bajo el campo con consultar.isError
    }
  }

  const tieneAutoconsulta = tipoDocActual != null && TIPOS_CON_AUTOCONSULTA.has(tipoDocActual)
  const esDNI = tipoDocActual === 2
  const esRUC = tipoDocActual === 1

  const errorDoc = e?.numeroDocumento?.message ?? (consultar.isError ? 'No se pudo consultar el documento. Completa los datos a mano.' : undefined)
  const ayudaDoc = consultar.data?.simulado
    ? 'Datos simulados: la consulta a SUNAT/RENIEC aún no está conectada.'
    : tieneAutoconsulta
      ? esDNI
        ? 'Con "Buscar" se completan los nombres, apellidos y la dirección.'
        : 'Con "Buscar" se completan la razón social y la dirección.'
      : 'El autocompletado solo está disponible para RUC y DNI.'

  // Label dinámico según tipo de documento
  const labelIdentidad = esDNI ? 'Nombres y apellidos' : 'Razón social'
  const placeholderIdentidad = esDNI ? 'Juan Pérez García' : 'Empresa SAC'
  const Icono = esDNI ? User : Building2

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
                placeholder={tipoDocActual === 1 ? '20512345671' : tipoDocActual === 2 ? '12345678' : ''}
                {...register('tercero.numeroDocumento')}
                aria-invalid={!!errorDoc}
                aria-describedby={describedBy('tercero-numero', { error: errorDoc, ayuda: ayudaDoc })}
                className={inputFormClass}
                disabled={consultar.isPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void buscarDocumento()}
                disabled={consultar.isPending || !tieneAutoconsulta || !numeroDocumentoActual?.trim()}
                title={tieneAutoconsulta ? undefined : 'Autocompletado solo disponible para RUC y DNI'}
              >
                {consultar.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  : <Search className="mr-2 h-4 w-4" aria-hidden="true" />}
                Buscar
              </Button>
              {!tieneAutoconsulta && (
                <span title="Autocompletado solo disponible para RUC y DNI" className="self-center">
                  <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </span>
              )}
            </div>
          </Campo>
        </div>

        {/* Campo de identidad condicional: Nombres y apellidos (DNI) o Razón social (RUC) */}
        {(esDNI || esRUC) && (
          <Campo
            id="tercero-razon"
            label={labelIdentidad}
            error={e?.razonSocial?.message}
          >
            <div className="relative">
              <Icono className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="tercero-razon"
                autoComplete={esDNI ? 'name' : 'organization'}
                placeholder={placeholderIdentidad}
                {...register('tercero.razonSocial')}
                aria-invalid={!!e?.razonSocial}
                aria-describedby={describedBy('tercero-razon', { error: e?.razonSocial })}
                className={`${inputFormClass} pl-10`}
              />
            </div>
          </Campo>
        )}

        {/* Para CE y Pasaporte, mostrar el campo tradicional de Razón social */}
        {tipoDocActual && !esDNI && !esRUC && (
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
        )}
      </SeccionForm>

      <SeccionForm titulo="Ubicación y contacto">
        <Campo id="tercero-direccion" label="Dirección" opcional>
          <input id="tercero-direccion" autoComplete="street-address" maxLength={255} {...register('tercero.direccion')} className={inputFormClass} />
        </Campo>
        <Campo
          id="tercero-distrito"
          label="Distrito"
          ayuda={cargandoDistritos ? 'Cargando catálogo de distritos…' : errorDistritos ? 'No se pudo cargar el catálogo. Ingrese el código manualmente.' : 'Busque y seleccione el distrito; el código se completará automáticamente.'}
          error={e?.idDistrito?.message}
        >
          <div className="flex flex-col gap-2">
            {cargandoDistritos ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Cargando distritos…</span>
              </div>
            ) : (
              <select
                id="tercero-distrito"
                {...propsDistrito}
                onChange={(ev) => onChangeDistrito({ ...ev, target: { ...ev.target, value: Number(ev.target.value) || '' } })}
                aria-invalid={!!e?.idDistrito}
                aria-describedby={describedBy('tercero-distrito', { error: e?.idDistrito, ayuda: true })}
                className={inputFormClass}
                disabled={distritos.length === 0}
              >
                <option value="">— Seleccione un distrito —</option>
                {distritos.map((d) => (
                  <option key={d.idDistrito} value={d.idDistrito}>
                    {d.nombreDistrito} {d.provincia && `(${d.provincia})`} {d.departamento && `- ${d.departamento}`}
                  </option>
                ))}
              </select>
            )}
            {distritos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {distritos.length} distritos disponibles. Escriba para filtrar por nombre.
              </p>
            )}
            {errorDistritos && distritos.length === 0 && (
              <div className="flex gap-2">
                <input
                  id="tercero-distrito-manual"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  {...propsDistrito}
                  onChange={(ev) => {
                    ev.target.value = ev.target.value.replace(/\D/g, '')
                    onChangeDistrito(ev)
                  }}
                  aria-invalid={!!e?.idDistrito}
                  aria-describedby={describedBy('tercero-distrito', { error: e?.idDistrito, ayuda: true })}
                  className={`${inputFormClass} max-w-40`}
                  placeholder="Código de distrito (manual)"
                />
                <span className="text-xs text-destructive self-center">Catálogo no disponible; ingrese el código manualmente.</span>
              </div>
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
              {...propsTelefono}
              onChange={(ev) => {
                ev.target.value = ev.target.value.replace(/[^0-9+]/g, '')
                onChangeTelefono(ev)
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
              {...propsCorreo}
              onChange={(ev) => {
                onChangeCorreo(ev)
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
