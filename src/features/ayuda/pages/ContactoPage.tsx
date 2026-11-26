import { ArrowRight, BookOpen, ClipboardList, Cog, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { EncabezadoPortal } from "@/features/portal-cliente/components/EncabezadoPortal"
import { ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL } from "@/features/portal-cliente/lib/estilosTarjeta"
import { datosConValor } from "../lib/datosGenlogs"

/**
 * Contacto (v3.4, K2). Sin formulario ni correo, por decisión de Luana (21/11):
 * solo los datos de GENLOGS y el enlace a la Solicitud rápida de la landing.
 * Solo se muestran los datos confirmados (por ahora, el correo de ventas).
 */
export function ContactoPage() {
  const datos = datosConValor()
  const [principal, ...otros] = datos

  return (
    <section aria-label="Contacto" className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <EncabezadoPortal
        etiqueta="Contacto"
        titulo="Conversemos sobre tu próxima necesidad."
        descripcion="Escríbenos para consultas comerciales. Si ya sabes qué repuesto necesitas, pide tu cotización directamente."
        ilustracion="contacto"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
        <div className={`flex flex-col gap-5 p-5 sm:p-7 ${TARJETA_PORTAL}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2E6BA8] dark:text-[#93C5FD]">
            <Mail className="h-4 w-4" aria-hidden="true" />Escríbenos
          </div>
          {principal && (
            <div className="flex items-center gap-4 rounded-xl bg-[#EEF3F8] p-4 dark:bg-white/[0.04] sm:p-5">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2E6BA8] text-white shadow-md shadow-[#2E6BA8]/30 dark:bg-[#2563EB]">
                <principal.Icono className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{principal.etiqueta}</p>
                {principal.href ? (
                  <a href={principal.href} className="break-words text-base font-bold [overflow-wrap:anywhere] text-[#183153] hover:text-[#2E6BA8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white dark:hover:text-[#93C5FD] min-[400px]:text-lg sm:text-xl">
                    {principal.valor}
                  </a>
                ) : (
                  <p className="text-lg font-bold text-[#183153] dark:text-white sm:text-xl">{principal.valor}</p>
                )}
              </div>
            </div>
          )}
          {otros.length > 0 && (
            <ul className="space-y-3">
              {otros.map(({ id, etiqueta, valor, href, Icono }) => (
                <li key={id} className="flex items-start gap-3">
                  <span aria-hidden="true" className={ICONO_TARJETA}><Icono className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm text-muted-foreground">{etiqueta}</p>
                    {href ? (
                      <a href={href} className="font-semibold text-[#183153] hover:text-[#2E6BA8] hover:underline dark:text-slate-100">{valor}</a>
                    ) : (
                      <p className="font-semibold text-[#183153] dark:text-slate-100">{valor}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`group flex flex-col items-start gap-4 p-5 max-lg:order-last sm:flex-row sm:items-center sm:p-6 ${TARJETA_PORTAL} ${TARJETA_ELEVABLE}`}>
          <span aria-hidden="true" className={ICONO_TARJETA}><BookOpen className="h-5 w-5" /></span>
          <p className="text-sm text-muted-foreground">
            <span className="block text-base font-semibold text-[#183153] dark:text-slate-50">¿Tienes dudas sobre el portal o el sistema?</span>
            Encuentra guías rápidas y preguntas frecuentes.
          </p>
          <Link to="/ayuda" className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-[#2E6BA8] hover:text-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#93C5FD] dark:hover:text-white sm:ml-auto">
            Revisa la Ayuda
          </Link>
        </div>
        </div>

        <div className="relative isolate flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-gradient-to-br from-[#183153] via-[#1E3A5F] to-[#2E6BA8] p-5 text-white shadow-lg shadow-[#1E3A5F]/20 sm:rounded-2xl sm:p-7 dark:from-[#0B1830] dark:via-[#10213B] dark:to-[#1E3A5F] dark:ring-1 dark:ring-white/10">
          <Cog aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 -z-10 h-44 w-44 text-white/10" strokeWidth={1.2} />
          <Cog aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-24 -z-10 h-28 w-28 text-[#FACC15]/15" strokeWidth={1.4} />
          <div>
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FACC15] text-[#183153]">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-bold sm:text-2xl">¿Necesitas un repuesto?</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              Cuéntanos la marca y el N.º de parte en la Solicitud rápida y te respondemos con la cotización.
            </p>
          </div>
          <a
            href="/#solicitud"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FACC15] px-6 py-3 text-base font-extrabold text-[#183153] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-fit"
          >
            Pedir cotización <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
          </a>
        </div>
      </div>

    </section>
  )
}
