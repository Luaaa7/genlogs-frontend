import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass, textareaFormClass } from "@/components/ui/campoEstilos"
import { rutaRegistro } from "@/api/contratos/registro"
import { mensajeError } from "@/lib/errores"
import {
  borrarPedidoPendiente,
  guardarPedidoPendiente,
  leerPedidoPendiente,
  tokenCliente,
} from "../lib/pedidoPendiente"
import { enviarSolicitudLanding } from "../lib/enviarSolicitudLanding"

const esquema = z
  .object({
    marca: z.string().trim().max(100, "Máximo 100 caracteres"),
    numeroParte: z.string().trim().max(60, "Máximo 60 caracteres"),
    descripcion: z.string().trim().min(3, "Cuéntanos qué repuesto necesitas").max(255, "Máximo 255 caracteres"),
    cantidad: z.string().trim().refine((v) => Number(v) > 0, "La cantidad debe ser mayor a 0"),
  })
  .refine((v) => !v.numeroParte || v.marca, { path: ["marca"], message: "Indica la marca del N.º de parte" })
type Valores = z.infer<typeof esquema>

type Pedido = { marca: string; numeroParte: string; descripcion: string; cantidad: number }

/** Al volver del registro, la landing llega con esta ruta y envía el pedido guardado (D-30). */
const VOLVER = "/#solicitud"

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
 * navegador y manda al registro con ?volver=; al volver con sesión, lo envía a
 * POST /api/solicitudes (canal LANDING). Con sesión de cliente, lo envía directo.
 */
export function SolicitudRapida() {
  const navigate = useNavigate()
  // Pedido guardado antes de ir al registro (se lee una sola vez, al abrir la landing).
  const [pendiente] = useState(() => leerPedidoPendiente())
  const autoEnviado = useRef(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Valores>({
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

  const alEnviar = handleSubmit((v) => {
    const pedido = { marca: v.marca, numeroParte: v.numeroParte, descripcion: v.descripcion, cantidad: Number(v.cantidad) }
    const token = tokenCliente()
    if (token) {
      envio.mutate({ pedido, token })
      return
    }
    // D-16: sin cuenta no se crean solicitudes; se registra con RUC y vuelve aquí.
    guardarPedidoPendiente(pedido)
    navigate(rutaRegistro(VOLVER))
  })

  return (
    <section id="solicitud" aria-labelledby="solicitud-titulo" className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Solicitud rápida</p>
          <h2 id="solicitud-titulo" className="mt-2 text-3xl font-bold">Cuéntanos qué necesitas.</h2>
          <p className="mt-4 max-w-lg text-primary-foreground/80">
            Escribe la marca y el N.º de parte si los tienes. Para cotizar te pediremos crear tu acceso con el RUC
            de tu empresa; es inmediato y no pierdes lo que escribiste.
          </p>
        </div>

        {envio.data ? (
          <div role="status" className="rounded-xl bg-card p-6 text-card-foreground">
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
            <h3 className="mt-2 text-lg font-semibold">Recibimos tu pedido {envio.data.codigoSolicitud}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Puedes seguir su avance en el portal.</p>
            <Link
              to="/portal/pedidos"
              className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ver mis pedidos
            </Link>
          </div>
        ) : (
          <form onSubmit={alEnviar} noValidate className="grid gap-4 rounded-xl bg-card p-6 text-card-foreground sm:grid-cols-2">
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

            {envio.isError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{mensajeEnvio(envio.error)}</p>}

            <button
              type="submit"
              disabled={envio.isPending}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:col-span-2"
            >
              {envio.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              {envio.isPending ? "Enviando…" : "Pedir cotización"}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
