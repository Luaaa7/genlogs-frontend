import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { leerVolver, PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { RUTA_EMPRESA_PORTAL } from "@/api/contratos/ingresoGoogle"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { iniciarSesionCliente } from "@/lib/sesiones"
import { BotonGoogle } from "./BotonGoogle"
import { ingresarConGoogle } from "../api/ingresoGoogleApi"
import { mensajeErrorAcceso } from "../api/ingresoClienteApi"

interface Props {
  texto?: "continue_with" | "signup_with"
}

/**
 * «Continuar con Google» del ingreso y del registro (v3.4). Si la cuenta todavía no
 * tiene empresa, abre la sesión y lleva a los datos de la empresa, con ?volver=.
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
      const destino = leerVolver(location.search)
      if (!respuesta.perfilCompleto) {
        navigate(`${RUTA_EMPRESA_PORTAL}?${PARAMETRO_VOLVER}=${encodeURIComponent(destino)}`, { replace: true })
        return
      }
      navigate(destino, { replace: true })
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
