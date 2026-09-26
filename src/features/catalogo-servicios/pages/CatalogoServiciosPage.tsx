import { useState } from "react"
import { useServicios, useCrearServicio, useActualizarServicio, useDesactivarServicio } from "../hooks/useServicios"
import { ServicioForm } from "../components/ServicioForm"
import { ServicioCard } from "../components/ServicioCard"
import type { Servicio, ServicioFormValues } from "@/types/servicio.types"

export function CatalogoServiciosPage() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null)

  const { data: servicios, isLoading } = useServicios()
  const crear = useCrearServicio()
  const actualizar = useActualizarServicio(servicioEditando?.idServicio ?? 0)
  const desactivar = useDesactivarServicio()

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
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Cargando servicios...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servicios?.map((servicio) => (
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