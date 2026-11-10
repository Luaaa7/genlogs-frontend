import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCrearSolicitud } from "../hooks/useCrearSolicitud"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

export function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const mutation = useCrearSolicitud()
  const [error, setError] = useState("")
  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const form = new FormData(event.currentTarget)
    const asunto = String(form.get("asunto") ?? "").trim()
    const descripcion = String(form.get("descripcion") ?? "").trim()
    if (!asunto || descripcion.length < 10) { setError("Completa el asunto y describe tu necesidad con al menos 10 caracteres."); return }
    mutation.mutate({ asunto, descripcion }, { onSuccess: () => navigate("/portal/pedidos") })
  }
  return <div className="mx-auto max-w-2xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p><h1 className="mt-2 text-3xl font-bold">Nueva solicitud</h1><p className="mt-2 text-muted-foreground">Comparte los detalles y te ayudaremos a encontrar la mejor alternativa.</p></div><form onSubmit={enviar} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"><div><Label htmlFor="solicitud-asunto">Asunto</Label><Input id="solicitud-asunto" name="asunto" className="mt-2" placeholder="Ej. Repuestos para mantenimiento" required /></div><div><Label htmlFor="solicitud-descripcion">Detalle de la solicitud</Label><textarea id="solicitud-descripcion" name="descripcion" rows={7} required placeholder="Indica cantidades, especificaciones, ubicación y fecha requerida." className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>{error && <ErrorBanner message={error} />}{mutation.isError && <ErrorBanner message="No se pudo enviar la solicitud. Intenta nuevamente." onRetry={() => mutation.reset()} />}<Button disabled={mutation.isPending} className="w-full">{mutation.isPending ? "Enviando..." : "Enviar solicitud"}</Button></form></div>
}
