import { Link } from 'react-router-dom'
import { Search, Users, Edit2 } from 'lucide-react'
import type { Cliente, FiltrosCliente } from '../../../types/cliente.types'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Tabla, TablaCard, Td, Th, controlClass, filaClass } from '@/components/ui/tabla'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import type { TipoDocumentoId } from '../constants/tiposDocumento'

interface Props {
  clientes: Cliente[]
  filtros: FiltrosCliente
  onFiltrosChange: (f: FiltrosCliente) => void
  isLoading?: boolean
  /** Pestaña abierta: cambia las columnas y la búsqueda. */
  tipo: TipoDocumentoId
  /** Acción para el estado vacío sin filtros (p. ej. abrir "Nueva empresa"). */
  accionVacio?: React.ReactNode
  /** Callback cuando se solicita editar un cliente. */
  onEditar?: (cliente: Cliente) => void
}

const TEXTOS: Record<TipoDocumentoId, { buscar: string; documento: string; vacio: string; vacioDescripcion: string }> = {
  1: {
    buscar: 'Buscar por RUC o razón social',
    documento: 'RUC',
    vacio: 'Aún no hay empresas',
    vacioDescripcion: 'Registra la primera con su RUC: los datos se completan desde SUNAT.',
  },
  2: {
    buscar: 'Buscar por DNI, nombres o apellidos',
    documento: 'DNI',
    vacio: 'Aún no hay personas con DNI',
    vacioDescripcion: 'Registra la primera con su DNI: los datos se completan desde RENIEC.',
  },
  4: {
    buscar: 'Buscar por pasaporte, nombres o apellidos',
    documento: 'Pasaporte',
    vacio: 'Aún no hay clientes extranjeros',
    vacioDescripcion: 'Regístralos con su número de pasaporte y sus datos.',
  },
}

export function ClienteTable({ clientes, filtros, onFiltrosChange, isLoading, tipo, accionVacio, onEditar }: Props) {
  const busqueda = filtros.documento ?? filtros.razonSocial ?? ''
  const textos = TEXTOS[tipo]
  const esPersona = tipo !== 1
  const columnas = (esPersona ? 5 : 3) + (onEditar ? 1 : 0)

  const enlace = (c: Cliente, texto: string) => (
    <Link to={`/clientes/${c.idCliente ?? c.id}`} className="rounded font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {texto}
    </Link>
  )

  return (
    <TablaCard
      barra={
        <div className="relative flex w-full items-center sm:w-96">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <label className="sr-only" htmlFor="buscar-cliente">{textos.buscar}</label>
          <input
            id="buscar-cliente"
            type="search"
            className={cn(controlClass, 'w-full pl-9')}
            placeholder={textos.buscar}
            value={busqueda}
            onChange={(e) => onFiltrosChange({ ...filtros, documento: e.target.value || undefined, razonSocial: e.target.value || undefined })}
          />
        </div>
      }
    >
      {!isLoading && clientes.length === 0 ? (
        <EstadoVacio
          icono={<Users className="h-5.5 w-5.5" />}
          titulo={busqueda ? `Sin resultados para "${busqueda}"` : textos.vacio}
          descripcion={busqueda ? 'Revisa el número de documento o busca por otra parte del nombre.' : textos.vacioDescripcion}
          accion={busqueda ? undefined : accionVacio}
        />
      ) : (
        <Tabla titulo="Clientes" minWidth={esPersona ? 860 : 720}>
          <thead>
            <tr>
              <Th>{textos.documento}</Th>
              {esPersona ? (
                <>
                  <Th>Nombres</Th>
                  <Th>Apellido paterno</Th>
                  <Th>Apellido materno</Th>
                </>
              ) : (
                <Th>Razón social</Th>
              )}
              <Th>Contacto</Th>
              {onEditar && <Th className="text-right">Acciones</Th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows columns={columnas} />
            ) : (
              clientes.map((c) => {
                const t = c.tercero
                // Registros anteriores a la separación de apellidos: solo tienen el nombre completo.
                const conApellidos = !!(t.nombres || t.apellidoPaterno)
                return (
                  <tr key={c.idCliente ?? c.id} className={filaClass}>
                    <Td className="whitespace-nowrap font-medium tabular-nums">{t.numeroDocumento}</Td>
                    {esPersona ? (
                      <>
                        <Td>{enlace(c, conApellidos ? (t.nombres ?? '—') : t.razonSocial)}</Td>
                        <Td>{conApellidos ? (t.apellidoPaterno || '—') : '—'}</Td>
                        <Td>{conApellidos ? (t.apellidoMaterno || '—') : '—'}</Td>
                      </>
                    ) : (
                      <Td>
                        {enlace(c, t.razonSocial)}
                        {t.nombreComercial && <p className="text-xs text-muted-foreground">{t.nombreComercial}</p>}
                      </Td>
                    )}
                    <Td>
                      <p>{t.email || t.correo || '—'}</p>
                      {t.telefono && <p className="text-xs tabular-nums text-muted-foreground">{t.telefono}</p>}
                    </Td>
                    {onEditar && (
                      <Td className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditar(c)}
                          aria-label={`Editar cliente ${t.razonSocial}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </Tabla>
      )}
    </TablaCard>
  )
}