import { ArrowRight, Building2, ChevronDown, ClipboardList, FileText, HelpCircle, Mail, PackageSearch, Search, ShieldCheck, Truck, UserPlus } from "lucide-react"
import { EncabezadoPortal } from "@/features/portal-cliente/components/EncabezadoPortal"
import { ENTRADA_TARJETA, ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL, retardoEntrada } from "@/features/portal-cliente/lib/estilosTarjeta"
import { useState, type KeyboardEvent } from "react"
import { Link } from "react-router-dom"
import { puedeEntrarAlPortal } from "@/lib/sesiones"
import { useEsPersonalConSesion } from "../lib/sesionAyuda"

interface GuiaAyuda {
  Icono: typeof ClipboardList
  titulo: string
  texto: string
  /** Acceso directo a la página que explica la guía (solo rutas que ya existen). */
  enlace?: { texto: string; a: string; soloVisitante?: boolean }
}

const PARA_CLIENTES: GuiaAyuda[] = [
  { Icono: ClipboardList, titulo: "Pedir una cotización", texto: "Usa la Solicitud rápida de la página principal. Escribe la marca y el N.º de parte si los tienes.", enlace: { texto: "Ir a la Solicitud rápida", a: "/#solicitud" } },
  { Icono: UserPlus, titulo: "Crear tu acceso", texto: "Regístrate con el RUC de tu empresa (empieza con 10 o 20). Si tu empresa ya es cliente, el Jefe Administrativo activa tu acceso.", enlace: { texto: "Crear mi acceso", a: "/portal/registro", soloVisitante: true } },
  { Icono: FileText, titulo: "Aprobar o rechazar una cotización", texto: "En el portal, entra a Mis cotizaciones. Puedes decidir hasta la fecha de validez.", enlace: { texto: "Ir a Mis cotizaciones", a: "/portal/cotizaciones" } },
  { Icono: Truck, titulo: "Seguir tus pedidos y despachos", texto: "En el portal revisa Mis pedidos y Mis despachos para ver en qué etapa está cada uno.", enlace: { texto: "Ir a Mis pedidos", a: "/portal/pedidos" } },
]

const PARA_EL_PERSONAL: GuiaAyuda[] = [
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

/** Guías en tarjetas con icono, título, texto y, si existe, el acceso a la página de la guía. */
function Tarjetas({ items, conSesionCliente = false }: { items: GuiaAyuda[]; conSesionCliente?: boolean }) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {items.map(({ Icono, titulo, texto, enlace }, indice) => {
        const mostrarEnlace = enlace && !(enlace.soloVisitante && conSesionCliente)
        return (
          <article key={titulo} style={retardoEntrada(indice)} className={`group flex flex-col p-5 sm:p-6 ${TARJETA_PORTAL} ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}>
            <div className="flex items-start gap-4">
              <span aria-hidden="true" className={ICONO_TARJETA}><Icono className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#183153] dark:text-slate-50">{titulo}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{texto}</p>
              </div>
            </div>
            {mostrarEnlace && enlace && (
              <div className="mt-auto pt-4">
                {enlace.a.startsWith("/#") ? (
                  <a href={enlace.a} className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-[#2E6BA8] hover:text-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#93C5FD] dark:hover:text-white">
                    {enlace.texto}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </a>
                ) : (
                  <Link to={enlace.a} className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-[#2E6BA8] hover:text-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#93C5FD] dark:hover:text-white">
                    {enlace.texto}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

const TITULO_SECCION = "flex items-center gap-2 text-xl font-semibold text-[#183153] dark:text-slate-50"
const ENLACE = "font-semibold text-[#2E6BA8] hover:underline dark:text-[#93C5FD]"

type Guia = "clientes" | "personal"

const PESTANAS: { id: Guia; texto: string }[] = [
  { id: "clientes", texto: "Para clientes" },
  { id: "personal", texto: "Para el personal de GENLOGS" },
]

/** Con sesión de cliente ya no se ofrece «Ingresar al portal»: ya está dentro. */
function GuiaClientes({ conSesionCliente = false }: { conSesionCliente?: boolean }) {
  return (
    <section aria-labelledby="ayuda-clientes">
      <h2 id="ayuda-clientes" className={TITULO_SECCION}>
        <PackageSearch className="h-5 w-5 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" /> Para clientes
      </h2>
      <Tarjetas items={PARA_CLIENTES} conSesionCliente={conSesionCliente} />
      {!conSesionCliente && (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to="/portal/ingreso" className={ENLACE}>Ingresar al portal</Link>
        </p>
      )}
    </section>
  )
}

function GuiaPersonal() {
  return (
    <section aria-labelledby="ayuda-personal">
      <h2 id="ayuda-personal" className={TITULO_SECCION}>
        <ShieldCheck className="h-5 w-5 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" /> Para el personal de GENLOGS
      </h2>
      <Tarjetas items={PARA_EL_PERSONAL} />
      <p className="mt-4 text-sm text-muted-foreground">
        <Link to="/login" className={ENLACE}>Acceso del personal</Link>
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
    <div>
      <div role="tablist" aria-label="Guías de ayuda" className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#0F213D]">
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
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activa === id ? "bg-[#2E6BA8] text-white shadow-sm dark:bg-[#2563EB]" : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/5"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`guia-${activa}`} aria-labelledby={`pestana-${activa}`} className="mt-6">
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
  const conSesionCliente = !esPersonal && puedeEntrarAlPortal()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <EncabezadoPortal
        etiqueta="Ayuda"
        titulo="¿En qué te ayudamos?"
        descripcion={esPersonal
          ? "Una guía rápida del portal para clientes y del sistema para el personal de GENLOGS."
          : "Una guía rápida para usar el portal de clientes de GENLOGS."}
        ilustracion="ayuda"
      />

      {esPersonal ? <GuiasEnPestanas /> : <GuiaClientes conSesionCliente={conSesionCliente} />}

      <section aria-labelledby="ayuda-preguntas">
        <h2 id="ayuda-preguntas" className={TITULO_SECCION}>
          <HelpCircle className="h-5 w-5 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />Preguntas frecuentes
        </h2>
        <div className="mt-5 grid gap-3">
          {PREGUNTAS.map(({ pregunta, respuesta }) => (
            <details key={pregunta} className="group rounded-xl border border-slate-200 bg-white shadow-sm transition-colors open:border-[#2E6BA8]/40 dark:border-white/10 dark:bg-[#0F213D] dark:open:border-[#60A5FA]/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-semibold text-[#183153] hover:bg-[#EEF3F8]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-100 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                {pregunta}
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2E6BA8]/10 text-[#2E6BA8] transition-transform group-open:rotate-180 dark:bg-[#60A5FA]/10 dark:text-[#93C5FD]">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="px-5 pb-4 text-sm leading-6 text-muted-foreground">{respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-[#EEF3F8] to-white p-5 shadow-sm dark:border-white/10 dark:from-[#10213B] dark:to-[#0F213D] sm:flex-row sm:items-center sm:p-6">
        <span aria-hidden="true" className={ICONO_TARJETA}><Mail className="h-5 w-5" /></span>
        <p className="text-sm text-muted-foreground">
          <span className="block text-base font-semibold text-[#183153] dark:text-slate-50">¿No encontraste lo que buscabas?</span>
          Escríbenos desde la página de contacto.
        </p>
        <Link to="/contacto" className="inline-flex items-center gap-1.5 rounded-lg bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#183153] shadow-sm hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto">
          Contacto
        </Link>
      </div>
    </div>
  )
}
