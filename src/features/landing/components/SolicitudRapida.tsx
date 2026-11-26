import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { CheckCircle2, Loader2, Paperclip } from "lucide-react"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass, textareaFormClass } from "@/components/ui/campoEstilos"
import { mensajeError } from "@/lib/errores"
import {
  borrarPedidoPendiente,
  guardarPedidoPendiente,
  leerPedidoPendiente,
  tokenCliente,
} from "../lib/pedidoPendiente"
import { enviarSolicitudLanding } from "../lib/enviarSolicitudLanding"
import { usePrecargaSolicitud } from "../lib/precargaSolicitud"

const esquema = z
  .object({
    marca: z.string().trim().max(100, "Máximo 100 caracteres"),
    numeroParte: z.string().trim().max(60, "Máximo 60 caracteres"),
    descripcion: z.string().trim().min(3, "Cuéntanos qué repuesto necesitas").max(255, "Máximo 255 caracteres"),
    cantidad: z.string().trim().refine((v) => Number(v) > 0, "La cantidad debe ser mayor a 0"),
  })
  .refine((v) => !v.numeroParte || v.marca, { path: ["marca"], message: "Indica la marca del N.º de parte" })
type Valores = z.infer<typeof esquema>

type Pedido = { marca: string; numeroParte: string; descripcion: string; cantidad: number; idProducto?: number }

/**
 * Sin sesión, el pedido queda guardado y se va a la nueva solicitud del portal: ahí se pide el ingreso
 * (Google o correo), vuelve a esta misma ruta y el formulario ya trae lo que se escribió aquí.
 */
const RUTA_SOLICITUD_PORTAL = "/portal/solicitud"

/** Lo que pasa después de enviar, en tres pasos. */
const PASOS = [
  "Escribe el repuesto y la cantidad",
  "Ingresa con Google o con tu correo",
  "Adjunta una foto o PDF y sigue tu cotización desde el portal",
]

function mensajeEnvio(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const s = error.response?.status
    if (s === 401) return "Tu sesión venció. Ingresa al portal y vuelve a enviar tu pedido."
    if (s === 429) return "Enviaste varias solicitudes seguidas. Espera un momento e intenta otra vez."
    if (s === 501) return "Este servicio todavía no está disponible. Tu pedido sigue guardado en este navegador."
  }
  return mensajeError(error, "No se pudo enviar tu pedido. Intenta otra vez.")
}

/**
 * Solicitud rápida de la landing (D-16, D-30). Sin cuenta: guarda el pedido en el
 * navegador y manda a la nueva solicitud del portal, que pide el ingreso con Google o correo
 * y precarga lo escrito (sin exigir RUC de entrada). Con sesión de cliente, lo envía directo
 * a POST /api/solicitudes (canal LANDING).
 */
