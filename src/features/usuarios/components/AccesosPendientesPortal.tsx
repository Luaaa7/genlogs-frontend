import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, UserCheck, X } from "lucide-react"
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

  if (pendientes.isError) {
    return <ErrorBanner message="No se pudieron cargar los accesos pendientes del portal." onRetry={() => void pendientes.refetch()} />
  }
  if (lista.length === 0) {
    return aviso ? <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{aviso}</p> : null
  }

  return (
    <section aria-labelledby="accesos-pendientes-titulo" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-warning" aria-hidden="true" />
        <h2 id="accesos-pendientes-titulo" className="text-lg font-semibold">
          Accesos pendientes del portal <span className="tabular-nums text-muted-foreground">({lista.length})</span>
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Personas que pidieron entrar al portal con el RUC de una empresa que ya es cliente. Revisa que sean de esa empresa antes de activarlas.
      </p>
      {aviso && <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{aviso}</p>}
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
            {lista.map((acceso) => (
              <tr key={acceso.idUsuario} className={filaClass}>
                <Td>
                  <div className="font-medium">{acceso.nombres}</div>
                  <div className="text-xs text-muted-foreground">{acceso.correo}</div>
                </Td>
                <Td>{acceso.empresa ?? "—"}</Td>
                <Td className="tabular-nums">{acceso.ruc ?? "—"}</Td>
                <Td className="whitespace-nowrap">{acceso.fechaSolicitud ? fechaHora.format(new Date(acceso.fechaSolicitud)) : "—"}</Td>
                <Td>{acceso.origen === "GOOGLE" ? "Google" : "Registro"}</Td>
                <Td alinear="derecha">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
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
