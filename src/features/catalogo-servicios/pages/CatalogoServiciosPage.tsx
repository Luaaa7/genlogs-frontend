import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { listarCategoriasServicio } from "@/api/categoriasServicioApi"
import { useServicios, useCrearServicio, useActualizarServicio, useDesactivarServicio } from "../hooks/useServicios"
import { ServicioForm } from "../components/ServicioForm"
import { ServicioCard, ServicioCardSkeleton } from "../components/ServicioCard"
import { CategoriaServicioSelector } from "../components/CategoriaServicioSelector"
import type { Servicio, ServicioFormValues } from "@/types/servicio.types"

export function CatalogoServiciosPage() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [idCategoria, setIdCategoria] = useState<number | undefined>(undefined)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const { data: categorias, isLoading: cargandoCategorias } = useQuery({
    queryKey: ["categorias-servicio"],
    queryFn: listarCategoriasServicio,
  })
  const { data: servicios, isLoading, isError } = useServicios(idCategoria, !mostrarInactivos)
  const crear = useCrearServicio()
  const actualizar = useActualizarServicio(servicioEditando?.idServicio ?? 0)
  const desactivar = useDesactivarServicio()

  // La búsqueda por texto se resuelve en el cliente: el endpoint solo filtra por categoría y estado.
  const serviciosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return servicios ?? []
    return (servicios ?? []).filter(
      (s) =>
        s.nombreServicio.toLowerCase().includes(termino) ||
        s.codigoServicio.toLowerCase().includes(termino)
    )
  }, [servicios, busqueda])

  function handleNuevo() {
    setServicioEditando(null)
    setMostrarForm(true)
  }

  function handleEditar(servicio: Servicio) {
    setServicioEditando(servicio)
    setMostrarForm(true)
  }

  function handleDesactivar(servicio: Servicio) {
    if (confirm(`¿Desactivar el servicio "${servicio.nombreServicio}"?`)) {
      desactivar.mutate(servicio.idServicio)
    }
  }

  function handleSubmit(valores: ServicioFormValues) {
    if (servicioEditando) {
      actualizar.mutate(valores, {
        onSuccess: () => setMostrarForm(false),
      })
    } else {
      crear.mutate(valores, {
        onSuccess: () => setMostrarForm(false),
      })
    }
  }

  const hayFiltros = busqueda.trim() !== "" || idCategoria !== undefined

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo de Servicios</h1>
        <button
          onClick={handleNuevo}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Nuevo servicio
        </button>
      </div>

      {mostrarForm && (
        <div className="rounded-lg border border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {servicioEditando ? "Editar servicio" : "Nuevo servicio"}
            </h2>
            <button onClick={() => setMostrarForm(false)} className="text-sm text-muted-foreground">
              Cancelar
            </button>
          </div>
          <ServicioForm
            key={servicioEditando?.idServicio ?? "nuevo"}
            valoresIniciales={
              servicioEditando
                ? {
                    idCategoriaServicio: servicioEditando.categoriaServicio?.idCategoriaServicio,
                    idUnidadMedida: servicioEditando.unidadMedida?.idUnidadMedida,
                    codigoServicio: servicioEditando.codigoServicio,
                    nombreServicio: servicioEditando.nombreServicio,
                    duracionEstimadaHoras: servicioEditando.duracionEstimadaHoras,
                    visibleWeb: servicioEditando.visibleWeb,
                    descripcion: servicioEditando.descripcion,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            enviando={crear.isPending || actualizar.isPending}
          />
          {(crear.isError || actualizar.isError) && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              No se pudo guardar el servicio. Revisa los datos e intenta de nuevo.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código"
          className="min-w-64 rounded-md border border-border px-3 py-2 text-sm"
        />
        <CategoriaServicioSelector
          categorias={categorias}
          isLoading={cargandoCategorias}
          value={idCategoria}
          onChange={(id) => setIdCategoria(id || undefined)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
          />
          Incluir inactivos
        </label>
        {hayFiltros && (
          <button
            onClick={() => {
              setBusqueda("")
              setIdCategoria(undefined)
            }}
            className="text-sm text-muted-foreground underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo cargar el catálogo. Recarga la página.
        </p>
      )}

      {!isLoading && !isError && serviciosFiltrados.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {hayFiltros
            ? "Ningún servicio coincide con los filtros. Prueba con otros criterios."
            : "Aún no hay servicios registrados. Crea el primero con «Nuevo servicio»."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <ServicioCardSkeleton key={i} />)}
        {serviciosFiltrados.map((servicio) => (
          <ServicioCard
            key={servicio.idServicio}
            servicio={servicio}
            onEditar={handleEditar}
            onDesactivar={handleDesactivar}
          />
        ))}
      </div>
    </div>
  )
}
