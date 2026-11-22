import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, CircleCheck, Clock, LogIn, UserPlus, Users, X } from "lucide-react"
import {
  activarAccesoPendiente,
  listarAccesosPendientes,
  rechazarAccesoPendiente,
  type AccesoPendiente,
} from "@/api/usuariosApi"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Tabla, TablaCard, Td, Th, filaClass } from "@/components/ui/tabla"

const CLAVE = ["usuarios", "pendientes-portal"] as const
const fechaHora = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" })

/** «hace 5 min», «hace 2 h», «hace 3 d»: qué tan antiguo es el pedido de acceso. */
function haceCuanto(fechaIso: string, ahora = Date.now()): string {
  const minutos = Math.max(0, Math.floor((ahora - new Date(fechaIso).getTime()) / 60000))
  if (minutos < 1) return "recién"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase()
}

const COLORES_AVATAR = ["bg-brand-blue", "bg-brand-navy", "bg-success"]

function mensajeError(error: unknown, porDefecto: string): string {
  const e = error as { response?: { data?: { message?: string } } }
  return e.response?.data?.message ?? porDefecto
}

/**
 * BPMN 8.4 · Revisión de accesos pendientes del portal. El Jefe Administrativo ve quién pidió
 * acceso con el RUC de una empresa que ya es cliente (registro o Google) y lo activa o lo rechaza.
 * Al cliente le llega un correo en los dos casos. Sin pendientes, la sección no se muestra.
 */
