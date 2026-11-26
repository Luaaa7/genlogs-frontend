import { useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Check, Loader2, X } from "lucide-react"
import { portalApi } from "@/api/portalApi"
import { publicApi } from "@/api/publicApi"
import { PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { destinoTrasAcceso } from "@/lib/carritoPublico"
import { rutaIngresoCliente } from "@/api/contratos/ingresoCliente"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AvisoCarritoPublico } from "@/features/acceso-cliente/components/AvisoCarritoPublico"
import { CampoPassword } from "@/features/acceso-cliente/components/CampoPassword"
import { IngresoConGoogle } from "@/features/acceso-cliente/components/IngresoConGoogle"
import { SeparadorO } from "@/features/acceso-cliente/components/SeparadorO"
import { EtiquetaPortal } from "../components/EtiquetaPortal"
import { iniciarSesionCliente } from "@/lib/sesiones"
import { cn } from "@/lib/utils/utils"
import { mensajeErrorAcceso } from "@/features/acceso-cliente/api/ingresoClienteApi"
import { reglasPassword } from "../lib/reglasPassword"

type EstadoRuc = "" | "cargando" | "ok" | "invalido" | "sinDato" | "limite"

const MENSAJE_RUC: Record<Exclude<EstadoRuc, "">, string> = {
  cargando: "Buscando la razón social…",
  ok: "Razón social completada con SUNAT. Puedes corregirla si hace falta.",
  invalido: "Ingresa un RUC válido",
  sinDato: "No pudimos obtener la razón social, escríbela a mano",
  limite: "Escribe la razón social a mano",
}

const RUC_VALIDO = /^(10|20)\d{9}$/

/**
 * Registro del cliente (D-10, FE-A; BPMN v3.4 7.1 y 7.2). Con un RUC válido trae la
 * razón social (RU3), que sigue editable y nunca bloquea el registro. La contraseña
 * se confirma y muestra sus reglas en vivo; el backend vuelve a validarlas.
 * Si el backend devuelve token, abre la sesión del cliente y vuelve a ?volver= (D-30).
 */
