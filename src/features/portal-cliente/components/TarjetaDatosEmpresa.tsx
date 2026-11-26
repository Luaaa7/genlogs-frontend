import { useState } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Building2, Check, Save } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { AvisoServidorLento } from "@/components/ui/AvisoServidorLento"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cerrarSesionCliente, marcarPerfilCompleto } from "@/lib/sesiones"
import { useFormularioEmpresa } from "@/features/acceso-cliente/hooks/useFormularioEmpresa"
import { SelectorTipoDocumento } from "@/features/acceso-cliente/components/SelectorTipoDocumento"
import { CLAVE_CUENTA_PORTAL } from "../hooks/useCuentaPortal"
import { BotonCargando } from "./BotonCargando"

interface Props {
  nombreSesion: string
}

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/**
 * Aviso ámbar del perfil para una cuenta sin empresa (registro progresivo): pide RUC y razón social
 * con el mismo formulario y el mismo endpoint (POST /portal/empresa) de la página de datos de la empresa.
 */
export function TarjetaDatosEmpresa({ nombreSesion }: Props) {
  const queryClient = useQueryClient()
  const [pendiente, setPendiente] = useState("")
  const {
    error, cargando, tardaMucho, tipo, documento, contacto, razonSocial, avisoRuc, estadoRuc,
    cambiarTipo, cambiarRuc, cambiarContacto, cambiarRazonSocial, enviar,
  } =
    useFormularioEmpresa({
      nombreInicial: nombreSesion,
      alGuardar: (nombreContacto) => {
        marcarPerfilCompleto(nombreContacto)
        void queryClient.invalidateQueries({ queryKey: CLAVE_CUENTA_PORTAL })
      },
      alPendiente: (mensaje) => {
        cerrarSesionCliente()
        setPendiente(mensaje)
      },
    })

  if (pendiente) {
    return (
      <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-border dark:bg-muted/40">
        <p role="status">{pendiente}</p>
        <Link to="/" className={`font-medium text-accent hover:underline ${FOCO}`}>Volver a la página principal</Link>
      </div>
    )
  }

  const esDni = tipo === "DNI"
  const bordeRuc = !esDni && estadoRuc === "encontrado" ? "border-2 border-success" : ""

  return (
    <section
      aria-labelledby="perfil-empresa-titulo"
      className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10"
    >
      <h3 id="perfil-empresa-titulo" className="flex items-center gap-2 text-base font-semibold text-amber-950 dark:text-amber-100">
        <Building2 className="h-5 w-5" aria-hidden="true" />
        Completa los datos de tu empresa
      </h3>
      <p className="mt-1 text-sm text-amber-900 dark:text-amber-200/90">
        {esDni
          ? "Con tu DNI y tu nombre podrás emitir y aprobar tus cotizaciones. Te los pedimos una sola vez."
          : "Con tu RUC y Razón Social podrás emitir y aprobar tus cotizaciones. Te los pedimos una sola vez."}
      </p>

      <form onSubmit={enviar} className="mt-4 space-y-4">
        <SelectorTipoDocumento valor={tipo} alCambiar={cambiarTipo} prefijo="perfil" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="perfil-ruc">{esDni ? "DNI" : "RUC"}</Label>
            <Input
              id="perfil-ruc"
              name="ruc"
              inputMode="numeric"
              autoComplete="off"
              maxLength={esDni ? 8 : 11}
              value={documento}
              className={`mt-2 h-11 bg-white font-semibold tracking-wider tabular-nums dark:bg-background ${bordeRuc}`}
              onChange={(e) => cambiarRuc(e.target.value)}
              aria-describedby={avisoRuc && !esDni ? "perfil-ruc-aviso" : undefined}
              required
            />
          </div>
          {!esDni && (
          <div>
            <Label htmlFor="perfil-razon">Razón social</Label>
            <Input
              id="perfil-razon"
              name="razonSocial"
              autoComplete="organization"
              maxLength={200}
              className={`mt-2 h-11 bg-white dark:bg-background ${estadoRuc === "buscando" && !razonSocial ? "animate-pulse motion-reduce:animate-none" : ""}`}
              value={razonSocial}
              onChange={(e) => cambiarRazonSocial(e.target.value)}
              required
            />
          </div>
          )}
        </div>
        {avisoRuc && !esDni && (
          <p id="perfil-ruc-aviso" role="status" className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200/90">
            {estadoRuc === "encontrado" && <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} aria-hidden="true" />}
            {avisoRuc}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="perfil-contacto">{esDni ? "Nombres y apellidos" : "Persona de contacto"}</Label>
            <Input id="perfil-contacto" name="nombreContacto" autoComplete="name" maxLength={150} value={contacto} onChange={(e) => cambiarContacto(e.target.value)} className="mt-2 h-11 bg-white dark:bg-background" required />
          </div>
          <div>
            <Label htmlFor="perfil-telefono">Teléfono (opcional)</Label>
            <Input id="perfil-telefono" name="telefono" type="tel" autoComplete="tel" maxLength={30} className="mt-2 h-11 bg-white dark:bg-background" />
          </div>
        </div>

        {esDni && (
          <p className="text-sm text-amber-900 dark:text-amber-200/90">
            Para compras con DNI emitimos boleta de venta y no se requiere orden de compra.
          </p>
        )}
        {error && <ErrorBanner message={error} />}
        {tardaMucho && <AvisoServidorLento />}
        <div className="flex justify-end">
          <BotonCargando type="submit" cargando={cargando} textoCargando="Guardando datos..." icono={<Save className="mr-2 h-4 w-4" aria-hidden="true" />}>
            Guardar datos
          </BotonCargando>
        </div>
      </form>
    </section>
  )
}
