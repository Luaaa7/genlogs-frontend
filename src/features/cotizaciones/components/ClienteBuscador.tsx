import { useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, X } from 'lucide-react'
import type { Cliente, ClienteRequest } from '@/types/cliente.types'
import { codigoTipoDocumento } from '@/types/tercero.types'
import type { ClienteFormValues } from '@/lib/validators/rucDni.schema'
import { ClienteForm } from '@/features/clientes-proveedores/components/ClienteForm'
import { useCrearCliente } from '@/features/clientes-proveedores/hooks/useCrearCliente'
import { PanelLateral } from '@/components/ui/PanelLateral'
import { Button } from '@/components/ui/button'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { cn } from '@/lib/utils/utils'
import { IconoTipoDocumento, PestanasTipoDocumento } from '@/features/clientes-proveedores/components/PestanasTipoDocumento'
import { infoTipoDocumento, type TipoDocumentoId } from '@/features/clientes-proveedores/constants/tiposDocumento'

interface Props {
  /** Id del input (lo une con el label del Campo). */
  id: string
  clientes: Cliente[]
  isLoading?: boolean
  value?: number
  onChange: (idCliente: number | undefined) => void
  invalid?: boolean
  describedBy?: string
}

const MAX_RESULTADOS = 8

const idDe = (c: Cliente) => c.idCliente ?? c.id
const normalizar = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** Pestañas del buscador. Los ids son los de tipo_documento (1 RUC, 2 DNI, 4 Pasaporte). */
type TipoBusqueda = TipoDocumentoId
const PESTANAS: { id: TipoBusqueda; label: string; placeholder: string; ayuda: string }[] = [
  { id: 1, label: 'RUC', placeholder: 'Escribe el RUC o la razón social', ayuda: 'el RUC tiene 11 dígitos' },
  { id: 2, label: 'DNI', placeholder: 'Escribe el DNI, los nombres o los apellidos', ayuda: 'el DNI tiene 8 dígitos' },
  { id: 4, label: 'Pasaporte', placeholder: 'Escribe el pasaporte, los nombres o los apellidos', ayuda: 'el pasaporte tiene de 6 a 12 caracteres' },
]

/** Tipo de documento del cliente (por su código; si no llegó, por la forma del número). */
function tipoDelCliente(c: Cliente): number {
  const codigo = codigoTipoDocumento(c.tercero?.tipoDocumento).toUpperCase()
  if (codigo === 'RUC') return 1
  if (codigo === 'DNI') return 2
  if (codigo === 'CE') return 3
  if (codigo.startsWith('PAS')) return 4
  const n = c.tercero?.numeroDocumento ?? ''
  return /^\d{11}$/.test(n) ? 1 : /^\d{8}$/.test(n) ? 2 : 4
}

/** ¿El texto ya es un documento completo del tipo de la pestaña? */
function documentoCompleto(tipo: TipoBusqueda, texto: string): boolean {
  if (tipo === 1) return /^(10|20)\d{9}$/.test(texto)
  if (tipo === 2) return /^\d{8}$/.test(texto)
  return /^[A-Z0-9]{6,12}$/.test(texto)
}

/**
 * Buscador de cliente por RUC, DNI o razón social, en lugar de una lista
 * desplegable con todos los clientes. Busca primero entre los clientes ya
 * registrados en la base de datos; si el RUC/DNI no es cliente, ofrece
 * registrarlo ahí mismo (panel lateral) y lo deja seleccionado.
 */
