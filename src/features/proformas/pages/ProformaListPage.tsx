// src/features/proformas/pages/ProformasListPage.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { mensajeErrorProforma } from "@/api/proformasApi"
import { Button } from "@/components/ui/button"
import type { EstadoProforma, ProformaRequest, ProformasFiltros } from "@/types/proforma.types"
import { ProformaForm } from "../components/ProformaForm"
import { ProformaTable } from "../components/ProformaTable"
import { useCrearProforma } from "../hooks/useCrearProforma"
import { useProformas } from "../hooks/useProformas"

const TAMANIO_PAGINA = 10

export function ProformasListPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoProforma | undefined>(undefined)
  const [pagina, setPagina] = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)

  const filtros: ProformasFiltros = { estadoProforma: estado, page: pagina, size: TAMANIO_PAGINA }
  const { data, isLoading, isFetching, isError, refetch } = useProformas(filtros)
  const crear = useCrearProforma()

  const totalPaginas = data?.totalPages ?? 0
  const total = data?.totalElements ?? 0

  function handleEstado(nuevo: EstadoProforma | undefined) {
    setEstado(nuevo)
    setPagina(0)
  }

  function abrirForm() {
    crear.reset()
    setMostrarForm(true)
  }

  function cerrarForm() {
    crear.reset()
    setMostrarForm(false)
  }

  function handleCrear(request: ProformaRequest) {
    crear.mutate(request, {
      onSuccess: (proforma) => navigate(`/proformas/${proforma.id}`),
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Proformas</h1>
          {data && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total === 1 ? "1 proforma" : `${total} proformas`}
            </p>
          )}
        </div>
        {!mostrarForm && (
          <Button type="button" onClick={abrirForm}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Nueva proforma
          </Button>
        )}
      </div>

      {mostrarForm && (
        <section
          aria-label="Nueva proforma"
          className="rounded-lg border border-border bg-card p-6 text-card-foreground"
        >
          <h2 className="mb-4 text-lg font-semibold">Nueva proforma</h2>
          <ProformaForm
            onSubmit={handleCrear}
            onCancel={cerrarForm}
            submitting={crear.isPending}
            errorMessage={crear.isError ? mensajeErrorProforma(crear.error, "No se pudo crear la proforma.") : null}
          />
        </section>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <span className="text-destructive">No se pudo cargar el listado de proformas.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isError && (
        <ProformaTable
          proformas={data?.content ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          estadoFiltro={estado}
          onEstadoFiltroChange={handleEstado}
          onCrear={mostrarForm ? undefined : abrirForm}
        />
      )}

      {totalPaginas > 1 && (
        <nav aria-label="Paginación de proformas" className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0 || isFetching}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => p + 1)}
            disabled={pagina + 1 >= totalPaginas || isFetching}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}