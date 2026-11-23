import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { datosConValor } from "../lib/datosGenlogs"

/**
 * Contáctame (v3.4, K2). Sin formulario ni correo, por decisión de Luana (21/11):
 * solo los datos de GENLOGS y el enlace a la Solicitud rápida de la landing.
 */
export function ContactoPage() {
  const datos = datosConValor()

  return (
    <section aria-labelledby="contacto-titulo" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Contáctame</p>
      <h1 id="contacto-titulo" className="mt-2 text-3xl font-bold tracking-tight">Conversemos sobre tu próxima necesidad.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
        Escríbenos para consultas comerciales. Si ya sabes qué repuesto necesitas, pide tu cotización directamente.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <ul className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {datos.map(({ id, etiqueta, valor, href, Icono }) => (
            <li key={id} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icono className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{etiqueta}</p>
                {href ? (
                  <a href={href} className="font-semibold text-foreground hover:text-accent hover:underline">{valor}</a>
                ) : (
                  <p className="font-semibold text-foreground">{valor}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">¿Necesitas un repuesto?</h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
              Cuéntanos la marca y el N.º de parte en la Solicitud rápida y te respondemos con la cotización.
            </p>
          </div>
          <a
            href="/#solicitud"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary-foreground px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pedir cotización <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        ¿Tienes dudas sobre el portal o el sistema?{" "}
        <Link to="/ayuda" className="font-semibold text-accent hover:underline">Revisa la Ayuda</Link>
      </p>
    </section>
  )
}
