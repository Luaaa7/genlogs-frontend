import { useMemo, useState } from 'react'
import { avisar } from '@/lib/avisos'
import { Edit2, Plus, Search, Truck } from 'lucide-react'
import { useProveedores, useCrearProveedor, useActualizarProveedor } from '../hooks/useProveedores'
import { codigoTipoDocumento } from '@/types/tercero.types'
import { ProveedorForm } from '../components/ProveedorForm'
import { valoresTerceroParaEditar } from '@/lib/utils/valoresIniciales'
import type { Proveedor, ProveedorRequest } from '../../../types/proveedor.types'
import type { ProveedorFormValues } from '../../../lib/validators/rucDni.schema'
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
  const actualizar = useActualizarProveedor()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // La lista completa ya viene del servidor: se filtra aquí.
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return data
    return data.filter((p) =>
      [p.tercero.razonSocial, p.tercero.nombreComercial, p.tercero.numeroDocumento].some((v) => v?.toLowerCase().includes(q))
    )
  }, [data, busqueda])

  const abrirNuevo = () => {
    setEditando(null)
    setMostrarForm(true)
  }
  const abrirEditar = (p: Proveedor) => {
    setEditando(p)
    setMostrarForm(true)
  }
  const cerrarPanel = () => {
    setMostrarForm(false)
    setEditando(null)
  }
  const enviar = (d: ProveedorRequest) => {
    const idProveedor = editando ? (editando.idProveedor ?? editando.id) : undefined
    if (editando && idProveedor != null) {
      actualizar.mutate({ id: idProveedor, data: d }, { onSuccess: () => { cerrarPanel(); avisar(`Proveedor ${d.tercero.razonSocial} actualizado`) } })
    } else {
      crear.mutate(d, { onSuccess: () => { cerrarPanel(); avisar(`Proveedor ${d.tercero.razonSocial} registrado`) } })
    }
  }

  const nuevo = (
    <Button onClick={abrirNuevo}>
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
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={5} />
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
                    <Td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEditar(p)}
                        aria-label={`Editar proveedor ${p.tercero.razonSocial}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
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
        titulo={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
        descripcion={editando ? 'Modifica los datos del proveedor seleccionado.' : 'Ingresa el RUC y los datos se completan desde SUNAT.'}
        onCerrar={cerrarPanel}
      >
        <ProveedorForm
          key={editando ? `editar-${editando.idProveedor ?? editando.id}` : 'nuevo'}
          defaultValues={editando ? ({ tercero: valoresTerceroParaEditar(editando.tercero), situacion: editando.situacion } as Partial<ProveedorFormValues>) : undefined}
          isSubmitting={editando ? actualizar.isPending : crear.isPending}
          serverError={
            editando
              ? actualizar.isError ? 'No se pudo actualizar el proveedor. Revisa los datos e intenta de nuevo.' : ''
              : crear.isError ? 'No se pudo guardar el proveedor. Revisa los datos e intenta de nuevo.' : ''
          }
          onSubmit={enviar}
        />
      </PanelLateral>
    </div>
  )
}
