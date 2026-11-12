import { useFormContext, useWatch } from "react-hook-form"
import type { ServicioFormValues } from "@/types/servicio.types"
import { useRangoMargenServicio } from "../hooks/useServicios"
import { margenDePrecio, margenFueraDeRango, precioCalculado } from "../lib/precioServicio"

const campo = "w-full rounded-md border border-border px-3 py-2 text-sm"

function numeroDe(valor: unknown): number | undefined {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor
  if (typeof valor === "string" && valor.trim() !== "") {
    const n = Number(valor)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

/** Costo, margen y precio. El precio automático se recalcula al escribir; el manual no. */
export function PrecioServicio() {
  const { register, control, setValue, getValues } = useFormContext<ServicioFormValues>()
  const manual = useWatch({ control, name: "precioManual" })
  const costo = numeroDe(useWatch({ control, name: "costo" }))
  const margen = numeroDe(useWatch({ control, name: "margen" }))
  const precio = numeroDe(useWatch({ control, name: "precioReferencial" }))
  const { rango } = useRangoMargenServicio()
  const calculado = costo != null && margen != null ? precioCalculado(costo, margen) : null
  // Con precio manual el backend deduce el margen del precio; aquí se muestra y se avisa con ese mismo.
  const margenReal = manual && costo != null && costo > 0 && precio != null ? margenDePrecio(costo, precio) : null
  const margenEfectivo = manual ? margenReal : margen
  const avisa = rango != null && margenEfectivo != null && margenEfectivo >= 0 && margenEfectivo <= 100
    && margenFueraDeRango(margenEfectivo, rango.minimo, rango.maximo)
  const manualCampo = register("precioManual")

  return (
    <div className="sm:col-span-2 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      <div>
        <label htmlFor="costo-servicio" className="mb-1.5 block text-sm font-medium text-foreground">Costo</label>
        <input
          id="costo-servicio"
          type="number"
          min="0"
          step="0.01"
          {...register("costo", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="margen-servicio" className="mb-1.5 block text-sm font-medium text-foreground">Margen (%)</label>
        <input
          id="margen-servicio"
          type="number"
          min="0"
          max="100"
          step="0.01"
          {...register("margen", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="precio-servicio" className="mb-1.5 block text-sm font-medium text-foreground">Precio</label>
        <input
          id="precio-servicio"
          inputMode="decimal"
          readOnly={!manual}
          value={manual ? (precio ?? "") : calculado == null ? "" : calculado.toFixed(2)}
          onChange={(e) => {
            if (!manual) return
            const texto = e.target.value
            setValue("precioReferencial", texto === "" ? undefined : Number(texto), { shouldValidate: true })
          }}
          className={`${campo} read-only:bg-muted`}
        />
      </div>
      <div className="flex items-center gap-2 sm:pt-8">
        <input
          type="checkbox"
          id="precio-manual"
          {...manualCampo}
          onChange={(e) => {
            manualCampo.onChange(e)
            if (e.target.checked && getValues("precioReferencial") == null && calculado != null) {
              setValue("precioReferencial", calculado)
            }
          }}
        />
        <label htmlFor="precio-manual" className="text-sm">Precio manual</label>
      </div>
      {manual && costo == null && (
        <p className="sm:col-span-2 text-sm text-muted-foreground">Registra el costo para fijar el precio a mano.</p>
      )}
      {margenReal != null && (
        <p role="status" className={`sm:col-span-2 text-sm ${margenReal < 0 || margenReal > 100 ? "text-destructive" : "text-foreground"}`}>
          {margenReal < 0
            ? "El precio no puede ser menor que el costo."
            : margenReal > 100
              ? `Este precio deja un margen de ${margenReal.toFixed(2)} %; el máximo es 100 %.`
              : `Margen real con este precio: ${margenReal.toFixed(2)} %`}
        </p>
      )}
      {avisa && (
        <p role="status" className="sm:col-span-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
          Este margen quedará pendiente de aprobación del Jefe.
        </p>
      )}
    </div>
  )
}
