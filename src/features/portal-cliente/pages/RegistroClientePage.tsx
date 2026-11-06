import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { portalApi } from "@/api/portalApi"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function RegistroClientePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(false)

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMensaje("")
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return }
    setCargando(true)
    try {
      const respuesta = await portalApi.registrarCliente({
        razonSocial: String(form.get("razonSocial") ?? ""),
        documento: String(form.get("documento") ?? ""),
        nombreContacto: String(form.get("nombreContacto") ?? ""),
        correo: String(form.get("correo") ?? ""),
        telefono: String(form.get("telefono") ?? ""),
        password,
      })
      if (respuesta.token) {
        localStorage.setItem("cliente_access_token", respuesta.token)
        sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: respuesta.nombre ?? respuesta.nombreUsuario ?? "", rol: "CLIENTE" }))
        navigate("/portal/pedidos", { replace: true })
      } else {
        setMensaje(respuesta.mensaje ?? "Registro recibido. Ya puedes ingresar cuando tu acceso sea habilitado.")
      }
    } catch (cause) {
      const response = cause as { response?: { data?: { message?: string; error?: string } } }
      setError(response.response?.data?.message ?? response.response?.data?.error ?? "No se pudo completar el registro.")
    } finally { setCargando(false) }
  }

  return <div className="mx-auto max-w-xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p><h1 className="mt-2 text-3xl font-bold">Crea tu acceso</h1><p className="mt-2 text-muted-foreground">Registra tu empresa para consultar pedidos y enviar solicitudes.</p></div><form onSubmit={enviar} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="registro-razon">Razón social</Label><Input id="registro-razon" name="razonSocial" className="mt-2" required /></div><div><Label htmlFor="registro-documento">RUC / documento</Label><Input id="registro-documento" name="documento" className="mt-2" required /></div><div><Label htmlFor="registro-contacto">Persona de contacto</Label><Input id="registro-contacto" name="nombreContacto" className="mt-2" required /></div><div><Label htmlFor="registro-correo">Correo</Label><Input id="registro-correo" name="correo" type="email" className="mt-2" required /></div><div><Label htmlFor="registro-telefono">Teléfono</Label><Input id="registro-telefono" name="telefono" type="tel" className="mt-2" /></div><div className="sm:col-span-2"><Label htmlFor="registro-password">Contraseña</Label><Input id="registro-password" name="password" type="password" minLength={8} autoComplete="new-password" className="mt-2" required /></div></div>{error && <ErrorBanner message={error} />}{mensaje && <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{mensaje}</p>}<Button className="w-full" disabled={cargando}>{cargando ? "Registrando..." : "Crear acceso"}</Button><p className="text-center text-sm text-muted-foreground">¿Ya tienes una cuenta? <Link to="/portal/pedidos" state={{ from: location }} className="font-medium text-accent hover:underline">Ingresar al portal</Link></p></form></div>
}