export function AccesosPendientesPortal() {
  const queryClient = useQueryClient()
  const [aviso, setAviso] = useState("")
  const [error, setError] = useState("")
  const [porRechazar, setPorRechazar] = useState<AccesoPendiente | null>(null)

  const pendientes = useQuery({ queryKey: CLAVE, queryFn: listarAccesosPendientes })

  const activar = useMutation({
    mutationFn: (acceso: AccesoPendiente) => activarAccesoPendiente(acceso.idUsuario),
    onSuccess: (_, acceso) => {
      setError("")
      setAviso(`Acceso de ${acceso.nombres} activado. Le avisamos por correo.`)
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
    onError: (e) => setError(mensajeError(e, "No se pudo activar el acceso. Inténtalo de nuevo.")),
  })

  const rechazar = useMutation({
    mutationFn: (acceso: AccesoPendiente) => rechazarAccesoPendiente(acceso.idUsuario),
    onSuccess: (_, acceso) => {
      setError("")
      setPorRechazar(null)
      setAviso(`Acceso de ${acceso.nombres} rechazado. Le avisamos por correo.`)
      void queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
    onError: (e) => {
      setPorRechazar(null)
      setError(mensajeError(e, "No se pudo rechazar el acceso. Inténtalo de nuevo."))
    },
  })

  const lista = pendientes.data ?? []
  const ocupado = activar.isPending || rechazar.isPending
  const conGoogle = lista.filter((a) => a.origen === "GOOGLE").length

  if (pendientes.isError) {
    return <ErrorBanner message="No se pudieron cargar los accesos pendientes del portal." onRetry={() => void pendientes.refetch()} />
  }
  if (lista.length === 0) {
    return aviso ? <p role="status" className="animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm font-medium text-success duration-300 motion-reduce:animate-none"><CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{aviso}</p> : null
  }

  return (
    <section aria-labelledby="accesos-pendientes-titulo" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="accesos-pendientes-titulo" className="text-lg font-semibold">
          Accesos pendientes del portal <span className="tabular-nums text-muted-foreground">({lista.length})</span>
        </h2>
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warning" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Personas que pidieron entrar al portal con el RUC de una empresa que ya es cliente. Revisa que sean de esa empresa antes de activarlas.
      </p>
      <ul aria-label="Resumen de accesos pendientes" className="grid gap-3 sm:grid-cols-3">
        {[
          { etiqueta: "Por revisar", valor: lista.length, icono: Users, caja: "bg-brand-navy text-white border-brand-navy", fondoIcono: "bg-white/15", texto: "text-white/80" },
          { etiqueta: "Con Google", valor: conGoogle, icono: LogIn, caja: "bg-card border-border", fondoIcono: "bg-info/10 text-info", texto: "text-muted-foreground" },
          { etiqueta: "Con registro", valor: lista.length - conGoogle, icono: UserPlus, caja: "bg-card border-border", fondoIcono: "bg-muted text-muted-foreground", texto: "text-muted-foreground" },
        ].map(({ etiqueta, valor, icono: Icono, caja, fondoIcono, texto }, i) => (
          <li
            key={etiqueta}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both flex items-center justify-between rounded-xl border px-4 py-3.5 duration-500 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg motion-reduce:animate-none motion-reduce:transition-none ${caja}`}
          >
            <div>
              <span className={`block text-xs ${texto}`}>{etiqueta}</span>
              <span className="block text-3xl font-bold tabular-nums leading-tight">{valor}</span>
            </div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${fondoIcono}`} aria-hidden="true"><Icono className="h-5 w-5" /></span>
          </li>
        ))}
      </ul>
      {aviso && <p role="status" className="animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm font-medium text-success duration-300 motion-reduce:animate-none"><CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{aviso}</p>}
      {error && <ErrorBanner message={error} />}
      <TablaCard>
        <Tabla titulo="Accesos pendientes del portal" minWidth={760}>
          <thead>
            <tr>
              <Th>Contacto</Th>
              <Th>Empresa</Th>
              <Th>RUC</Th>
              <Th>Pedido</Th>
              <Th>Origen</Th>
              <Th alinear="derecha">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((acceso, i) => (
              <tr key={acceso.idUsuario} className={`${filaClass} animate-in fade-in-0 duration-300 motion-reduce:animate-none`}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${COLORES_AVATAR[i % COLORES_AVATAR.length]}`} aria-hidden="true">{iniciales(acceso.nombres)}</span>
                    <div>
                      <div className="font-medium">{acceso.nombres}</div>
                      <div className="text-xs text-muted-foreground">{acceso.correo}</div>
                    </div>
                  </div>
                </Td>
                <Td>{acceso.empresa ?? "—"}</Td>
                <Td className="tabular-nums">{acceso.ruc ?? "—"}</Td>
                <Td className="whitespace-nowrap">
                  {acceso.fechaSolicitud ? (
                    <>
                      <span className="flex items-center gap-1 text-xs font-medium text-warning-text"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{haceCuanto(acceso.fechaSolicitud)}</span>
                      <span className="text-xs text-muted-foreground">{fechaHora.format(new Date(acceso.fechaSolicitud))}</span>
                    </>
                  ) : "—"}
                </Td>
                <Td>
                  {acceso.origen === "GOOGLE" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-1 text-xs font-semibold text-info"><LogIn className="h-3.5 w-3.5" aria-hidden="true" />Google</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"><UserPlus className="h-3.5 w-3.5" aria-hidden="true" />Registro</span>
                  )}
                </Td>
                <Td alinear="derecha">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      className="bg-success text-success-foreground hover:bg-success/90 active:scale-[0.97] motion-reduce:transform-none"
                      disabled={ocupado}
                      onClick={() => {
                        setAviso("")
                        activar.mutate(acceso)
                      }}
                      aria-label={`Activar acceso de ${acceso.nombres}`}
                    >
                      <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                      Activar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.97] motion-reduce:transform-none"
                      disabled={ocupado}
                      onClick={() => {
                        setAviso("")
                        setPorRechazar(acceso)
                      }}
                      aria-label={`Rechazar acceso de ${acceso.nombres}`}
                    >
                      <X className="mr-1 h-4 w-4" aria-hidden="true" />
                      Rechazar
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </TablaCard>
      <ConfirmDialog
        open={porRechazar !== null}
        title="¿Rechazar este acceso?"
        description={porRechazar ? `${porRechazar.nombres} (${porRechazar.correo}) no podrá entrar al portal de ${porRechazar.empresa ?? "la empresa"}. Le avisaremos por correo.` : ""}
        confirmLabel="Rechazar acceso"
        variant="destructive"
        isLoading={rechazar.isPending}
        onConfirm={() => porRechazar && rechazar.mutate(porRechazar)}
        onCancel={() => setPorRechazar(null)}
      />
    </section>
  )
}
