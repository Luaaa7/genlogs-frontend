import { useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { avisar } from "@/lib/avisos"
import { useActualizarServicio, useCrearServicio, useServicio } from "../hooks/useServicios"
import { ServicioForm } from "../components/ServicioForm"
import type { ServicioConImagen } from "@/api/serviciosApi"

function mensajeDe(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "No se pudo guardar el servicio. Revisa los datos e intenta de nuevo."
  )
}

/**
 * Nuevo servicio (/catalogo-servicios/nuevo) y editar servicio
 * (/catalogo-servicios/:id/editar) en su propia página, igual que los productos:
 * antes el formulario se abría arriba del catálogo y había que subir para verlo.
 */
export function ServicioFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const editando = id !== undefined
  const idServicio = Number(id)
  const idInvalido = editando && (!Number.isInteger(idServicio) || idServicio <= 0)

  const { data: servicio, isLoading, isError, refetch } = useServicio(editando && !idInvalido ? idServicio : undefined)
  const crear = useCrearServicio()
  const actualizar = useActualizarServicio(editando ? idServicio : 0)
  const guardando = crear.isPending || actualizar.isPending
  const error = crear.error ?? actualizar.error

  const volver = () => navigate("/catalogo-servicios")

  // Se llega desde una tarjeta del catálogo que puede estar muy abajo: la página empieza arriba.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  function guardar(valores: ServicioConImagen) {
    const mutacion = editando ? actualizar : crear
    mutacion.mutate(valores, {
      onSuccess: () => {
        avisar(`Servicio ${valores.nombreServicio} ${editando ? "actualizado" : "registrado"}`)
        volver()
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* "Volver" en la esquina izquierda; el formulario va centrado debajo. */}
      <Link
        to="/catalogo-servicios"
        className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Catálogo de servicios
      </Link>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

      <PageHeader
        titulo={editando ? "Editar servicio" : "Nuevo servicio"}
        descripcion={editando ? servicio?.nombreServicio ?? "Actualiza los datos del servicio." : "Define el servicio, su categoría y su duración estimada."}
      />

      {editando && isLoading && (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando servicio">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {editando && (isError || idInvalido) && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <span className="text-destructive">No se encontró el servicio o no se pudo cargar.</span>
          {!idInvalido && (
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          )}
        </div>
      )}

      {(!editando || servicio) && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <ServicioForm
            key={servicio?.idServicio ?? "nuevo"}
            valoresIniciales={
              servicio
                ? {
                    idCategoriaServicio: servicio.categoriaServicio?.idCategoriaServicio,
                    idUnidadMedida: servicio.unidadMedida?.idUnidadMedida,
                    codigoServicio: servicio.codigoServicio,
                    nombreServicio: servicio.nombreServicio,
                    duracionEstimadaHoras: servicio.duracionEstimadaHoras,
                    visibleWeb: servicio.visibleWeb,
                    descripcion: servicio.descripcion,
                  }
                : undefined
            }
            onSubmit={guardar}
            onCancel={volver}
            enviando={guardando}
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {mensajeDe(error)}
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  )
}