import { useState } from "react"
import { Link } from "react-router-dom"

export function SolicitudRapida() {
  const [enviada, setEnviada] = useState(false)
  const [error, setError] = useState("")
  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (!String(form.get("correo") ?? "").includes("@")) { setError("Ingresa un correo válido."); return }
    setError("")
    setEnviada(true)
  }
  return <section aria-labelledby="solicitud-titulo" className="bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center lg:px-8"><div><p className="text-sm font-semibold uppercase tracking-wide opacity-80">Solicitud rápida</p><h2 id="solicitud-titulo" className="mt-2 text-3xl font-bold">Cuéntanos qué necesitas.</h2><p className="mt-4 max-w-lg text-primary-foreground/80">Déjanos tus datos y nuestro equipo se pondrá en contacto contigo para entender el requerimiento.</p></div>{enviada ? <div className="rounded-xl bg-card p-6 text-card-foreground"><h3 className="text-lg font-semibold">¡Gracias por contactarnos!</h3><p className="mt-2 text-sm text-muted-foreground">Para hacer seguimiento y enviar archivos, crea tu acceso al portal.</p><Link to="/portal/registro" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Crear acceso</Link></div> : <form onSubmit={enviar} className="space-y-4 rounded-xl bg-card p-6 text-card-foreground"><div><label htmlFor="solicitud-nombre" className="text-sm font-medium">Nombre o empresa</label><input id="solicitud-nombre" name="nombre" required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div><div><label htmlFor="solicitud-correo" className="text-sm font-medium">Correo</label><input id="solicitud-correo" name="correo" type="email" required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div><div><label htmlFor="solicitud-detalle" className="text-sm font-medium">¿Qué necesitas?</label><textarea id="solicitud-detalle" name="detalle" required rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button type="submit" className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Solicitar contacto</button></form>}</div></section>
}
