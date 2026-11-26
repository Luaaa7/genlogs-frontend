import { useRef, useState } from "react"
import { ClipboardList, FileText, Truck } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { rutaRegistro, PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { destinoTrasAcceso } from "@/lib/carritoPublico"
import { iniciarSesionCliente } from "@/lib/sesiones"
import { ingresarCliente, mensajeErrorAcceso } from "../api/ingresoClienteApi"
import { AvisoCarritoPublico } from "../components/AvisoCarritoPublico"
import { CampoPassword } from "../components/CampoPassword"
import { EnlaceIngresoPersonal } from "../components/EnlaceIngresoPersonal"
import { IngresoConGoogle } from "../components/IngresoConGoogle"
import { SeparadorO } from "../components/SeparadorO"
import { EtiquetaPortal } from "@/features/portal-cliente/components/EtiquetaPortal"

const RESUMEN_PORTAL = [
  { Icono: FileText, titulo: "Cotizaciones:", texto: "revísalas y apruébalas o recházalas." },
  { Icono: ClipboardList, titulo: "Órdenes:", texto: "sigue tus pedidos en curso." },
  { Icono: Truck, titulo: "Despachos:", texto: "mira en qué etapa está cada entrega." },
]

/**
 * Ingreso del cliente al portal (FE-A). Separado del login del personal: usa su
 * propia sesión (lib/sesiones.ts) y, al terminar, vuelve a ?volver= (D-30) o, si eligió repuestos en la landing, va a enviarlos.
 */
export function IngresoClientePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  // La cuenta es del personal: solo cambia el aviso (con un enlace a /login), no la autenticación.
  const [esPersonal, setEsPersonal] = useState(false)
  // Evita un segundo envío (Enter repetido) antes de que el botón alcance a deshabilitarse.
  const enviando = useRef(false)

  const volverCrudo = new URLSearchParams(location.search).get(PARAMETRO_VOLVER) ?? undefined

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando.current) return
    setError("")
    setEsPersonal(false)
    const form = new FormData(event.currentTarget)
    const correo = String(form.get("correo") ?? "").trim()
    const password = String(form.get("password") ?? "")
    enviando.current = true
    setCargando(true)
    try {
      const respuesta = await ingresarCliente({ correo, password })
      if (!respuesta.token || (respuesta.nombreRol ?? "").toUpperCase() !== "CLIENTE") {
        setError("Esta cuenta no es del portal de clientes. El personal de GENLOGS ingresa por el acceso interno.")
        setEsPersonal(true)
        return
      }
      if (!iniciarSesionCliente(respuesta.token, respuesta.nombre ?? respuesta.nombreUsuario ?? "")) {
        setError("Tu navegador no permite guardar la sesión. Revisa que no esté en modo privado o con el almacenamiento bloqueado.")
        return
      }
      navigate(destinoTrasAcceso(location.search), { replace: true })
    } catch (cause) {
      setError(mensajeErrorAcceso(cause, "Correo o contraseña incorrectos."))
    } finally {
      enviando.current = false
      setCargando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div data-testid="tarjeta-ingreso" className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <EtiquetaPortal />
        <h1 className="mt-2 text-3xl font-bold">Ingresa a tu cuenta</h1>
        <p className="mt-2 text-muted-foreground">Consulta tus pedidos y envía nuevas solicitudes.</p>
        <ul aria-label="Lo que puedes gestionar en el portal" className="mt-5 space-y-2.5 text-sm">
          {RESUMEN_PORTAL.map(({ Icono, titulo, texto }) => (
            <li key={titulo} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icono className="h-4 w-4" aria-hidden="true" />
              </span>
              <span><span className="font-semibold">{titulo}</span> <span className="text-muted-foreground">{texto}</span></span>
            </li>
          ))}
        </ul>
        <AvisoCarritoPublico className="mt-5" />
        <form onSubmit={enviar} className="mt-6 space-y-5">
          <IngresoConGoogle />
          <SeparadorO texto="o con tu correo" />
          <div>
            <Label htmlFor="ingreso-correo">Correo</Label>
            <Input id="ingreso-correo" name="correo" type="email" autoComplete="email" className="mt-2" required />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="ingreso-password">Contraseña</Label>
              <Link
                to="/recuperar-password?origen=portal"
                className="rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <CampoPassword id="ingreso-password" name="password" autoComplete="current-password" required />
          </div>
          {error && <ErrorBanner message={error} />}
          {error && esPersonal && <EnlaceIngresoPersonal />}
          <Button className="w-full" disabled={cargando}>{cargando ? "Ingresando..." : "Ingresar"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Aún no tienes cuenta?{" "}
            <Link to={rutaRegistro(volverCrudo)} className="font-medium text-accent hover:underline">Regístrate</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
