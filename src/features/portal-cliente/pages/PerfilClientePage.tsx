import { Link } from "react-router-dom"
import { KeyRound, UserRound } from "lucide-react"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { RUTA_EMPRESA_PORTAL } from "@/api/contratos/ingresoGoogle"
import { PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { leerSesionCliente } from "@/lib/sesiones"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { useCuentaPortal } from "../hooks/useCuentaPortal"

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const ENLACE = `inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#183153] hover:bg-slate-50 dark:border-border dark:bg-transparent dark:text-foreground dark:hover:bg-muted ${FOCO}`

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="break-words font-medium text-foreground">{valor}</dd>
    </div>
  )
}

/**
 * Perfil del cliente (/portal/perfil). Muestra solo lo que la cuenta realmente trae
 * (nombre, correo y razón social); RUC, teléfono y dirección no existen aún en el backend.
 * No cambia datos: para la contraseña enlaza a la recuperación que ya existe.
 */
export function PerfilClientePage() {
  const cuenta = useCuentaPortal()
  const nombreSesion = leerSesionCliente()?.nombre ?? ""
  const datos = cuenta.data

  return (
    <div>
      <EncabezadoPortal titulo="Mi perfil" descripcion="Los datos de tu cuenta en el portal." />

      <section aria-labelledby="perfil-cuenta" className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
        <h2 id="perfil-cuenta" className="flex items-center gap-2 text-lg font-semibold text-[#183153] dark:text-foreground">
          <UserRound className="h-5 w-5" aria-hidden="true" />
          Datos de la cuenta
        </h2>

        {cuenta.isPending && <CargandoSpinner texto="Cargando perfil..." />}
        {cuenta.isError && (
          <div className="mt-4">
            <ErrorBanner message="No pudimos cargar los datos de tu cuenta." onRetry={() => cuenta.refetch()} />
          </div>
        )}

        <dl role="group" aria-label="Datos de la cuenta" className="mt-2 divide-y divide-slate-100 dark:divide-border">
          <Dato etiqueta="Nombre" valor={datos?.nombre ?? nombreSesion} />
          {datos && <Dato etiqueta="Correo" valor={datos.correo} />}
          {datos?.empresa && <Dato etiqueta="Razón social" valor={datos.empresa} />}
        </dl>

        {datos && !datos.empresa && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-border dark:bg-muted/40">
            <p className="text-muted-foreground">Tu cuenta aún no tiene empresa. La necesitas para pedir cotizaciones.</p>
            <Link to={`${RUTA_EMPRESA_PORTAL}?${PARAMETRO_VOLVER}=${encodeURIComponent("/portal/perfil")}`} className={ENLACE}>
              Completar datos de la empresa
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="perfil-clave" className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
        <h2 id="perfil-clave" className="flex items-center gap-2 text-lg font-semibold text-[#183153] dark:text-foreground">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          Contraseña
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Si quieres cambiarla o no la recuerdas, te enviamos un enlace a tu correo.</p>
        <Link to="/recuperar-password" className={`mt-4 ${ENLACE}`}>Cambiar o recuperar contraseña</Link>
      </section>
    </div>
  )
}