export function ClienteBuscador({ id, clientes, isLoading = false, value, onChange, invalid, describedBy }: Props) {
  const [tipo, setTipo] = useState<TipoBusqueda>(1)
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const [creando, setCreando] = useState(false)
  const listaId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const crear = useCrearCliente()

  const seleccionado = clientes.find((c) => idDe(c) === value)
  const pestana = PESTANAS.find((p) => p.id === tipo) ?? PESTANAS[0]
  const consulta = texto.trim()
  // RUC y DNI son solo números; el pasaporte puede llevar letras.
  const documento = tipo === 4 ? consulta.toUpperCase().replace(/[^A-Z0-9]/g, '') : consulta.replace(/\D/g, '')
  const esDocumento = consulta !== '' && (tipo === 4 ? /\d/.test(consulta) && /^[A-Za-z0-9-]+$/.test(consulta) : /^\d+$/.test(consulta))

  // Solo los clientes del tipo de la pestaña.
  const delTipo = useMemo(() => clientes.filter((c) => tipoDelCliente(c) === tipo), [clientes, tipo])

  const resultados = useMemo(() => {
    if (!consulta) return []
    const q = normalizar(consulta)
    return delTipo
      .filter((c) =>
        esDocumento
          ? (c.tercero?.numeroDocumento ?? '').toUpperCase().startsWith(documento)
          : normalizar(c.tercero?.razonSocial).includes(q)
      )
      .slice(0, MAX_RESULTADOS)
  }, [delTipo, consulta, esDocumento, documento])

  const puedeCrear = esDocumento && documentoCompleto(tipo, documento) && resultados.length === 0

  function cambiarTipo(nuevo: TipoBusqueda) {
    setTipo(nuevo)
    setTexto('')
    setActivo(0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function elegir(c: Cliente) {
    onChange(idDe(c))
    setTexto('')
    setAbierto(false)
  }

  function limpiar() {
    onChange(undefined)
    setTexto('')
    setAbierto(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAbierto(true)
      setActivo((i) => Math.min(i + 1, Math.max(resultados.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (resultados[activo]) elegir(resultados[activo])
      else if (puedeCrear) setCreando(true)
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  function guardarNuevo(data: ClienteRequest) {
    crear.mutate(data, {
      onSuccess: (nuevo) => {
        onChange(nuevo.idCliente)
        setTexto('')
        setCreando(false)
      },
    })
  }

  // Cliente ya elegido: tarjeta con sus datos y opción de cambiarlo.
  if (seleccionado) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent bg-accent/5 px-4 py-3">
        <IconoTipoDocumento id={tipoDelCliente(seleccionado)} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{seleccionado.tercero?.razonSocial}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {infoTipoDocumento(tipoDelCliente(seleccionado)).label} {seleccionado.tercero?.numeroDocumento}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={limpiar} aria-label="Cambiar cliente">
          <X className="mr-1 h-4 w-4" aria-hidden="true" />
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <PestanasTipoDocumento idBase="cot-cliente-tipo" ariaLabel="Tipo de documento del cliente" value={tipo} onChange={cambiarTipo} disabled={isLoading}>
    <div className="relative flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{infoTipoDocumento(tipo).titulo}</p>
        <p className="text-xs text-muted-foreground">Busca entre tus clientes o registra uno nuevo</p>
      </div>
      <div className="flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto && consulta !== ''}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={isLoading}
          value={texto}
          placeholder={isLoading ? 'Cargando clientes…' : pestana.placeholder}
          onChange={(e) => {
            setTexto(e.target.value)
            setAbierto(true)
            setActivo(0)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={onKeyDown}
          className={cn(inputFormClass, 'pl-9')}
        />
      </div>
      <Button type="button" variant="outline" className="shrink-0" onClick={() => setCreando(true)} disabled={isLoading}>
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
        {tipo === 1 ? 'Nueva empresa' : tipo === 2 ? 'Nueva persona' : 'Nuevo extranjero'}
      </Button>
      </div>

      {abierto && consulta !== '' && (
        <div className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {resultados.length > 0 ? (
            <ul id={listaId} role="listbox" className="max-h-72 overflow-y-auto py-1">
              {resultados.map((c, i) => (
                <li
                  key={idDe(c)}
                  role="option"
                  aria-selected={i === activo}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    elegir(c)
                  }}
                  onMouseEnter={() => setActivo(i)}
                  className={cn('cursor-pointer px-3 py-2 text-sm', i === activo ? 'bg-muted' : 'hover:bg-muted')}
                >
                  <span className="block truncate font-medium text-foreground">{c.tercero?.razonSocial}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">{c.tercero?.numeroDocumento}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div id={listaId} className="flex flex-col gap-2 px-3 py-3 text-sm">
              <p className="text-muted-foreground">
                {puedeCrear
                  ? `No hay ningún cliente con ${pestana.label} ${documento}.`
                  : esDocumento
                    ? tipo === 1 && documento.length === 11
                      ? 'El RUC debe empezar con 10 o 20.'
                      : `Sigue escribiendo: ${pestana.ayuda}.`
                    : `Ningún cliente con ${pestana.label} coincide con ese nombre.`}
              </p>
              {puedeCrear && (
                <Button
                  type="button"
                  size="sm"
                  className="self-start"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCreando(true)}
                >
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Registrar como cliente nuevo
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* El panel va en un portal y corta el evento submit: así el formulario
          del cliente no queda dentro del formulario de la cotización ni lo envía. */}
      {createPortal(
        <div onSubmit={(e) => e.stopPropagation()}>
          <PanelLateral
            abierto={creando}
            titulo={tipo === 1 ? 'Nueva empresa' : tipo === 2 ? 'Nueva persona' : 'Nuevo extranjero'}
            descripcion={tipo === 4
              ? 'Completa los datos del titular del pasaporte. Al guardar, queda elegido en la cotización.'
              : `Los datos se completan desde ${tipo === 1 ? 'SUNAT' : 'RENIEC'}. Al guardar, queda elegido en la cotización.`}
            onCerrar={() => setCreando(false)}
          >
            {creando && (
              <ClienteForm
                isSubmitting={crear.isPending}
                serverError={crear.isError ? 'No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.' : undefined}
                valoresIniciales={{
                  tercero: { idTipoDocumento: tipo, numeroDocumento: puedeCrear ? documento : '' },
                } as Partial<ClienteFormValues>}
                onSubmit={guardarNuevo}
                tipoFijo={tipo}
              />
            )}
          </PanelLateral>
        </div>,
        document.body
      )}
    </div>
    </PestanasTipoDocumento>
  )
}
