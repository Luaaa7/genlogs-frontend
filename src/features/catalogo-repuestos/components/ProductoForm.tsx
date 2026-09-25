import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { productoSchema, type ProductoFormValues } from "@/lib/validators/producto.schema"
import { listarMarcas } from "@/api/marcasApi"
import { listarUnidadesMedida } from "@/api/unidadesMedidaApi"
import { CategoriaSelector } from "./CategoriaSelector"
import { FileUploader } from "@/components/ui/FileUploader"
import { agregarImagenProducto, agregarDocumentoProducto } from "@/api/productosApi"

interface ProductoFormProps {
  defaultValues?: Partial<ProductoFormValues>
  idProductoExistente?: number
  onSubmit: (values: ProductoFormValues) => void
  submitting?: boolean
}

export function ProductoForm({ defaultValues, idProductoExistente, onSubmit, submitting }: ProductoFormProps) {
  const { data: marcas } = useQuery({ queryKey: ["marcas"], queryFn: listarMarcas })
  const { data: unidades } = useQuery({ queryKey: ["unidades-medida"], queryFn: listarUnidadesMedida })

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: { visibleWeb: true, caracteristicas: [], ...defaultValues },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "caracteristicas" })
  const idCategoriaProducto = useWatch({ control, name: "idCategoriaProducto" })
  const idUnidadMedida = useWatch({ control, name: "idUnidadMedida" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Código del producto</label>
          <input {...register("codigoProducto")} className="rounded-md border border-border px-3 py-2 text-sm" />
          {errors.codigoProducto && <p className="text-sm text-destructive">{errors.codigoProducto.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nombre del producto</label>
          <input {...register("nombreProducto")} className="rounded-md border border-border px-3 py-2 text-sm" />
          {errors.nombreProducto && <p className="text-sm text-destructive">{errors.nombreProducto.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Categoría</label>
          <CategoriaSelector value={idCategoriaProducto} onChange={(id) => setValue("idCategoriaProducto", id, { shouldValidate: true })} />
          {errors.idCategoriaProducto && <p className="text-sm text-destructive">{errors.idCategoriaProducto.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Unidad de medida</label>
          <select value={idUnidadMedida ?? ""} onChange={(e) => setValue("idUnidadMedida", Number(e.target.value), { shouldValidate: true })} className="rounded-md border border-border px-3 py-2 text-sm">
            <option value="" disabled>Selecciona una unidad</option>
            {unidades?.map((u) => <option key={u.idUnidadMedida} value={u.idUnidadMedida}>{u.nombreUnidad} ({u.codigoUnidad})</option>)}
          </select>
          {errors.idUnidadMedida && <p className="text-sm text-destructive">{errors.idUnidadMedida.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Marca (opcional)</label>
          <select defaultValue="" onChange={(e) => setValue("idMarca", e.target.value ? Number(e.target.value) : undefined)} className="rounded-md border border-border px-3 py-2 text-sm">
            <option value="">Sin marca</option>
            {marcas?.map((m) => <option key={m.idMarca} value={m.idMarca}>{m.nombreMarca}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Procedencia (opcional)</label>
          <input {...register("procedencia")} className="rounded-md border border-border px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Descripción</label>
        <textarea {...register("descripcion")} rows={3} className="rounded-md border border-border px-3 py-2 text-sm" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("visibleWeb")} />
        Visible en el catálogo web
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Ficha técnica</h2>
          <button type="button" onClick={() => append({ nombreCaracteristica: "", unidadCaracteristica: "", valorCaracteristica: "" })} className="text-sm text-primary hover:underline">
            + Agregar característica
          </button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
            <input placeholder="Nombre (ej. Material)" {...register(`caracteristicas.${index}.nombreCaracteristica`)} className="rounded-md border border-border px-3 py-2 text-sm" />
            <input placeholder="Valor (ej. Acero inoxidable)" {...register(`caracteristicas.${index}.valorCaracteristica`)} className="rounded-md border border-border px-3 py-2 text-sm" />
            <input placeholder="Unidad" {...register(`caracteristicas.${index}.unidadCaracteristica`)} className="w-24 rounded-md border border-border px-3 py-2 text-sm" />
            <button type="button" onClick={() => remove(index)} className="text-sm text-destructive hover:underline">Quitar</button>
          </div>
        ))}
      </div>

      {idProductoExistente && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Imágenes y documentos</h2>
          <FileUploader tipo="imagen" label="Subir imagen del producto" onUploaded={(r) => agregarImagenProducto(idProductoExistente, r.url, true)} />
          <FileUploader tipo="documento" label="Subir ficha técnica / certificado" onUploaded={(r) => agregarDocumentoProducto(idProductoExistente, "FICHA_TECNICA", r.nombreArchivo, r.url)} />
        </div>
      )}

      <button type="submit" disabled={submitting} className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
        {submitting ? "Guardando..." : "Guardar producto"}
      </button>
    </form>
  )
}