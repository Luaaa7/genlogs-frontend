import { useId, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertTriangle, Loader2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Ventana } from "@/components/ui/Ventana"
import { avisar } from "@/lib/avisos"
import { calcularCostoPuestoLima } from "@/lib/costoPuestoLima"
import { mensajeError } from "@/lib/errores"
import { formatCurrency } from "@/lib/formatters/currency"
import { aNumero } from "@/lib/numeroDecimal"
import type { DatosUrl } from "@/api/sourcingApi"
import { useGuardarUrl, useLeerUrl, useTipoCambioDelDia } from "../hooks/useBusqueda"

const numeroOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || (aNumero(v) ?? -1) >= 0, "Escribe un número igual o mayor a 0 (puedes usar coma o punto)")

const esquema = z
  .object({
    titulo: z.string().trim().min(1, "Escribe el título").max(500, "Máximo 500 caracteres"),
    marca: z.string().trim().max(100, "Máximo 100 caracteres"),
    numeroParte: z.string().trim().max(60, "Máximo 60 caracteres"),
    precio: z
      .string()
      .trim()
      .refine((v) => v !== "", "Escribe el precio")
      .refine((v) => v === "" || (aNumero(v) ?? 0) > 0, "Escribe un precio mayor a 0, por ejemplo 18,50 o 18.50"),
    codigoMoneda: z.enum(["PEN", "USD"]),
    tipoCambio: z.string().trim(),
    origen: z.enum(["NACIONAL", "IMPORTADO"]),
    flete: numeroOpcional,
    seguro: numeroOpcional,
    aduana: numeroOpcional,
    urlImagen: z
      .string()
      .trim()
      .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "La URL de la imagen debe empezar con http:// o https://"),
  })
  .refine((v) => v.codigoMoneda === "PEN" || (aNumero(v.tipoCambio) ?? 0) > 0, {
    path: ["tipoCambio"],
    message: "Escribe el tipo de cambio del día",
  })
type Valores = z.infer<typeof esquema>

const num = (v: string | undefined) => aNumero(v)

const MONEDAS_ADMITIDAS = ["PEN", "USD"]

interface Props {
  /** N.º de parte del panel: se usa como valor inicial y para refrescar su historial. */
  numeroParte: string
  marca?: string
  idSolicitudItem?: number
  onCerrar: () => void
}

/**
 * RF-77 · "Pegar URL": el sistema lee la página y el asistente revisa y edita
 * todo antes de guardar. Si la tienda bloquea la lectura, se llena a mano.
 * RF-75 · Muestra el costo puesto en Lima mientras se escribe.
 */
