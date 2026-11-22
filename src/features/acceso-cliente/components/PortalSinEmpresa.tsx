import { Link } from "react-router-dom"
import { ArrowRight, Check, Clock, FilePlus2, Truck } from "lucide-react"
import { LineasTopograficas } from "./LineasTopograficas"

const PASOS = [
  { icono: FilePlus2, titulo: "Pide tu cotización", texto: "Cuéntanos qué repuestos o servicios necesitas y para qué unidad minera." },
  { icono: Clock, titulo: "La preparamos", texto: "Te enviamos la cotización en 1 a 5 días hábiles y te avisamos por correo." },
  { icono: Truck, titulo: "Recibe y sigue tu pedido", texto: "Aprueba la cotización y sigue cada etapa de tu pedido desde aquí." },
]

const ETAPAS_EJEMPLO = [
  { titulo: "Solicitud enviada", quien: "Tú", estado: "hecho" },
  { titulo: "Cotización recibida", quien: "GENLOGS", estado: "hecho" },
  { titulo: "Orden de compra", quien: "Tú la apruebas", estado: "actual" },
  { titulo: "Despacho y entrega", quien: "Te avisamos en cada paso", estado: "pendiente" },
] as const

function primerNombre(nombre?: string): string {
  return (nombre ?? "").trim().split(/\s+/)[0] ?? ""
}

/**
 * Lo que ve en el portal una cuenta que entró con Google y todavía no dio los datos de
 * su empresa (v3.4): todavía no tiene pedidos, cotizaciones ni despachos. Muestra cómo
 * se verá su pedido y lo lleva a pedir su primera cotización (ahí se piden los datos).
 */
export function PortalSinEmpresa({ nombre }: { nombre?: string }) {
  const nombreCorto = primerNombre(nombre)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl bg-brand-navy px-6 py-12 text-white sm:px-10 lg:py-14">
        <LineasTopograficas />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            <p className="portal-sube flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium text-white">{nombreCorto ? `Hola, ${nombreCorto}` : "Hola"}</span>
              <span className="text-white/80">Aún no tienes pedidos</span>
            </p>
            <h1 className="portal-sube portal-retraso-1 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">Tu primera cotización está a unos minutos</h1>
            <p className="portal-sube portal-retraso-2 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              Pide repuestos y servicios para tu unidad minera, recibe la cotización y sigue cada pedido desde aquí.
            </p>
            <div className="portal-sube portal-retraso-3 flex flex-wrap gap-3 pt-1">
              <Link
                to="/portal/solicitud"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-bold text-brand-navy shadow-lg transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-slate-50 hover:shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy motion-reduce:transition-none"
              >
                Pedir mi primera cotización
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex h-12 items-center rounded-xl border border-white/35 px-5 font-medium text-white transition-colors duration-150 hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
              >
                Ver cómo funciona
              </a>
            </div>
            <ul className="portal-sube portal-retraso-4 flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-white/85">
              {["Respuesta en 1 a 5 días hábiles", "Seguimiento de cada pedido", "Todo tu historial en un lugar"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-400" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>

          <VistaPreviaPedido />
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 space-y-6">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.08em] text-accent">CÓMO FUNCIONA</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Tres pasos y listo</h2>
        </div>
        <ol aria-label="Cómo funciona" className="grid gap-5 md:grid-cols-3">
          {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
            <li
              key={titulo}
              className={`portal-sube portal-retraso-${i + 3} group rounded-2xl border border-border bg-card p-7 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none" aria-hidden="true">
                  <Icono className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold tracking-wide text-accent">PASO {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{titulo}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{texto}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

/** Tarjeta de ejemplo: muestra cómo se verá un pedido en curso. Solo decorativa. */
function VistaPreviaPedido() {
  return (
    <div data-vista-previa aria-hidden="true" className="relative mx-auto hidden h-[420px] w-full max-w-md sm:block">
      <div className="portal-inclina absolute inset-x-5 top-8 h-[340px] rounded-2xl border border-white/20 bg-white/10" />
      <div className="portal-sube portal-retraso-3 absolute inset-x-0 top-2 mr-10 space-y-4 rounded-2xl bg-white p-5 text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-600">Así verás tu pedido</p>
            <p className="text-base font-bold">Pedido de ejemplo</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">En curso</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <span className="portal-dibuja-x block h-full w-[55%] rounded-full bg-brand-blue" />
        </div>
        <ol className="relative space-y-3.5">
          <span className="portal-dibuja-y absolute bottom-3.5 left-[13px] top-3.5 w-0.5 bg-slate-200" />
          {ETAPAS_EJEMPLO.map(({ titulo, quien, estado }) => (
            <li key={titulo} className="relative flex items-start gap-3">
              {estado === "hecho" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-800 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
              )}
              {estado === "actual" && (
                <span className="portal-late flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue"><span className="h-2 w-2 rounded-full bg-white" /></span>
              )}
              {estado === "pendiente" && <span className="h-7 w-7 shrink-0 rounded-full border-2 border-slate-200 bg-white" />}
              <div className="pt-1">
                <p className={`font-semibold ${estado === "actual" ? "text-brand-blue" : estado === "pendiente" ? "text-slate-600" : ""}`}>{titulo}</p>
                <p className="text-xs text-slate-600">{quien}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="portal-flota absolute -left-4 bottom-2 flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 text-slate-800 shadow-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>
        <div>
          <p className="font-semibold">Cotización lista</p>
          <p className="text-xs text-slate-600">Te avisamos por correo</p>
        </div>
      </div>
      <div className="portal-flota portal-flota-lenta absolute -top-3 right-0 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-xl">
        <Clock className="h-4 w-4 text-brand-blue" />
        1 a 5 días hábiles
      </div>
    </div>
  )
}
