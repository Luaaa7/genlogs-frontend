import { useId } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass, textareaFormClass } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Ventana } from "@/components/ui/Ventana"
import type { Referencia } from "@/api/sourcingApi"
import { avisar } from "@/lib/avisos"
import { mensajeError } from "@/lib/errores"
import { formatCurrency } from "@/lib/formatters/currency"
import { aNumero } from "@/lib/numeroDecimal"
import { useCatalogosProducto, useConvertirProducto } from "../hooks/useVitrina"

const esquema = z
  .object({
    nombre: z.string().trim().min(1, "Escribe el nombre del repuesto").max(200, "Máximo 200 caracteres"),
    descripcion: z.string().trim().max(4000, "Máximo 4000 caracteres"),
    idCategoria: z.string().min(1, "Elige la categoría"),
    idUnidad: z.string().min(1, "Elige la unidad de medida"),
    idMarca: z.string(),
    numeroParte: z.string().trim().max(60, "Máximo 60 caracteres"),
    tipoRepuesto: z.enum(["OEM", "ALTERNATIVO"], { message: "Indica si es Original (OEM) o Alternativo" }),
    origen: z.enum(["NACIONAL", "IMPORTADO"]),
    costo: z.string().trim(),
    margen: z
      .string()
      .trim()
      .refine((v) => v === "" || ((aNumero(v) ?? -1) >= 0 && (aNumero(v) ?? 101) <= 100), "El margen va de 0 a 100 %"),
  })
  .refine((v) => (aNumero(v.costo) ?? 0) > 0, { path: ["costo"], message: "Escribe el costo puesto en Lima" })
type Valores = z.infer<typeof esquema>

interface Props {
  referencia: Referencia
  onCerrar: () => void
}

/**
 * Convertir una referencia ÚTIL en producto de la vitrina (BPMN 10). Categoría y
 * unidad son obligatorias, con "Unidad" por defecto (D-22). Nace en BORRADOR.
 */