export function RegistroClientePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(false)

  const [documento, setDocumento] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [estadoRuc, setEstadoRuc] = useState<EstadoRuc>("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmacion, setConfirmacion] = useState("")

  const ultimoRuc = useRef("")
  const consulta = useRef<AbortController | null>(null)
  const razonActual = useRef("")
  const razonAutomatica = useRef(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  // Evita un segundo envío antes de que el botón alcance a deshabilitarse.
  const enviando = useRef(false)

  const volverCrudo = new URLSearchParams(location.search).get(PARAMETRO_VOLVER) ?? undefined
  const rutaIngreso = rutaIngresoCliente(volverCrudo)

  const reglas = reglasPassword(password, correo)
  const passwordOk = reglas.every((regla) => regla.cumple)
  const coincide = confirmacion.length > 0 && confirmacion === password
  const puedeEnviar = passwordOk && coincide && !cargando

  function cambiarRazonSocial(valor: string) {
    setRazonSocial(valor)
    razonActual.current = valor
    razonAutomatica.current = false
  }

  /** Si la razón social vino del autocompletado y nadie la tocó, se limpia al cambiar el RUC (RU4). */
  function limpiarRazonAutomatica() {
    if (!razonAutomatica.current) return
    setRazonSocial("")
    razonActual.current = ""
    razonAutomatica.current = false
  }

  function cancelarConsulta() {
    consulta.current?.abort()
    consulta.current = null
  }

  function cambiarDocumento(valor: string) {
    setDocumento(valor)
    const ruc = valor.replace(/\D/g, "")
    if (ruc.length !== 11) {
      // RU1: con otra longitud (o un DNI) no se consulta nada.
      if (ruc !== ultimoRuc.current) {
        cancelarConsulta()
        limpiarRazonAutomatica()
        ultimoRuc.current = ""
      }
      setEstadoRuc("")
      return
    }
    if (!RUC_VALIDO.test(ruc)) {
      // RU2/RU7: no empieza con 10 o 20.
      cancelarConsulta()
      limpiarRazonAutomatica()
      ultimoRuc.current = ""
      setEstadoRuc("invalido")
      return
    }
    if (ruc === ultimoRuc.current) return
    limpiarRazonAutomatica()
    consultarRuc(ruc)
  }

  function consultarRuc(ruc: string) {
    cancelarConsulta()
    const control = new AbortController()
    consulta.current = control
    ultimoRuc.current = ruc
    setEstadoRuc("cargando")
    publicApi
      .consultarRazonSocial(ruc, control.signal)
      .then((resultado) => {
        if (control.signal.aborted) return
        if (resultado.tipo === "ok") {
          // RU4: no se pisa lo que la persona ya escribió a mano.
          if (razonActual.current.trim() === "" || razonAutomatica.current) {
            setRazonSocial(resultado.razonSocial)
            razonActual.current = resultado.razonSocial
            razonAutomatica.current = true
            setEstadoRuc("ok")
          } else {
            setEstadoRuc("")
          }
          return
        }
        setEstadoRuc(resultado.tipo)
      })
      .catch(() => {
        if (!control.signal.aborted) setEstadoRuc("sinDato")
      })
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!puedeEnviar || enviando.current) return
    setError("")
    setMensaje("")
    const form = new FormData(event.currentTarget)
    enviando.current = true
    setCargando(true)
    try {
      const respuesta = await portalApi.registrarCliente({
        razonSocial,
        documento,
        nombreContacto: String(form.get("nombreContacto") ?? ""),
        correo,
        telefono: String(form.get("telefono") ?? ""),
        password,
      })
      if (respuesta.token && iniciarSesionCliente(respuesta.token, respuesta.nombre ?? respuesta.nombreUsuario ?? "")) {
        // Acceso inmediato (D-10): vuelve a donde estaba, por ejemplo la landing con su pedido guardado (D-30).
        navigate(destinoTrasAcceso(location.search), { replace: true })
      } else {
        setMensaje(respuesta.mensaje ?? "Cuenta creada. Ingresa con tu correo y contraseña.")
      }
    } catch (cause) {
      const texto = mensajeErrorAcceso(cause, "No se pudo completar el registro.")
      setError(texto)
      const status = (cause as { response?: { status?: number } }).response?.status
      if (status === 400 && /^La contraseña/.test(texto)) {
        // CO6/CO8: la contraseña no pasó en el backend. Se limpian solo los dos campos de contraseña.
        setPassword("")
        setConfirmacion("")
        passwordRef.current?.focus()
      }
    } finally {
      enviando.current = false
      setCargando(false)
    }
  }

  const mensajeRuc = estadoRuc ? MENSAJE_RUC[estadoRuc] : ""

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div data-testid="tarjeta-registro" className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <EtiquetaPortal />
      <h1 className="mt-2 text-3xl font-bold">Crea tu acceso</h1>
      <p className="mt-2 text-muted-foreground">Registra tu empresa para consultar pedidos y enviar solicitudes.</p>
      <AvisoCarritoPublico className="mt-5" />
      <form onSubmit={enviar} className="mt-6 space-y-5">
        <IngresoConGoogle texto="signup_with" />
        <SeparadorO texto="o regístrate con tu RUC" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="registro-documento">RUC / documento</Label>
            <Input
              id="registro-documento"
              name="documento"
              inputMode="numeric"
              autoComplete="off"
              className="mt-2"
              value={documento}
              onChange={(e) => cambiarDocumento(e.target.value)}
              aria-describedby={mensajeRuc ? "registro-documento-ayuda" : undefined}
              aria-invalid={estadoRuc === "invalido" || undefined}
              required
            />
            {mensajeRuc && (
              <p
                id="registro-documento-ayuda"
                role="status"
                className={cn(
                  "mt-1.5 flex items-center gap-1.5 text-sm",
                  estadoRuc === "invalido" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {estadoRuc === "cargando" && <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden="true" />}
                {mensajeRuc}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="registro-contacto">Persona de contacto</Label>
            <Input id="registro-contacto" name="nombreContacto" className="mt-2" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="registro-razon">Razón social</Label>
            <Input
              id="registro-razon"
              name="razonSocial"
              className="mt-2"
              value={razonSocial}
              onChange={(e) => cambiarRazonSocial(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="registro-correo">Correo</Label>
            <Input
              id="registro-correo"
              name="correo"
              type="email"
              autoComplete="email"
              className="mt-2"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="registro-telefono">Teléfono</Label>
            <Input id="registro-telefono" name="telefono" type="tel" className="mt-2" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="registro-password">Contraseña</Label>
            <CampoPassword
              ref={passwordRef}
              id="registro-password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="registro-password-reglas"
              required
            />
            <div id="registro-password-reglas" aria-live="polite" className="mt-2">
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {reglas.map((regla) => (
                  <li
                    key={regla.id}
                    className={cn("flex items-center gap-1.5", regla.cumple ? "text-success" : "text-muted-foreground")}
                  >
                    {regla.cumple ? (
                      <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="size-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {regla.texto}
                      <span className="sr-only">{regla.cumple ? " (cumple)" : " (falta)"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="registro-confirmacion">Confirmar contraseña</Label>
            <CampoPassword
              id="registro-confirmacion"
              name="confirmacion"
              etiquetaVer="confirmación"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              aria-invalid={(confirmacion.length > 0 && !coincide) || undefined}
              required
            />
            {confirmacion.length > 0 && !coincide && (
              <p role="status" className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
                <X className="size-3.5 shrink-0" aria-hidden="true" />
                Las contraseñas no coinciden
              </p>
            )}
          </div>
        </div>
        {error && <ErrorBanner message={error} />}
        {mensaje && (
          <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            {mensaje}
          </p>
        )}
        <Button className="w-full" disabled={!puedeEnviar}>
          {cargando ? "Registrando..." : "Crear acceso"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link to={rutaIngreso} className="font-medium text-accent hover:underline">
            Ingresar al portal
          </Link>
        </p>
      </form>
      </div>
    </div>
  )
}
