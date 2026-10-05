import { useMemo, useState } from 'react'
import { Plus, Search, Truck } from 'lucide-react'
import { useProveedores, useCrearProveedor } from '../hooks/useProveedores'
import { codigoTipoDocumento } from '@/types/tercero.types'
import { ProveedorForm } from '../components/ProveedorForm'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { PageHeader } from '@/components/ui/PageHeader'
import { PanelLateral } from '@/components/ui/PanelLateral'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Tabla, TablaCard, Td, Th, controlClass, filaClass } from '@/components/ui/tabla'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

export default function ProveedoresListPage() {
  const { data = [], isLoading, isError, refetch } = useProveedores()
  const crear = useCrearProveedor()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  // La lista completa ya viene del servidor: se filtra aquí.
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return data
    return data.filter((p) =>
      [p.tercero.razonSocial, p.tercero.nombreComercial, p.tercero.numeroDocumento].some((v) => v?.toLowerCase().includes(q))
    )
  }, [data, busqueda])

  const nuevo = (
    <Button onClick={() => setMostrarForm(true)}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      Nuevo proveedor
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Proveedores"
        descripcion={<><span className="tabular-nums">{data.length}</span> proveedores de repuestos y servicios</>}
        acciones={nuevo}
      />

      {isError && <ErrorBanner message="No se pudo cargar la lista de proveedores." onRetry={() => refetch()} />}

      <TablaCard
        barra={
          <div className="relative flex w-full items-center sm:w-96">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <label className="sr-only" htmlFor="buscar-proveedor">Buscar proveedor</label>
            <input
              id="buscar-proveedor"
              type="search"
              className={cn(controlClass, 'w-full pl-9')}
              placeholder="RUC o razón social"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        }
      >
        {!isLoading && filtrados.length === 0 ? (
          <EstadoVacio
            icono={<Truck className="h-5.5 w-5.5" />}
            titulo={busqueda ? `Sin resultados para "${busqueda}"` : 'Aún no hay proveedores'}
            descripcion={busqueda ? 'Revisa el RUC o busca por otra parte del nombre.' : 'Registra el primero con su RUC: los datos se completan desde SUNAT.'}
            accion={busqueda ? undefined : nuevo}
          />
        ) : (
          <Tabla titulo="Proveedores">
            <thead>
              <tr>
                <Th>Proveedor</Th>
                <Th>Documento</Th>
                <Th>Dirección</Th>
                <Th>Contacto</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={4} />
              ) : (
                filtrados.map((p) => (
                  <tr key={p.idProveedor ?? p.id} className={filaClass}>
                    <Td>
                      <p className="font-medium text-foreground">{p.tercero.razonSocial}</p>
                      {p.tercero.nombreComercial && <p className="text-xs text-muted-foreground">{p.tercero.nombreComercial}</p>}
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">
                      <span className="text-muted-foreground">{codigoTipoDocumento(p.tercero.tipoDocumento)}</span> {p.tercero.numeroDocumento}
                    </Td>
                    <Td>{p.tercero.direccion || '—'}</Td>
                    <Td>
                      <p>{p.tercero.email || p.tercero.correo || '—'}</p>
                      {p.tercero.telefono && <p className="text-xs tabular-nums text-muted-foreground">{p.tercero.telefono}</p>}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Tabla>
        )}
      </TablaCard>

      <PanelLateral
        abierto={mostrarForm}
        titulo="Nuevo proveedor"
        descripcion="Ingresa el RUC y los datos se completan desde SUNAT."
        onCerrar={() => setMostrarForm(false)}
      >
        <ProveedorForm
          isSubmitting={crear.isPending}
          serverError={crear.isError ? 'No se pudo guardar el proveedor. Revisa los datos e intenta de nuevo.' : ''}
          onSubmit={(d) => crear.mutate(d, { onSuccess: () => setMostrarForm(false) })}
        />
      </PanelLateral>
    </div>
  )
}
