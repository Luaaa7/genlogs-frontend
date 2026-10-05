import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import type { Cliente, FiltrosCliente } from '../../../types/cliente.types'
import { codigoTipoDocumento } from '../../../types/tercero.types'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Tabla, TablaCard, Td, Th, controlClass, filaClass } from '@/components/ui/tabla'
import { cn } from '@/lib/utils/utils'

interface Props {
  clientes: Cliente[]
  filtros: FiltrosCliente
  onFiltrosChange: (f: FiltrosCliente) => void
  isLoading?: boolean
  /** Acción para el estado vacío sin filtros (p. ej. abrir "Nuevo cliente"). */
  accionVacio?: React.ReactNode
}

export function ClienteTable({ clientes, filtros, onFiltrosChange, isLoading, accionVacio }: Props) {
  const busqueda = filtros.documento ?? filtros.razonSocial ?? ''

  return (
    <TablaCard
      barra={
        <div className="relative flex w-full items-center sm:w-96">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <label className="sr-only" htmlFor="buscar-cliente">Buscar por DNI, RUC o razón social</label>
          <input
            id="buscar-cliente"
            type="search"
            className={cn(controlClass, 'w-full pl-9')}
            placeholder="DNI, RUC o razón social"
            value={busqueda}
            onChange={(e) => onFiltrosChange({ ...filtros, documento: e.target.value || undefined, razonSocial: e.target.value || undefined })}
          />
        </div>
      }
    >
      {!isLoading && clientes.length === 0 ? (
        <EstadoVacio
          icono={<Users className="h-5.5 w-5.5" />}
          titulo={busqueda ? `Sin resultados para "${busqueda}"` : 'Aún no hay clientes'}
          descripcion={busqueda ? 'Revisa el número de documento o busca por otra parte del nombre.' : 'Registra el primero con su RUC: los datos se completan desde SUNAT.'}
          accion={busqueda ? undefined : accionVacio}
        />
      ) : (
        <Tabla titulo="Clientes">
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Documento</Th>
              <Th>Contacto</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows columns={3} />
            ) : (
              clientes.map((c) => (
                <tr key={c.idCliente ?? c.id} className={filaClass}>
                  <Td>
                    <Link to={`/clientes/${c.idCliente ?? c.id}`} className="rounded font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {c.tercero.razonSocial}
                    </Link>
                    {c.tercero.nombreComercial && <p className="text-xs text-muted-foreground">{c.tercero.nombreComercial}</p>}
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    <span className="text-muted-foreground">{codigoTipoDocumento(c.tercero.tipoDocumento)}</span> {c.tercero.numeroDocumento}
                  </Td>
                  <Td>
                    <p>{c.tercero.email || c.tercero.correo || '—'}</p>
                    {c.tercero.telefono && <p className="text-xs tabular-nums text-muted-foreground">{c.tercero.telefono}</p>}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Tabla>
      )}
    </TablaCard>
  )
}
