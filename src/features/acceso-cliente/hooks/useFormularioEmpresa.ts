import { useRef, useState } from "react"
import { rucValido } from "@/api/contratos/ingresoGoogle"
import { publicApi } from "@/api/publicApi"
import { useTardaMucho } from "@/lib/useTardaMucho"
import { completarEmpresa } from "../api/ingresoGoogleApi"
import { mensajeErrorAcceso } from "../api/ingresoClienteApi"

export type EstadoRuc = "vacio" | "buscando" | "encontrado" | "manual"

interface Opciones {
  /** Se llama cuando la empresa quedó guardada y la cuenta ya puede cotizar. */
  alGuardar: (nombreContacto: string) => void
  /** Se llama cuando la empresa ya es cliente y el acceso queda por aprobar. */
  alPendiente: (mensaje: string) => void
}

/**
 * Lógica del formulario «Datos de tu empresa»: el RUC completa la razón social con SUNAT
 * (sin pisar lo que la persona escribió) y el guardado usa POST /portal/empresa.
 * Lo comparten la página de datos de la empresa y la tarjeta del perfil.
 */
export function useFormularioEmpresa({ alGuardar, alPendiente }: Opciones) {
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const tardaMucho = useTardaMucho(cargando)
  const [razonSocial, setRazonSocial] = useState("")
  const [avisoRuc, setAvisoRuc] = useState("")
  const [rucConsultado, setRucConsultado] = useState("")
  const [estadoRuc, setEstadoRuc] = useState<EstadoRuc>("vacio")
  // La razón social de SUNAT solo se pone si la persona no escribió otra.
  const razonAutomatica = useRef(false)
  const razonActual = useRef("")
  const consulta = useRef<AbortController | null>(null)

  function cambiarRazonSocial(valor: string) {
    setRazonSocial(valor)
    razonActual.current = valor
    razonAutomatica.current = false
  }

  function cambiarRuc(valor: string) {
    const ruc = valor.replace(/\D/g, "")
    consulta.current?.abort()
    consulta.current = null
    if (razonAutomatica.current) {
      setRazonSocial("")
      razonActual.current = ""
      razonAutomatica.current = false
    }
    setAvisoRuc("")
    setRucConsultado("")
    setEstadoRuc("vacio")
    if (!rucValido(ruc)) return
    const control = new AbortController()
    consulta.current = control
    setRucConsultado(ruc)
    setEstadoRuc("buscando")
    setAvisoRuc("Buscando la razón social…")
    publicApi
      .consultarRazonSocial(ruc, control.signal)
      .then((resultado) => {
        if (control.signal.aborted) return
        if (resultado.tipo === "ok" && (razonActual.current.trim() === "" || razonAutomatica.current)) {
          setRazonSocial(resultado.razonSocial)
          razonActual.current = resultado.razonSocial
          razonAutomatica.current = true
          setEstadoRuc("encontrado")
          setAvisoRuc("Razón social completada con SUNAT. Puedes corregirla si hace falta.")
          return
        }
        setEstadoRuc(resultado.tipo === "ok" ? "encontrado" : "manual")
        setAvisoRuc(resultado.tipo === "ok" ? "" : "No pudimos obtener la razón social, escríbela a mano.")
      })
      .catch(() => {
        if (control.signal.aborted) return
        setEstadoRuc("manual")
        setAvisoRuc("No pudimos obtener la razón social, escríbela a mano.")
      })
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const form = new FormData(event.currentTarget)
    const ruc = String(form.get("ruc") ?? "").replace(/\D/g, "")
    const razon = String(form.get("razonSocial") ?? "").trim()
    const nombreContacto = String(form.get("nombreContacto") ?? "").trim()
    const telefono = String(form.get("telefono") ?? "").trim()
    if (!rucValido(ruc)) {
      setError("El RUC debe tener 11 dígitos y empezar con 10 o 20. Si eres persona natural, usa tu RUC 10.")
      return
    }
    setCargando(true)
    try {
      const respuesta = await completarEmpresa({ ruc, razonSocial: razon, nombreContacto, telefono })
      if (respuesta.pendiente) alPendiente(respuesta.mensaje)
      else alGuardar(nombreContacto)
    } catch (cause) {
      setError(mensajeErrorAcceso(cause, "No pudimos guardar los datos de tu empresa. Inténtalo de nuevo."))
    } finally {
      setCargando(false)
    }
  }

  return { error, cargando, tardaMucho, razonSocial, avisoRuc, rucConsultado, estadoRuc, cambiarRuc, cambiarRazonSocial, enviar }
}
