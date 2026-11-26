import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowRight, Building2, Check, Loader2, Lock, Search, ShieldCheck } from "lucide-react"
import { leerVolver } from "@/api/contratos/registro"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AvisoServidorLento } from "@/components/ui/AvisoServidorLento"
import { cerrarSesionCliente, leerSesionCliente, marcarPerfilCompleto } from "@/lib/sesiones"
import { useFormularioEmpresa, type EstadoRuc } from "../hooks/useFormularioEmpresa"
import { LineasTopograficas } from "../components/LineasTopograficas"

const PASOS = [
  { titulo: "Tu cuenta", estado: "hecho" },
  { titulo: "Tu empresa", estado: "actual" },
  { titulo: "Tu solicitud", estado: "pendiente" },
] as const

/**
 * Datos de la empresa (v3.4). La cuenta que entró con Google los da antes de su
 * primera cotización: sin RUC no se puede cotizar ni facturar.
 * Si la empresa ya es cliente, el acceso queda pendiente hasta que lo active el
 * Jefe Administrativo, y se cierra la sesión.
 */
export function CompletarEmpresaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pendiente, setPendiente] = useState("")
  const nombreSesion = leerSesionCliente()?.nombre ?? ""
  const {
    error, cargando, tardaMucho, razonSocial, avisoRuc, rucConsultado, estadoRuc, cambiarRuc, cambiarRazonSocial, enviar,
  } = useFormularioEmpresa({
    alGuardar: (nombreContacto) => {
      marcarPerfilCompleto(nombreContacto)
      navigate(leerVolver(location.search, "/portal/solicitud"), { replace: true })
    },
    alPendiente: (mensaje) => {
      cerrarSesionCliente()
      setPendiente(mensaje)
    },
  })

  if (pendiente) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-bold">Datos de tu empresa</h1>
        <p role="status" className="rounded-md bg-info/10 px-4 py-3 text-sm text-info">{pendiente}</p>
        <Link to="/" className="font-medium text-accent hover:underline">Volver a la página principal</Link>
      </div>
    )
  }

  const bordeRuc = estadoRuc === "encontrado" ? "border-2 border-success" : ""

  return (
    <div className="space-y-0">
      <section className="relative overflow-hidden rounded-2xl bg-brand-navy px-6 pb-28 pt-10 text-white sm:px-10">
        <LineasTopograficas />
        <div className="relative space-y-7">
          <ol aria-label="Pasos para tu primera cotización" className="portal-sube flex flex-wrap items-center gap-3">
            {PASOS.map(({ titulo, estado }, i) => (
              <li key={titulo} aria-current={estado === "actual" ? "step" : undefined} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden="true" className="h-[3px] w-10 overflow-hidden rounded-full bg-white/20 sm:w-16">
                    {i === 1 && <span className="portal-dibuja-x block h-full bg-green-500" />}
                  </span>
                )}
                {estado === "hecho" && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white" aria-hidden="true"><Check className="h-4 w-4" strokeWidth={3} /></span>
                )}
                {estado === "actual" && (
                  <span className="portal-anillo flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-brand-navy" aria-hidden="true">{i + 1}</span>
                )}
                {estado === "pendiente" && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/40 font-semibold text-white/85" aria-hidden="true">{i + 1}</span>
                )}
                <span className="flex flex-col leading-tight">
                  <span className="text-xs text-white/70">Paso {i + 1}{estado === "hecho" && <span className="sr-only">:</span>}</span>
                  <span className="font-semibold">{titulo}{estado === "hecho" && <span className="sr-only"> (Listo)</span>}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="portal-sube portal-retraso-1 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Datos de tu empresa</h1>
            <p className="max-w-xl text-base leading-relaxed text-white/85">
              Te los pedimos una sola vez, antes de tu primera cotización: con ellos preparamos tus
              cotizaciones y tus comprobantes.
            </p>
          </div>
        </div>
      </section>

      <div className="relative -mt-20 grid items-start gap-6 px-0 sm:px-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={enviar} className="portal-sube portal-retraso-2 space-y-6 rounded-2xl bg-card p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground" aria-hidden="true"><Building2 className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-semibold">Identificación</h2>
              <p className="text-sm text-muted-foreground">Escribe tu RUC y completamos la razón social por ti</p>
            </div>
          </div>

          <div>
            <Label htmlFor="empresa-ruc">RUC</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3.5 top-6 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="empresa-ruc"
                name="ruc"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                className={`h-12 pl-10 pr-3 text-lg sm:pr-44 font-semibold tracking-wider tabular-nums transition-colors ${bordeRuc}`}
                onChange={(e) => cambiarRuc(e.target.value)}
                aria-describedby={avisoRuc ? "empresa-ruc-aviso" : undefined}
                required
              />
              <span className="mt-2 flex sm:absolute sm:right-2.5 sm:top-6 sm:mt-0 sm:-translate-y-1/2">
                {estadoRuc === "buscando" && (
                  <span className="flex h-7 items-center gap-1.5 rounded-full bg-accent/10 px-2.5 text-xs font-semibold text-accent">
                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />Buscando…
                  </span>
                )}
                {estadoRuc === "encontrado" && (
                  <span className="portal-aparece flex h-7 items-center gap-1 rounded-full bg-success px-2.5 text-xs font-semibold text-success-foreground">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />Encontrado en SUNAT
                  </span>
                )}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="empresa-razon">Razón social</Label>
            <Input
              id="empresa-razon"
              name="razonSocial"
              autoComplete="organization"
              maxLength={200}
              className={`mt-2 h-11 ${estadoRuc === "buscando" && !razonSocial ? "animate-pulse bg-muted motion-reduce:animate-none" : ""}`}
              value={razonSocial}
              onChange={(e) => cambiarRazonSocial(e.target.value)}
              required
            />
            {avisoRuc && <p id="empresa-ruc-aviso" role="status" className="mt-1.5 text-xs text-muted-foreground">{avisoRuc}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="empresa-contacto">Persona de contacto</Label>
              <Input
                id="empresa-contacto"
                name="nombreContacto"
                autoComplete="name"
                maxLength={150}
                defaultValue={nombreSesion}
                className="mt-2 h-11"
                required
              />
            </div>
            <div>
              <Label htmlFor="empresa-telefono">Teléfono (opcional)</Label>
              <Input id="empresa-telefono" name="telefono" type="tel" autoComplete="tel" maxLength={30} className="mt-2 h-11" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-accent/10 px-4 py-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground" aria-hidden="true"><ShieldCheck className="h-4 w-4" /></span>
            <p className="text-sm leading-relaxed">Validamos el RUC en SUNAT. Si tu empresa ya tiene cuenta en el portal, GENLOGS revisará tu acceso y te avisará por correo.</p>
          </div>

          {error && <ErrorBanner message={error} />}
          {tardaMucho && <AvisoServidorLento />}
          <div className="flex justify-end border-t border-border pt-5">
            <Button
              className="group h-12 w-full gap-2 px-6 text-[15px] font-semibold shadow-lg transition-[background-color,box-shadow,transform] active:scale-[0.97] motion-reduce:transition-none sm:w-auto"
              disabled={cargando}
            >
              {cargando ? "Guardando..." : "Guardar y continuar"}
              {!cargando && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />}
            </Button>
          </div>
        </form>

        <ResumenEmpresa ruc={rucConsultado} razonSocial={razonSocial} estado={estadoRuc} />
      </div>
    </div>
  )
}

