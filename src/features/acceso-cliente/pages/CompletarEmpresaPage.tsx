import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { leerVolver } from "@/api/contratos/registro"
import { rucValido } from "@/api/contratos/ingresoGoogle"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cerrarSesionCliente, leerSesionCliente, marcarPerfilCompleto } from "@/lib/sesiones"
import { completarEmpresa } from "../api/ingresoGoogleApi"
import { mensajeErrorAcceso } from "../api/ingresoClienteApi"

/**
 * Datos de la empresa (v3.4). La cuenta que entró con Google los da antes de su
 * primera cotización: sin RUC no se puede cotizar ni facturar.
 * Si la empresa ya es cliente, el acceso queda pendiente hasta que lo active el
 * Jefe Administrativo, y se cierra la sesión.
 */
export function CompletarEmpresaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [pendiente, setPendiente] = useState("")
  const [cargando, setCargando] = useState(false)
  const nombreSesion = leerSesionCliente()?.nombre ?? ""

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const form = new FormData(event.currentTarget)
    const ruc = String(form.get("ruc") ?? "").replace(/\D/g, "")
    const razonSocial = String(form.get("razonSocial") ?? "").trim()
    const nombreContacto = String(form.get("nombreContacto") ?? "").trim()
    const telefono = String(form.get("telefono") ?? "").trim()
    if (!rucValido(ruc)) {
      setError("El RUC debe tener 11 dígitos y empezar con 10 o 20. Si eres persona natural, usa tu RUC 10.")
      return
    }
    setCargando(true)
    try {
      const respuesta = await completarEmpresa({ ruc, razonSocial, nombreContacto, telefono })
      if (respuesta.pendiente) {
        cerrarSesionCliente()
        setPendiente(respuesta.mensaje)
        return
      }
      marcarPerfilCompleto(nombreContacto)
      navigate(leerVolver(location.search, "/portal/solicitud"), { replace: true })
    } catch (cause) {
      setError(mensajeErrorAcceso(cause, "No pudimos guardar los datos de tu empresa. Inténtalo de nuevo."))
    } finally {
      setCargando(false)
    }
  }

  if (pendiente) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-bold">Datos de tu empresa</h1>
        <p role="status" className="rounded-md bg-info/10 px-4 py-3 text-sm text-info">{pendiente}</p>
        <Link to="/" className="font-medium text-accent hover:underline">Volver a la página principal</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p>
        <h1 className="mt-2 text-3xl font-bold">Datos de tu empresa</h1>
        <p className="mt-2 text-muted-foreground">
          Te los pedimos una sola vez, antes de tu primera cotización: con ellos preparamos tus
          cotizaciones y tus comprobantes.
        </p>
      </div>
      <form onSubmit={enviar} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="empresa-ruc">RUC</Label>
            <Input id="empresa-ruc" name="ruc" inputMode="numeric" autoComplete="off" maxLength={11} className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="empresa-telefono">Teléfono (opcional)</Label>
            <Input id="empresa-telefono" name="telefono" type="tel" autoComplete="tel" maxLength={30} className="mt-2" />
          </div>
        </div>
        <div>
          <Label htmlFor="empresa-razon">Razón social</Label>
          <Input id="empresa-razon" name="razonSocial" autoComplete="organization" maxLength={200} className="mt-2" required />
        </div>
        <div>
          <Label htmlFor="empresa-contacto">Persona de contacto</Label>
          <Input
            id="empresa-contacto"
            name="nombreContacto"
            autoComplete="name"
            maxLength={150}
            defaultValue={nombreSesion}
            className="mt-2"
            required
          />
        </div>
        {error && <ErrorBanner message={error} />}
        <Button className="w-full" disabled={cargando}>{cargando ? "Guardando..." : "Guardar y continuar"}</Button>
        <p className="text-center text-xs text-muted-foreground">
          Validamos el RUC en SUNAT. Si tu empresa ya tiene cuenta en el portal, GENLOGS revisará tu acceso.
        </p>
      </form>
    </div>
  )
}
