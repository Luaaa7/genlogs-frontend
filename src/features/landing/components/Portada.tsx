import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowRight, Check } from "lucide-react"
import { useCategoriasVitrina } from "../hooks/useVitrinaPublica"
import { EscenaCamion } from "./EscenaCamion"

const TEXTO_FIJO = "Repuestos, servicios y fabricaciones que llegan a tu operación"
const REPETICIONES_MIN = 8

/** Al llegar con #solicitud o #catalogo baja a esa sección; en la solicitud deja el foco en su primer campo. */
function useBajarAlAncla() {
  const { hash, key } = useLocation()
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView?.()
    if (hash === "#solicitud") document.getElementById("sr-marca")?.focus({ preventScroll: true })
  }, [hash, key])
}

export function Portada() {
  useBajarAlAncla()
  return (
    <>
      <section className="relative overflow-hidden bg-[#eef4fb] text-foreground dark:bg-[#1e3a5f]">
        <EscenaCamion />
        <div className="relative z-10 max-w-3xl px-4 pb-24 pt-12 sm:px-8 md:pb-40 md:pt-16 lg:px-14">
          <p className="gl-up inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-dorado dark:text-amarillo">
            <span className="h-[3px] w-[22px] rounded-sm bg-dorado dark:bg-amarillo" aria-hidden="true" />Logística para la minería
          </p>
          <h1 className="gl-up gl-d1 mt-[18px] text-5xl font-black leading-[1.02] tracking-[-0.045em] sm:text-7xl lg:text-[84px]">
            <span className="sr-only">{TEXTO_FIJO}</span>
            <span aria-hidden="true">
              <span className="gl-words text-dorado dark:text-amarillo"><span><b>Repuestos</b><b>Servicios</b><b>Fabricaciones</b></span></span>
              <br />que llegan<br />a tu operación.
            </span>
          </h1>
          <p className="gl-up gl-d2 mt-[22px] max-w-[520px] text-[19px] leading-[1.55] text-foreground/80">Cotización con precio y plazo confirmados. Sigue cada pedido hasta el despacho.</p>
          <div className="mt-[34px] flex flex-wrap items-center gap-x-[26px] gap-y-4">
            <Link
              to={{ pathname: "/", hash: "#solicitud" }}
              data-hero-cta
              className="gl-cta group flex h-[66px] items-center gap-[18px] rounded-[18px] border-2 border-primary bg-amarillo pl-[30px] pr-2.5 text-[19px] font-extrabold text-[#0f2440] shadow-[0_16px_38px_rgb(8_20_40/0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-transparent"
            >
              Pedir cotización
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#0f2440] text-amarillo transition-transform group-hover:translate-x-1 motion-reduce:transition-none"><ArrowRight className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" /></span>
            </Link>
            <Link to={{ pathname: "/", hash: "#catalogo" }} className="gl-up gl-d3 group flex items-center gap-1.5 text-base font-semibold text-primary hover:underline hover:underline-offset-[5px] dark:text-foreground">
              Ver catálogo <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transition-none">→</span>
            </Link>
          </div>
          <p className="gl-up gl-d3 mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="h-[15px] w-[15px] text-green-700 dark:text-[#6ee7b7]" strokeWidth={3} aria-hidden="true" />Sin compromiso · Precio y plazo confirmados
          </p>
        </div>
      </section>
      <FranjaCategorias />
    </>
  )
}

/** Franja amarilla que se desplaza con las categorías reales. Se pausa con el mouse; sin datos no se muestra. */
function FranjaCategorias() {
  const { data } = useCategoriasVitrina()
  if (!data?.length) return null
  // Dos mitades iguales para que el desplazamiento de -50% cierre sin saltos.
  const mitad = Array.from({ length: Math.ceil(REPETICIONES_MIN / data.length) }, () => data).flat()
  const pintar = (copia: number) =>
    mitad.map((c, i) => (
      <span key={`${copia}-${i}`} aria-hidden={copia === 1 || i >= data.length ? true : undefined} className="inline-flex items-center gap-2.5 whitespace-nowrap px-[30px]">
        <span className="font-semibold">{c.nombre}</span>
        <span className="rounded-full bg-[#0f2440] px-[9px] py-0.5 text-[13px] font-extrabold text-amarillo">{c.cantidad}</span>
        <span aria-hidden="true">◆</span>
      </span>
    ))
  return (
    <section aria-label="Categorías del catálogo" className="flex h-16 items-center overflow-hidden bg-amarillo text-base text-[#0f2440]">
      <div className="gl-mq">{pintar(0)}{pintar(1)}</div>
    </section>
  )
}
