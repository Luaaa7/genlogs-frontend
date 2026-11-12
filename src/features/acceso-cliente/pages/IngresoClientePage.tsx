import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { leerVolver, rutaRegistro, PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { iniciarSesionCliente } from "@/lib/sesiones"
import { ingresarCliente, mensajeErrorAcceso } from "../api/ingresoClienteApi"

/**
 * Ingreso del cliente al portal (FE-A). Separado del login del personal: usa su
 * propia sesión (lib/sesiones.ts) y, al terminar, vuelve a ?volver= (D-30).
 */
export function IngresoClientePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const volverCrudo = new URLSearchParams(location.search).get(PARAMETRO_VOLVER) ?? undefined

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const form = new FormData(event.currentTarget)
    const correo = String(form.get("correo") ?? "").trim()
    const password = String(form.get("password") ?? "")
    setCargando(true)
    try {
      const respuesta = await ingresarCliente({ correo, password })
      if (!respuesta.token || (respuesta.nombreRol ?? "").toUpperCase() !== "CLIENTE") {
        setError("Esta cuenta no es del portal de clientes. El personal de GENLOGS ingresa por el acceso interno.")
        return
      }
      if (!iniciarSesionCliente(respuesta.token, respuesta.nombre ?? respuesta.nombreUsuario ?? "")) {
        setError("Tu navegador no permite guardar la sesión. Revisa que no esté en modo privado o con el almacenamiento bloqueado.")
        return
      }
      navigate(leerVolver(location.search), { replace: true })
    } catch (cause) {
      setError(mensajeErrorAcceso(cause, "Correo o contraseña incorrectos."))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p>
        <h1 className="mt-2 text-3xl font-bold">Ingresa a tu cuenta</h1>
        <p className="mt-2 text-muted-foreground">Consulta tus pedidos y envía nuevas solicitudes.</p>
      </div>
      <form onSubmit={enviar} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <Label htmlFor="ingreso-correo">Correo</Label>
          <Input id="ingreso-correo" name="correo" type="email" autoComplete="email" className="mt-2" required />
        </div>
        <div>
          <Label htmlFor="ingreso-password">Contraseña</Label>
          <Input id="ingreso-password" name="password" type="password" autoComplete="current-password" className="mt-2" required />
        </div>
        {error && <ErrorBanner message={error} />}
        <Button className="w-full" disabled={cargando}>{cargando ? "Ingresando..." : "Ingresar"}</Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link to={rutaRegistro(volverCrudo)} className="font-medium text-accent hover:underline">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}