function iniciales(texto: string): string {
  const palabras = texto.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  return palabras.slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

/** Lo que la persona ve de su empresa mientras llena el formulario. */
function ResumenEmpresa({ ruc, razonSocial, estado }: { ruc: string; razonSocial: string; estado: EstadoRuc }) {
  const nombre = razonSocial.trim()
  const conDatos = ruc !== "" && estado !== "buscando"

  return (
    <aside aria-label="Resumen de tu empresa" className="portal-sube portal-retraso-3 overflow-hidden rounded-2xl bg-card shadow-xl">
      {conDatos ? (
        <div className="portal-sube">
          <div className="space-y-3.5 bg-brand-blue p-5 text-white">
            <p className="text-xs font-semibold tracking-[0.06em] text-white/80">TU EMPRESA</p>
            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold text-brand-navy" aria-hidden="true">{iniciales(nombre) || "—"}</span>
              <div className="min-w-0">
                <p className="break-words font-bold leading-snug">{nombre || "Escribe la razón social"}</p>
                <p className="text-sm tabular-nums text-white/80">RUC {ruc}</p>
              </div>
            </div>
          </div>
          <p className="flex items-center gap-2 px-5 py-4 text-sm">
            {estado === "encontrado"
              ? <><Check className="h-4 w-4 text-success" strokeWidth={3} aria-hidden="true" />Datos de SUNAT</>
              : <>Revisa que la razón social sea la de tu RUC.</>}
          </p>
        </div>
      ) : (
        <div className="m-5 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border px-5 py-7 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden="true">
            {estado === "buscando" ? <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" /> : <Building2 className="h-6 w-6" />}
          </span>
          <p className="font-semibold">{estado === "buscando" ? "Buscando tu empresa…" : "Escribe tu RUC"}</p>
          <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">Aquí verás el nombre de tu empresa y su RUC.</p>
        </div>
      )}
      <p className="mx-5 mb-5 flex items-center gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        Solo usamos estos datos para tus cotizaciones y comprobantes.
      </p>
    </aside>
  )
}
