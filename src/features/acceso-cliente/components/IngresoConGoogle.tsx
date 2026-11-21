import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { leerVolver } from "@/api/contratos/registro"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { iniciarSesionCliente } from "@/lib/sesiones"
import { BotonGoogle } from "./BotonGoogle"
import { ingresarConGoogle } from "../api/ingresoGoogleApi"
import { mensajeErrorAcceso } from "../api/ingresoClienteApi"

interface Props {
  texto?: "continue_with" | "signup_with"
}

/**
 * «Continuar con Google» del ingreso y del registro (v3.4). Abre la sesión aunque la
 * cuenta todavía no tenga empresa: los datos se le piden al pedir su primera cotización.
 */
export function IngresoConGoogle({ texto = "continue_with" }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [aviso, setAviso] = useState("")
  const [cargando, setCargando] = useState(false)

  async function conCredencial(credential: string) {
    setError("")
    setAviso("")
    setCargando(true)
    try {
      const respuesta = await ingresarConGoogle(credential)
      if (respuesta.pendiente || !respuesta.token) {
        setAviso(respuesta.mensaje ?? "Tu acceso al portal está pendiente de aprobación.")
        return
      }
      if ((respuesta.nombreRol ?? "").toUpperCase() !== "CLIENTE") {
        setError("Esta cuenta no es del portal de clientes. El personal de GENLOGS ingresa por el acceso interno.")
        return
      }
      const nombre = respuesta.nombre ?? respuesta.nombreUsuario ?? ""
      if (!iniciarSesionCliente(respuesta.token, nombre, respuesta.perfilCompleto)) {
        setError("Tu navegador no permite guardar la sesión. Revisa que no esté en modo privado o con el almacenamiento bloqueado.")
        return
      }
      // Sin empresa también entra: los datos se piden recién al pedir una cotización (ClienteRoute).
      navigate(leerVolver(location.search), { replace: true })
    } catch (cause) {
      setError(mensajeErrorAcceso(cause, "No pudimos ingresar con Google. Inténtalo de nuevo."))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-3" aria-busy={cargando || undefined}>
      <BotonGoogle onCredential={conCredencial} texto={texto} />
      {cargando && <p className="text-center text-sm text-muted-foreground">Ingresando con Google...</p>}
      {aviso && (
        <p role="status" className="rounded-md bg-info/10 px-3 py-2 text-sm text-info">
          {aviso}
        </p>
      )}
      {error && <ErrorBanner message={error} />}
    </div>
  )
}