export function ConvertirModal({ referencia: r, onCerrar }: Props) {
  const uid = useId()
  const idDe = (c: string) => `${uid}-${c}`
  const navigate = useNavigate()
  const { categorias, unidades, marcas } = useCatalogosProducto()
  const convertir = useConvertirProducto()

  const unidadPorDefecto = unidades.data?.find((u) => /^(unidad|und|u)$/i.test(u.nombreUnidad) || /^(UND|UNI|U)$/i.test(u.codigoUnidad))
  const { register, handleSubmit, control, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(esquema),
    values: {
      nombre: r.titulo ?? "",
      descripcion: "",
      idCategoria: "",
      idUnidad: unidadPorDefecto ? String(unidadPorDefecto.idUnidadMedida) : "",
      idMarca: "",
      numeroParte: r.numeroParte ?? "",
      tipoRepuesto: "OEM",
      origen: r.codigoMoneda && r.codigoMoneda !== "PEN" ? "IMPORTADO" : "NACIONAL",
      costo: r.costoPuestoLima != null ? String(r.costoPuestoLima) : "",
      margen: "",
    },
    resetOptions: { keepDirtyValues: true },
  })
  const costo = aNumero(useWatch({ control, name: "costo" }))
  const margen = aNumero(useWatch({ control, name: "margen" }))
  const precio = costo && margen != null ? Math.round(costo * (1 + margen / 100) * 100) / 100 : null

  const enviar = handleSubmit((v) =>
    convertir.mutate(
      {
        idSourcing: r.idSourcing,
        nombre: v.nombre.trim(),
        descripcion: v.descripcion.trim() || undefined,
        idCategoriaProducto: Number(v.idCategoria),
        idUnidadMedida: Number(v.idUnidad),
        idMarca: v.idMarca ? Number(v.idMarca) : undefined,
        numeroParte: v.numeroParte.trim() || undefined,
        tipoRepuesto: v.tipoRepuesto,
        origen: v.origen,
        costoPuestoLima: aNumero(v.costo),
        margen: aNumero(v.margen),
      },
      {
        onSuccess: (p) => {
          avisar(p.requiereJefe ? "Producto creado en borrador: el margen necesita al Jefe Administrativo" : "Producto creado en borrador")
          onCerrar()
          navigate(`/vitrina/productos/${p.idProducto}`)
        },
      },
    ),
  )

  const campo = (n: keyof Valores) => ({
    id: idDe(n),
    "aria-invalid": !!errors[n],
    "aria-describedby": describedBy(idDe(n), { error: errors[n] }),
  })

  return (
    <Ventana
      titulo="Convertir en producto"
      descripcion="Queda en borrador. Para publicarlo hace falta una foto propia."
      onCerrar={onCerrar}
      ancho="max-w-2xl"
      acciones={
        <>
          <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" form={idDe("form")} disabled={convertir.isPending}>
            {convertir.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Crear borrador
          </Button>
        </>
      }
    >
      <form id={idDe("form")} onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Campo id={idDe("nombre")} label="Nombre en la vitrina" obligatorio error={errors.nombre?.message} className="sm:col-span-2"
          ayuda="Escríbelo con tus palabras: nunca se muestra el título de la tienda">
          <input className={inputFormClass} {...campo("nombre")} {...register("nombre")} />
        </Campo>
        <Campo id={idDe("idCategoria")} label="Categoría" obligatorio error={errors.idCategoria?.message}>
          <select className={inputFormClass} {...campo("idCategoria")} {...register("idCategoria")}>
            <option value="">Elige…</option>
            {(categorias.data ?? []).map((c) => <option key={c.idCategoriaProducto} value={c.idCategoriaProducto}>{c.nombreCategoria}</option>)}
          </select>
        </Campo>
        <Campo id={idDe("idUnidad")} label="Unidad de medida" obligatorio error={errors.idUnidad?.message}>
          <select className={inputFormClass} {...campo("idUnidad")} {...register("idUnidad")}>
            <option value="">Elige…</option>
            {(unidades.data ?? []).map((u) => <option key={u.idUnidadMedida} value={u.idUnidadMedida}>{u.nombreUnidad}</option>)}
          </select>
        </Campo>
        <Campo id={idDe("idMarca")} label="Marca" opcional>
          <select className={inputFormClass} {...campo("idMarca")} {...register("idMarca")}>
            <option value="">Sin marca</option>
            {(marcas.data ?? []).map((m) => <option key={m.idMarca} value={m.idMarca}>{m.nombreMarca}</option>)}
          </select>
        </Campo>
        <Campo id={idDe("numeroParte")} label="N.º de parte" opcional error={errors.numeroParte?.message}>
          <input className={inputFormClass} {...campo("numeroParte")} {...register("numeroParte")} />
        </Campo>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">Tipo de repuesto</legend>
          <div className="flex gap-4 pt-1 text-sm">
            <label className="inline-flex items-center gap-2"><input type="radio" value="OEM" {...register("tipoRepuesto")} /> Original (OEM)</label>
            <label className="inline-flex items-center gap-2"><input type="radio" value="ALTERNATIVO" {...register("tipoRepuesto")} /> Alternativo compatible</label>
          </div>
        </fieldset>
        <Campo id={idDe("origen")} label="Origen" obligatorio>
          <select className={inputFormClass} {...campo("origen")} {...register("origen")}>
            <option value="NACIONAL">Nacional (24 a 48 h)</option>
            <option value="IMPORTADO">Importado (5 a 7 días hábiles)</option>
          </select>
        </Campo>
        <Campo id={idDe("costo")} label="Costo puesto en Lima (S/)" obligatorio error={errors.costo?.message}>
          <input className={inputFormClass} inputMode="decimal" {...campo("costo")} {...register("costo")} />
        </Campo>
        <Campo id={idDe("margen")} label="Margen (%)" opcional error={errors.margen?.message} ayuda="Vacío = margen sugerido de repuestos">
          <input className={inputFormClass} inputMode="decimal" placeholder="25" {...campo("margen")} {...register("margen")} />
        </Campo>
        <Campo id={idDe("descripcion")} label="Descripción" opcional className="sm:col-span-2">
          <textarea rows={3} className={textareaFormClass} {...campo("descripcion")} {...register("descripcion")} />
        </Campo>
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 sm:col-span-2">
          <span className="text-sm text-muted-foreground">Precio referencial</span>
          <span className="font-semibold tabular-nums" aria-live="polite">
            {precio != null ? formatCurrency(precio, "PEN") : "Con el margen sugerido"}
          </span>
        </div>
        {convertir.isError && (
          <div className="sm:col-span-2">
            <ErrorBanner message={mensajeError(convertir.error, "No se pudo crear el producto.")} />
          </div>
        )}
      </form>
    </Ventana>
  )
}
