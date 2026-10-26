import { useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Building2, Plus, Search, X } from 'lucide-react'
import type { Cliente, ClienteRequest } from '@/types/cliente.types'
import type { ClienteFormValues } from '@/lib/validators/rucDni.schema'
import { ClienteForm } from '@/features/clientes-proveedores/components/ClienteForm'
import { useCrearCliente } from '@/features/clientes-proveedores/hooks/useCrearCliente'
import { PanelLateral } from '@/components/ui/PanelLateral'
import { Button } from '@/components/ui/button'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { cn } from '@/lib/utils/utils'

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
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Tipo de documento según la cantidad de dígitos: 11 = RUC (1), 8 = DNI (2). */
function tipoPorDigitos(texto: string): 1 | 2 | null {
  if (/^\d{11}$/.test(texto)) return 1
  if (/^\d{8}$/.test(texto)) return 2
  return null
}

/**
 * Buscador de cliente por RUC, DNI o razón social, en lugar de una lista
 * desplegable con todos los clientes. Busca primero entre los clientes ya
 * registrados en la base de datos; si el RUC/DNI no es cliente, ofrece
 * registrarlo ahí mismo (panel lateral) y lo deja seleccionado.
 */
export function ClienteBuscador({ id, clientes, isLoading = false, value, onChange, invalid, describedBy }: Props) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const [creando, setCreando] = useState(false)
  const listaId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const crear = useCrearCliente()

  const seleccionado = clientes.find((c) => idDe(c) === value)
  const consulta = texto.trim()
  const soloDigitos = consulta.replace(/\D/g, '')
  const esDocumento = consulta !== '' && /^\d+$/.test(consulta)

  const resultados = useMemo(() => {
    if (!consulta) return []
    const q = normalizar(consulta)
    return clientes
      .filter((c) =>
        esDocumento
          ? (c.tercero?.numeroDocumento ?? '').startsWith(soloDigitos)
          : normalizar(c.tercero?.razonSocial).includes(q)
      )
      .slice(0, MAX_RESULTADOS)
  }, [clientes, consulta, esDocumento, soloDigitos])

  const tipoNuevo = tipoPorDigitos(soloDigitos)
  const puedeCrear = esDocumento && tipoNuevo !== null && resultados.length === 0

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
      <div className="flex items-center gap-3 rounded-md border border-accent bg-accent/5 px-3 py-2.5">
        <Building2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{seleccionado.tercero?.razonSocial}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{seleccionado.tercero?.numeroDocumento}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={limpiar} aria-label="Cambiar cliente">
          <X className="mr-1 h-4 w-4" aria-hidden="true" />
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
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
          placeholder={isLoading ? 'Cargando clientes…' : 'Escribe el RUC, DNI o razón social'}
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

      {abierto && consulta !== '' && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
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
                  ? `No hay ningún cliente con ${tipoNuevo === 1 ? 'RUC' : 'DNI'} ${soloDigitos}.`
                  : esDocumento
                    ? 'Sigue escribiendo: el RUC tiene 11 dígitos y el DNI 8.'
                    : 'Ningún cliente coincide con ese nombre.'}
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
            titulo="Nuevo cliente"
            descripcion="Completa los datos con Buscar (SUNAT/RENIEC). Al guardar, queda elegido en la cotización."
            onCerrar={() => setCreando(false)}
          >
            {creando && (
              <ClienteForm
                isSubmitting={crear.isPending}
                serverError={crear.isError ? 'No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.' : undefined}
                valoresIniciales={{
                  tercero: { idTipoDocumento: tipoNuevo ?? 1, numeroDocumento: soloDigitos },
                } as Partial<ClienteFormValues>}
                onSubmit={guardarNuevo}
              />
            )}
          </PanelLateral>
        </div>,
        document.body
      )}
    </div>
  )
}