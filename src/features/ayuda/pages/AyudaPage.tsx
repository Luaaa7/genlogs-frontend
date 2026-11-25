import { Building2, ChevronDown, ClipboardList, FileText, PackageSearch, Search, ShieldCheck, Truck, UserPlus } from "lucide-react"
import { useState, type KeyboardEvent } from "react"
import { Link } from "react-router-dom"
import { useEsPersonalConSesion } from "../lib/sesionAyuda"

const PARA_CLIENTES = [
  { Icono: ClipboardList, titulo: "Pedir una cotización", texto: "Usa la Solicitud rápida de la página principal. Escribe la marca y el N.º de parte si los tienes." },
  { Icono: UserPlus, titulo: "Crear tu acceso", texto: "Regístrate con el RUC de tu empresa (empieza con 10 o 20). Si tu empresa ya es cliente, el Jefe Administrativo activa tu acceso." },
  { Icono: FileText, titulo: "Aprobar o rechazar una cotización", texto: "En el portal, entra a Mis cotizaciones. Puedes decidir hasta la fecha de validez." },
  { Icono: Truck, titulo: "Seguir tus pedidos y despachos", texto: "En el portal revisa Mis pedidos y Mis despachos para ver en qué etapa está cada uno." },
]

const PARA_EL_PERSONAL = [
  { Icono: FileText, titulo: "Cotizaciones", texto: "Se preparan, pasan por la aprobación del Jefe Administrativo y recién después se envían al cliente." },
  { Icono: Building2, titulo: "Órdenes de compra", texto: "Sube el PDF de la orden de la minera, revisa lo que leyó el sistema y confírmala." },
  { Icono: ShieldCheck, titulo: "Despachos", texto: "Avanzan por etapas. Para pasar a tránsito y a entregado, el pase y el SCTR deben estar vigentes." },
  { Icono: Search, titulo: "Búsqueda de repuestos", texto: "Busca por N.º de parte o palabras en las tiendas que configura el Jefe Administrativo." },
]

const PREGUNTAS = [
  { pregunta: "¿Cuánto tiempo vale una cotización?", respuesta: "15 días desde que se crea, incluido el último día. Después vence y hay que pedir una nueva." },
  { pregunta: "¿Puedo pedir un repuesto que no está en el catálogo?", respuesta: "Sí. Escríbelo en la Solicitud rápida con la marca y el N.º de parte, y te respondemos con la cotización." },
  { pregunta: "Me registré, pero no puedo ingresar al portal. ¿Por qué?", respuesta: "Si tu empresa ya era cliente de GENLOGS, tu acceso queda pendiente hasta que el Jefe Administrativo lo active." },
  { pregunta: "¿El personal de GENLOGS ingresa por el mismo lugar que los clientes?", respuesta: "No. Los clientes ingresan al portal y el personal ingresa por el acceso interno." },
  { pregunta: "¿Cómo me comunico con GENLOGS?", respuesta: "En la página de Contacto están el correo de ventas y los demás datos de contacto." },
]

function Tarjetas({ items }: { items: typeof PARA_CLIENTES }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {items.map(({ Icono, titulo, texto }) => (
        <article key={titulo} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icono className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-semibold">{titulo}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{texto}</p>
        </article>
      ))}
    </div>
  )
}

type Guia = "clientes" | "personal"

const PESTANAS: { id: Guia; texto: string }[] = [
  { id: "clientes", texto: "Para clientes" },
  { id: "personal", texto: "Para el personal de GENLOGS" },
]

function GuiaClientes() {
  return (
    <section aria-labelledby="ayuda-clientes">
      <h2 id="ayuda-clientes" className="flex items-center gap-2 text-xl font-semibold">
        <PackageSearch className="h-5 w-5 text-accent" aria-hidden="true" /> Para clientes
      </h2>
      <Tarjetas items={PARA_CLIENTES} />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link to="/portal/ingreso" className="font-semibold text-accent hover:underline">Ingresar al portal</Link>
      </p>
    </section>
  )
}

function GuiaPersonal() {
  return (
    <section aria-labelledby="ayuda-personal">
      <h2 id="ayuda-personal" className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" /> Para el personal de GENLOGS
      </h2>
      <Tarjetas items={PARA_EL_PERSONAL} />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-accent hover:underline">Acceso del personal</Link>
      </p>
    </section>
  )
}

/** Las dos guías en pestañas. Solo se usan con la sesión del personal abierta. */
function GuiasEnPestanas() {
  const [activa, setActiva] = useState<Guia>("personal")

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const paso = e.key === "ArrowRight" ? 1 : PESTANAS.length - 1
    const siguiente = PESTANAS[(indice + paso) % PESTANAS.length].id
    setActiva(siguiente)
    document.getElementById(`pestana-${siguiente}`)?.focus()
  }

  return (
    <div className="mt-10">
      <div role="tablist" aria-label="Guías de ayuda" className="flex gap-2 border-b border-border">
        {PESTANAS.map(({ id, texto }, indice) => (
          <button
            key={id}
            id={`pestana-${id}`}
            type="button"
            role="tab"
            aria-selected={activa === id}
            aria-controls={`guia-${id}`}
            tabIndex={activa === id ? 0 : -1}
            onClick={() => setActiva(id)}
            onKeyDown={(e) => alTeclear(e, indice)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activa === id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`guia-${activa}`} aria-labelledby={`pestana-${activa}`} className="mt-8">
        {activa === "clientes" ? <GuiaClientes /> : <GuiaPersonal />}
      </div>
    </div>
  )
}

/**
 * Ayuda (v3.4, K2): guía corta y preguntas frecuentes. El visitante y el cliente ven solo la guía
 * de clientes; la guía del personal aparece únicamente con la sesión interna abierta (en pestañas).
 */
export function AyudaPage() {
  const esPersonal = useEsPersonalConSesion()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Ayuda</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">¿En qué te ayudamos?</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
        {esPersonal
          ? "Una guía rápida del portal para clientes y del sistema para el personal de GENLOGS."
          : "Una guía rápida para usar el portal de clientes de GENLOGS."}
      </p>

      {esPersonal ? (
        <GuiasEnPestanas />
      ) : (
        <div className="mt-12">
          <GuiaClientes />
        </div>
      )}

      <section aria-labelledby="ayuda-preguntas" className="mt-12">
        <h2 id="ayuda-preguntas" className="text-xl font-semibold">Preguntas frecuentes</h2>
        <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
          {PREGUNTAS.map(({ pregunta, respuesta }) => (
            <details key={pregunta} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {pregunta}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        ¿No encontraste lo que buscabas?{" "}
        <Link to="/contacto" className="font-semibold text-accent hover:underline">Contacto</Link>
      </p>
    </div>
  )
}
