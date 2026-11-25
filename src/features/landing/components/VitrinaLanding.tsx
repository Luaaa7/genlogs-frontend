import { useMemo, useRef, useState } from "react"
import { PackageSearch, Search } from "lucide-react"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { FiltroChips } from "@/components/ui/FiltroChips"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { inputFormClass } from "@/components/ui/campoEstilos"
import type { RepuestoPublico } from "@/api/publicApi"
import { useCotizacionCart } from "@/hooks/useCotizacionCart"
import { cn } from "@/lib/utils/utils"
import { useCategoriasVitrina, useRepuestosPublicos } from "../hooks/useVitrinaPublica"
import { TarjetaRepuesto } from "./TarjetaRepuesto"
import { SelectorMarca } from "./SelectorMarca"
import { Paginacion } from "./Paginacion"

/** Repuestos por página (3 filas de 4 en escritorio). */
const POR_PAGINA = 12

/**
 * Vitrina de la landing (Fase 3, RF-82): destacados, categorías con conteo, marcas en
 * texto y buscador, SIN precio. "Cotizar" agrega el repuesto al carrito de cotización
 * (genlogs_public_cart); la solicitud se envía desde el portal, con el RUC de la empresa (D-16, D-30).
 */
export function VitrinaLanding() {
  const carrito = useCotizacionCart()
  const [texto, setTexto] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoria] = useState<string>()
  const [marca, setMarca] = useState<string>()
  const inicioLista = useRef<HTMLParagraphElement>(null)

  const filtro = { q: busqueda || undefined, idCategoria: categoria ? Number(categoria) : undefined, marca }
  const repuestos = useRepuestosPublicos(filtro)
  const categorias = useCategoriasVitrina()
  const lista = useMemo(
    // Destacados: primero los que ya tienen foto propia.
    () => [...(repuestos.data ?? [])].sort((a, b) => Number(!!b.urlImagen) - Number(!!a.urlImagen)),
    [repuestos.data],
  )
  const marcas = useMemo(
    () => [...new Set((repuestos.data ?? []).map((r) => r.marca).filter((m): m is string => !!m))].sort(),
    [repuestos.data],
  )

  // Paginación: al cambiar la búsqueda, la categoría o la marca, se vuelve a la página 1.
  const claveFiltro = `${busqueda}|${categoria ?? ""}|${marca ?? ""}`
  const [paginaGuardada, setPaginaGuardada] = useState({ clave: claveFiltro, numero: 1 })
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const pagina = paginaGuardada.clave === claveFiltro ? Math.min(paginaGuardada.numero, totalPaginas) : 1
  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  function irAPagina(numero: number) {
    setPaginaGuardada({ clave: claveFiltro, numero })
    inicioLista.current?.scrollIntoView?.({ behavior: "smooth", block: "start" })
  }

  const opcionesCategoria = [
    { label: "Todas" },
    ...(categorias.data ?? []).map((c) => ({ valor: String(c.idCategoria), label: c.nombre, n: c.cantidad })),
  ]

  return (
    <section id="vitrina" aria-labelledby="vitrina-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Repuestos disponibles</p>
          <h2 id="vitrina-titulo" className="mt-2 text-3xl font-bold tracking-tight">Encuentra tu repuesto.</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Agrega los repuestos que necesitas y pide la cotización de todos juntos. Para cotizar te pediremos crear tu acceso con el RUC de tu empresa.
        </p>
      </div>

      <form
        role="search"
        className="mt-8 flex gap-2 rounded-xl border border-border bg-card p-2 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault()
          setBusqueda(texto.trim())
        }}
      >
        <label htmlFor="vitrina-buscar" className="sr-only">Buscar por nombre o N.º de parte</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="vitrina-buscar"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nombre o N.º de parte, por ejemplo 1R-0750"
            className={cn(inputFormClass, "pl-9")}
          />
        </div>
        <button
          type="submit"
          className="inline-flex shrink-0 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Buscar
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        {opcionesCategoria.length > 1 && (
          <FiltroChips etiqueta="Filtrar por categoría" opciones={opcionesCategoria} valor={categoria} onChange={setCategoria} />
        )}
        {marcas.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <span id="vitrina-marca" className="text-sm font-medium text-foreground">Marca</span>
            <SelectorMarca marcas={marcas} valor={marca} onChange={setMarca} etiquetaId="vitrina-marca" />
          </div>
        )}
      </div>

      <div className="mt-8">
        {repuestos.isPending ? (
          <CargandoSpinner texto="Cargando repuestos..." />
        ) : repuestos.isError ? (
          <ErrorBanner message="No pudimos cargar los repuestos. Puedes pedirlo en la solicitud rápida." onRetry={() => repuestos.refetch()} />
        ) : lista.length === 0 ? (
          <EstadoVacio
            icono={<PackageSearch className="h-5 w-5" />}
            titulo={busqueda || categoria || marca ? "No encontramos ese repuesto" : "Vitrina en actualización"}
            descripcion="Cuéntanos qué necesitas y lo buscamos por ti."
            accion={<a href="#solicitud" className="text-sm font-semibold text-accent hover:underline">¿No está? Pídelo</a>}
          />
        ) : (
          <>
            <p ref={inicioLista} className="mb-4 scroll-mt-24 text-sm text-muted-foreground" aria-live="polite">
              {lista.length} {lista.length === 1 ? "repuesto" : "repuestos"}
              {totalPaginas > 1 && ` · página ${pagina} de ${totalPaginas}`}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibles.map((r) => (
                <TarjetaRepuesto
                  key={r.idProducto}
                  repuesto={r}
                  enCotizacion={carrito.cantidadDe(r.idProducto)}
                  onAgregar={() => carrito.agregar(itemDe(r))}
                  onSumar={() => carrito.sumar(r.idProducto)}
                  onRestar={() => carrito.restar(r.idProducto)}
                />
              ))}
            </div>
            <Paginacion pagina={pagina} total={totalPaginas} onCambiar={irAPagina} />
            <p className="mt-10 text-center text-sm text-muted-foreground">
              ¿No está lo que buscas?{" "}
              <a href="#solicitud" className="font-semibold text-accent hover:underline">Pídelo aquí</a>
            </p>
          </>
        )}
      </div>
    </section>
  )
}

function itemDe(r: RepuestoPublico) {
  return { id: r.idProducto, nombre: r.nombre, marca: r.marca ?? "", numeroParte: r.numeroParte ?? "" }
}