export function SolicitudRapida() {
  const precarga = usePrecargaSolicitud()
  const navigate = useNavigate()
  // Pedido guardado antes de ir al registro (se lee una sola vez, al abrir la landing).
  const [pendiente] = useState(() => leerPedidoPendiente())
  const autoEnviado = useRef(false)
  // Marca y N.º de parte van plegados; se abren solos si ya hay algo escrito o llegó un producto del catálogo.
  const [masAbierto, setMasAbierto] = useState(() => Boolean(pendiente?.marca || pendiente?.numeroParte))

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: pendiente
      ? { marca: pendiente.marca, numeroParte: pendiente.numeroParte, descripcion: pendiente.descripcion, cantidad: String(pendiente.cantidad) }
      : { marca: "", numeroParte: "", descripcion: "", cantidad: "1" },
  })

  const envio = useMutation({
    mutationFn: ({ pedido, token }: { pedido: Pedido; token: string }) => enviarSolicitudLanding(pedido, token),
    onSuccess: () => borrarPedidoPendiente(),
  })

  // Al volver del registro: si hay un pedido guardado y ya hay sesión de cliente, se envía solo.
  useEffect(() => {
    if (autoEnviado.current || !pendiente) return
    autoEnviado.current = true
    const token = tokenCliente()
    if (token) envio.mutate({ pedido: pendiente, token })
  }, [pendiente, envio])

  // v3.4: al pulsar «Pedir cotización» en un producto del catálogo, el formulario recibe ese repuesto.
  // La cantidad que el visitante ya escribió se respeta.
  useEffect(() => {
    if (!precarga) return
    setValue("descripcion", precarga.descripcion, { shouldValidate: false })
    setValue("marca", precarga.marca ?? "", { shouldValidate: false })
    setValue("numeroParte", precarga.numeroParte ?? "", { shouldValidate: false })
  }, [precarga, setValue])

  // Con un producto del catálogo se invita a completar la marca y el N.º de parte: quedan abiertos.
  const masVisible = masAbierto || precarga !== null

  const alEnviar = handleSubmit((v) => {
    // Un segundo envío mientras el primero sigue en curso no hace nada.
    if (envio.isPending) return
    const pedido = { marca: v.marca, numeroParte: v.numeroParte, descripcion: v.descripcion, cantidad: Number(v.cantidad) }
    const token = tokenCliente()
    if (token) {
      envio.mutate({ pedido, token })
      return
    }
    // D-16: sin cuenta no se crean solicitudes. El pedido queda guardado y el portal pide el ingreso
    // (Google o correo) y lo precarga en la nueva solicitud, donde también se puede adjuntar foto o PDF.
    guardarPedidoPendiente(pedido)
    navigate(RUTA_SOLICITUD_PORTAL)
  })

  return (
    <section id="solicitud" aria-labelledby="solicitud-titulo" className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Solicitud rápida</p>
          <h2 id="solicitud-titulo" className="mt-2 text-3xl font-bold tracking-tight">Cuéntanos qué necesitas.</h2>
          <p className="mt-4 max-w-lg leading-7 text-primary-foreground/80">
            Escribe qué repuesto necesitas y la cantidad. Para enviarlo ingresas con Google o con tu correo, sin pedirte
            el RUC de entrada; es inmediato y no pierdes lo que escribiste.
          </p>
          <ol className="mt-8 space-y-4">
            {PASOS.map((paso, i) => (
              <li key={paso} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 font-semibold ring-1 ring-primary-foreground/25">
                  {i + 1}
                </span>
                <span className="text-primary-foreground/90">{paso}</span>
              </li>
            ))}
          </ol>
        </div>

        {envio.data ? (
          <div role="status" className="rounded-2xl bg-card p-6 text-card-foreground shadow-lg sm:p-8">
            <CheckCircle2 className="h-7 w-7 text-success" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">Recibimos tu pedido {envio.data.codigoSolicitud}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Puedes seguir su avance en el portal.</p>
            <Link
              to="/portal/pedidos"
              className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver mis pedidos
            </Link>
          </div>
        ) : (
          <form onSubmit={alEnviar} noValidate className="grid gap-4 rounded-2xl bg-card p-6 text-card-foreground shadow-lg sm:grid-cols-2 sm:p-8">
            {precarga && (
              <p role="status" className="text-sm text-muted-foreground sm:col-span-2">
                Cargamos «{precarga.descripcion}» desde el catálogo. Completa la marca y el N.º de parte si los tienes.
              </p>
            )}
            <Campo id="sr-descripcion" label="¿Qué repuesto necesitas?" obligatorio error={errors.descripcion?.message} className="sm:col-span-2">
              <textarea
                id="sr-descripcion"
                rows={3}
                className={textareaFormClass}
                placeholder="Filtro de combustible para cargador 980H"
                aria-invalid={!!errors.descripcion}
                aria-describedby={describedBy("sr-descripcion", { error: errors.descripcion })}
                {...register("descripcion")}
              />
            </Campo>
            <Campo id="sr-cantidad" label="Cantidad" obligatorio error={errors.cantidad?.message}>
              <input
                id="sr-cantidad"
                inputMode="decimal"
                className={inputFormClass}
                aria-invalid={!!errors.cantidad}
                aria-describedby={describedBy("sr-cantidad", { error: errors.cantidad })}
                {...register("cantidad")}
              />
            </Campo>

            {!masVisible && (
              <div className="sm:self-end sm:pb-2">
                <button
                  type="button"
                  aria-expanded={false}
                  onClick={() => setMasAbierto(true)}
                  className="rounded-sm text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  + Agregar marca o N.° de parte (opcional)
                </button>
              </div>
            )}
            {masVisible && (
              <div id="sr-mas-datos" className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <Campo id="sr-marca" label="Marca" opcional error={errors.marca?.message}>
                  <input
                    id="sr-marca"
                    className={inputFormClass}
                    placeholder="Caterpillar"
                    aria-invalid={!!errors.marca}
                    aria-describedby={describedBy("sr-marca", { error: errors.marca })}
                    {...register("marca")}
                  />
                </Campo>
                <Campo id="sr-numero-parte" label="N.º de parte" opcional error={errors.numeroParte?.message}>
                  <input
                    id="sr-numero-parte"
                    className={inputFormClass}
                    placeholder="1R-0750"
                    aria-invalid={!!errors.numeroParte}
                    aria-describedby={describedBy("sr-numero-parte", { error: errors.numeroParte })}
                    {...register("numeroParte")}
                  />
                </Campo>
              </div>
            )}

            <p className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
              <Paperclip className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ¿Tienes una foto de la placa o un listado en PDF? Podrás adjuntarlo en el siguiente paso al ingresar.
            </p>

            {envio.isError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{mensajeEnvio(envio.error)}</p>}

            <button
              type="submit"
              disabled={envio.isPending}
              aria-busy={envio.isPending || undefined}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:col-span-2"
            >
              {envio.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {envio.isPending ? "Procesando..." : "Pedir cotización"}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}