export function PegarUrlModal({ numeroParte, marca, idSolicitudItem, onCerrar }: Props) {
  const [url, setUrl] = useState("")
  const [errorUrl, setErrorUrl] = useState<string>()
  const [leido, setLeido] = useState<DatosUrl | null>(null)
  // Moneda que trajo la página y que no es PEN ni USD (EUR, CNY…): el precio no se usa tal cual.
  const [monedaNoAdmitida, setMonedaNoAdmitida] = useState<string | null>(null)
  const uid = useId()
  const idDe = (campo: string) => `${uid}-${campo}`
  const tipoCambio = useTipoCambioDelDia()
  const tcDelDia = tipoCambio.data?.codigoMoneda === "USD" && tipoCambio.data.valor > 0 ? tipoCambio.data.valor : undefined
  const leer = useLeerUrl()
  const guardar = useGuardarUrl(numeroParte)

  const form = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      titulo: "", marca: marca ?? "", numeroParte, precio: "", codigoMoneda: "USD", tipoCambio: "",
      origen: "IMPORTADO", flete: "", seguro: "", aduana: "", urlImagen: "",
    },
  })
  const { register, handleSubmit, reset, control, formState: { errors, dirtyFields } } = form
  const valores = useWatch({ control })

  function leerPagina() {
    const limpia = url.trim()
    if (!/^https?:\/\/\S+$/i.test(limpia)) {
      setErrorUrl("Pega una dirección que empiece con http:// o https://")
      return
    }
    setErrorUrl(undefined)
    leer.mutate(limpia, {
      onSuccess: (d) => {
        setLeido(d)
        const leida = d.codigoMoneda?.toUpperCase() ?? null
        const otraMoneda = leida && !MONEDAS_ADMITIDAS.includes(leida) ? leida : null
        setMonedaNoAdmitida(otraMoneda)
        const moneda = leida === "PEN" ? "PEN" : "USD"
        reset({
          titulo: d.titulo ?? "",
          marca: marca ?? "",
          numeroParte,
          // Con otra moneda el precio se deja vacío: hay que convertirlo a USD o PEN a mano.
          precio: d.precio != null && !otraMoneda ? String(d.precio) : "",
          codigoMoneda: moneda,
          tipoCambio: moneda === "USD" && tcDelDia ? String(tcDelDia) : "",
          origen: moneda === "PEN" ? "NACIONAL" : "IMPORTADO",
          flete: "", seguro: "", aduana: "",
          urlImagen: d.urlImagen ?? "",
        })
      },
    })
  }

  const costo = calcularCostoPuestoLima({
    precio: num(valores.precio),
    codigoMoneda: valores.codigoMoneda,
    tipoCambio: num(valores.tipoCambio),
    flete: num(valores.flete),
    seguro: num(valores.seguro),
    aduana: num(valores.aduana),
  })

  const enviar = handleSubmit((v) => {
    if (!leido) return
    // "Editada a mano" si cambió algo de lo que trajo la página o si la página no se pudo leer.
    const editado = leido.bloqueada || !!monedaNoAdmitida || ["titulo", "precio", "codigoMoneda", "urlImagen"].some(
      (k) => dirtyFields[k as keyof Valores],
    )
    guardar.mutate(
      {
        idSolicitudItem,
        url: leido.url,
        titulo: v.titulo.trim(),
        marca: v.marca.trim() || undefined,
        numeroParte: v.numeroParte.trim() || undefined,
        precio: aNumero(v.precio) as number,
        codigoMoneda: v.codigoMoneda,
        urlImagen: v.urlImagen.trim() || undefined,
        origen: v.origen,
        tipoCambio: v.codigoMoneda === "PEN" ? undefined : aNumero(v.tipoCambio),
        flete: num(v.flete),
        seguro: num(v.seguro),
        aduana: num(v.aduana),
        editadoAMano: editado,
      },
      {
        onSuccess: () => {
          avisar("Referencia guardada en el historial")
          onCerrar()
        },
      },
    )
  })

  const campo = (nombre: keyof Valores) => ({
    id: idDe(nombre),
    "aria-invalid": !!errors[nombre],
    "aria-describedby": describedBy(idDe(nombre), { error: errors[nombre] }),
  })

  return (
    <Ventana
      titulo="Pegar URL de una tienda"
      descripcion="Leemos los datos públicos de la página. Revisa y corrige todo antes de guardar."
      onCerrar={onCerrar}
      ancho="max-w-2xl"
      acciones={
        <>
          <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
          {leido && (
            <Button type="submit" form={idDe("form")} disabled={guardar.isPending}>
              {guardar.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Guardar referencia
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Campo id={idDe("url-tienda")} label="URL del producto" obligatorio error={errorUrl} className="flex-1">
            <input
              id={idDe("url-tienda")}
              type="url"
              className={inputFormClass}
              placeholder="https://www.amazon.com/dp/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); leerPagina() } }}
              aria-invalid={!!errorUrl}
              aria-describedby={describedBy(idDe("url-tienda"), { error: errorUrl })}
            />
          </Campo>
          <Button type="button" variant="secondary" onClick={leerPagina} disabled={leer.isPending}>
            {leer.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            Leer página
          </Button>
        </div>

        {leer.isError && <ErrorBanner message={mensajeError(leer.error, "No se pudo leer la URL.")} error={leer.error} />}

        {leido?.bloqueada && (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {leido.motivo ?? "La tienda no permitió leer la página. Completa los datos a mano."}
          </p>
        )}

        {monedaNoAdmitida && (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            La página está en {monedaNoAdmitida}
            {leido?.precio != null ? ` (${leido.precio} ${monedaNoAdmitida})` : ""}; convierte el precio a USD o PEN y escríbelo.
          </p>
        )}

        {leido && (
          <form id={idDe("form")} onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
            <Campo id={idDe("titulo")} label="Título" obligatorio error={errors.titulo?.message} className="sm:col-span-2">
              <input className={inputFormClass} {...campo("titulo")} {...register("titulo")} />
            </Campo>
            <Campo id={idDe("marca")} label="Marca" opcional error={errors.marca?.message}>
              <input className={inputFormClass} {...campo("marca")} {...register("marca")} />
            </Campo>
            <Campo id={idDe("numeroParte")} label="N.º de parte" opcional error={errors.numeroParte?.message}>
              <input className={inputFormClass} {...campo("numeroParte")} {...register("numeroParte")} />
            </Campo>
            <Campo id={idDe("precio")} label="Precio en la tienda" obligatorio error={errors.precio?.message}>
              <input className={inputFormClass} inputMode="decimal" {...campo("precio")} {...register("precio")} />
            </Campo>
            <Campo id={idDe("codigoMoneda")} label="Moneda" obligatorio>
              <select className={inputFormClass} {...campo("codigoMoneda")} {...register("codigoMoneda")}>
                <option value="USD">Dólares (USD)</option>
                <option value="PEN">Soles (PEN)</option>
              </select>
            </Campo>
            {valores.codigoMoneda !== "PEN" && (
              <Campo id={idDe("tipoCambio")} label="Tipo de cambio" obligatorio error={errors.tipoCambio?.message}
                ayuda={tcDelDia ? `Del día: ${tcDelDia} (${tipoCambio.data?.fuente ?? "SUNAT"}). Puedes corregirlo.` : "Valor de venta del día"}>
                <input className={inputFormClass} inputMode="decimal" placeholder="3.75" {...campo("tipoCambio")} {...register("tipoCambio")} />
              </Campo>
            )}
            <Campo id={idDe("origen")} label="Origen" obligatorio>
              <select className={inputFormClass} {...campo("origen")} {...register("origen")}>
                <option value="IMPORTADO">Importado</option>
                <option value="NACIONAL">Nacional</option>
              </select>
            </Campo>
            <Campo id={idDe("flete")} label="Flete (S/)" opcional error={errors.flete?.message}>
              <input className={inputFormClass} inputMode="decimal" {...campo("flete")} {...register("flete")} />
            </Campo>
            <Campo id={idDe("seguro")} label="Seguro (S/)" opcional error={errors.seguro?.message}>
              <input className={inputFormClass} inputMode="decimal" {...campo("seguro")} {...register("seguro")} />
            </Campo>
            <Campo id={idDe("aduana")} label="Aduana (S/)" opcional error={errors.aduana?.message}>
              <input className={inputFormClass} inputMode="decimal" {...campo("aduana")} {...register("aduana")} />
            </Campo>
            <Campo id={idDe("urlImagen")} label="URL de la imagen" opcional error={errors.urlImagen?.message} ayuda="Solo de referencia interna; nunca se muestra al cliente" className="sm:col-span-2">
              <input className={inputFormClass} {...campo("urlImagen")} {...register("urlImagen")} />
            </Campo>

            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 sm:col-span-2">
              <span className="text-sm text-muted-foreground">Costo puesto en Lima</span>
              <span className="text-lg font-semibold tabular-nums text-foreground" aria-live="polite">
                {costo != null ? formatCurrency(costo, "PEN") : "—"}
              </span>
            </div>

            {guardar.isError && (
              <div className="sm:col-span-2">
                <ErrorBanner message={mensajeError(guardar.error, "No se pudo guardar la referencia.")} error={guardar.error} />
              </div>
            )}
          </form>
        )}
      </div>
    </Ventana>
  )
}
