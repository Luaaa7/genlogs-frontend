import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { listarCategoriasServicio } from "@/api/categoriasServicioApi"
import { listarUnidadesMedida } from "@/api/unidadesMedidaApi"
import { listarSectoresEconomicos } from "@/api/sectoresEconomicosApi"
import { FileUploader } from "@/components/ui/FileUploader"
import { servicioSchema } from "@/lib/validators/servicio.schema"
import { CategoriaServicioSelector } from "./CategoriaServicioSelector"
import type { ServicioFormValues } from "@/types/servicio.types"
import type { ServicioConImagen } from "@/api/serviciosApi"

interface ServicioFormProps {
  valoresIniciales?: Partial<ServicioFormValues>
  /** Recibe los datos del formulario y, si se subió una foto, su URL en `imagenUrl`. */
  onSubmit: (valores: ServicioConImagen) => void
  enviando?: boolean
}

export function ServicioForm({ valoresIniciales, onSubmit, enviando }: ServicioFormProps) {
  const { register, handleSubmit, setValue, getValues, control, formState: { errors } } = useForm<ServicioFormValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      idCategoriaServicio: valoresIniciales?.idCategoriaServicio,
      idUnidadMedida: valoresIniciales?.idUnidadMedida,
      codigoServicio: valoresIniciales?.codigoServicio ?? "",
      nombreServicio: valoresIniciales?.nombreServicio ?? "",
      duracionEstimadaHoras: valoresIniciales?.duracionEstimadaHoras,
      visibleWeb: valoresIniciales?.visibleWeb ?? true,
      descripcion: valoresIniciales?.descripcion ?? "",
      idsSectores: valoresIniciales?.idsSectores ?? [],
    },
  })

  const { data: categorias, isLoading: cargandoCategorias } = useQuery({
    queryKey: ["categorias-servicio"],
    queryFn: listarCategoriasServicio,
  })

  const { data: unidades, isLoading: cargandoUnidades } = useQuery({
    queryKey: ["unidades-medida"],
    queryFn: listarUnidadesMedida,
  })

  const { data: sectores, isLoading: cargandoSectores } = useQuery({
    queryKey: ["sectores-economicos"],
    queryFn: listarSectoresEconomicos,
  })

  // useWatch hace que los checkboxes y la categoría se actualicen al hacer clic
  // (con getValues la pantalla no se volvía a pintar y parecía que no se marcaban).
  const idsSectoresSeleccionados = useWatch({ control, name: "idsSectores" }) ?? []
  const idCategoriaSeleccionada = useWatch({ control, name: "idCategoriaServicio" })
  const [imagenUrl, setImagenUrl] = useState<string>()

  function toggleSector(id: number) {
    const actuales = getValues("idsSectores") ?? []
    if (actuales.includes(id)) {
      setValue("idsSectores", actuales.filter((s) => s !== id))
    } else {
      setValue("idsSectores", [...actuales, id])
    }
  }

  return (
    <form onSubmit={handleSubmit((valores) => onSubmit({ ...valores, imagenUrl }))} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium">Código de servicio</label>
        <input
          {...register("codigoServicio")}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.codigoServicio && <p className="text-sm text-destructive">{errors.codigoServicio.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Nombre del servicio</label>
        <input
          {...register("nombreServicio")}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.nombreServicio && <p className="text-sm text-destructive">{errors.nombreServicio.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Categoría de servicio</label>
        <CategoriaServicioSelector
          categorias={categorias}
          isLoading={cargandoCategorias}
          value={idCategoriaSeleccionada}
          onChange={(id) => setValue("idCategoriaServicio", id, { shouldValidate: true })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.idCategoriaServicio && (
          <p className="text-sm text-destructive">{errors.idCategoriaServicio.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Unidad de medida</label>
        <select
          {...register("idUnidadMedida", { valueAsNumber: true })}
          disabled={cargandoUnidades}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">{cargandoUnidades ? "Cargando..." : "Selecciona una unidad"}</option>
          {unidades?.map((u) => (
            <option key={u.idUnidadMedida} value={u.idUnidadMedida}>
              {u.nombreUnidad}
            </option>
          ))}
        </select>
        {errors.idUnidadMedida && <p className="text-sm text-destructive">{errors.idUnidadMedida.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Duración estimada (horas)</label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          {...register("duracionEstimadaHoras", {
            // Campo vacío => undefined (con valueAsNumber llegaría NaN y fallaría la validación)
            setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
          })}
          onKeyDown={(e) => {
            // Prevenir teclas que permitan valores negativos
            if (e.key === "-" || e.key === "e" || e.key === "E") {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            // Validar contenido pegado
            const pasted = e.clipboardData.getData("text");
            const value = Number(pasted);
            if (!Number.isNaN(value) && value <= 0) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            // Validación en tiempo real: no permitir valores <= 0
            const value = Number(e.target.value);
            if (!Number.isNaN(value) && value <= 0) {
              e.target.value = "";
            }
          }}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.duracionEstimadaHoras && (
          <p className="text-sm text-destructive">{errors.duracionEstimadaHoras.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          {...register("descripcion")}
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.descripcion && <p className="text-sm text-destructive">{errors.descripcion.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Sectores económicos</label>
        <div className="flex flex-wrap gap-3">
          {cargandoSectores && <p className="text-sm text-muted-foreground">Cargando sectores...</p>}
          {sectores?.map((sector) => (
            <label key={sector.idSectorEconomico} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={idsSectoresSeleccionados?.includes(sector.idSectorEconomico) ?? false}
                onChange={() => toggleSector(sector.idSectorEconomico)}
              />
              {sector.nombreSector}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" {...register("visibleWeb")} id="visibleWeb" />
        <label htmlFor="visibleWeb" className="text-sm">Visible en la web pública</label>
      </div>

      <FileUploader
        tipo="imagen"
        label="Imagen del servicio"
        // La foto se sube al elegirla; al guardar el servicio queda asociada como imagen principal.
        onUploaded={(resultado) => setImagenUrl(resultado.url)}
      />

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {enviando ? "Guardando..." : "Guardar servicio"}
      </button>
    </form>
  )
}
