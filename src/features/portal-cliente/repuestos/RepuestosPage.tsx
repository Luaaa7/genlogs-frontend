import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowRight, ChevronUp, History, PackageSearch, RotateCcw, Search, ShoppingCart, X } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { avisar } from "@/lib/avisos"
import { mensajeError } from "@/lib/errores"
import { formatCurrency } from "@/lib/formatters/currency"
import { usePedidos } from "../hooks/usePedidos"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { retardoEntrada } from "../lib/estilosTarjeta"
import { BotonCargando } from "../components/BotonCargando"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { portalApi } from "@/api/portalApi"
import { repuestosApi, type RepuestoPortal } from "./repuestosApi"
import { TAM_PAGINA } from "./lib/catalogo"
import { agregar, estimado, guardarCarrito, leerCarrito, type ItemCarrito } from "./lib/carrito"
import { resumirMarcas } from "./lib/marcas"
import { CarritoCotizacion } from "./components/CarritoCotizacion"
import { ChipsCategoria } from "./components/ChipsCategoria"
import { HeroRepuestos } from "./components/HeroRepuestos"
import { PaginacionCatalogo } from "./components/PaginacionCatalogo"
import { TarjetaProducto } from "./components/TarjetaProducto"
import { TarjetasMarca } from "./components/TarjetasMarca"

/**
 * "Repuestos" del portal (RF-82): repuestos publicados con precio referencial y
 * plazo, carrito de cotización, "Lo que ya pediste" con "Volver a pedir" y
 * "¿No lo encuentras?". El carrito no compra: crea una solicitud (canal VITRINA).
 * v3.4 (diseño «tarjetas modernas»): encabezado con escena industrial y buscador, categorías en chips,
 * marcas en tarjetas con logotipo, catálogo paginado y carrito fijo (escritorio) o en panel inferior (móvil).
 */
export function RepuestosPage() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoriaElegida] = useState<string>()
  const [marca, setMarcaElegida] = useState<string>()
  const [pagina, setPagina] = useState(1)
  const [todosLosPedidos, setTodosLosPedidos] = useState(false)
  const [carrito, setCarrito] = useState<ItemCarrito[]>(() => leerCarrito())

  useEffect(() => guardarCarrito(carrito), [carrito])

  const repuestos = useQuery({
    queryKey: ["portal-repuestos", busqueda],
    queryFn: () => repuestosApi.listar(busqueda || undefined),
    placeholderData: (anterior) => anterior,
  })
  const pedidos = usePedidos()

  const todos = useMemo(() => repuestos.data ?? [], [repuestos.data])
  const categorias = useMemo(() => {
    const conteo = new Map<string, { label: string; n: number }>()
    for (const r of todos) {
      const c = conteo.get(String(r.idCategoria))
      conteo.set(String(r.idCategoria), { label: r.categoria, n: (c?.n ?? 0) + 1 })
    }
    return [...conteo.entries()].map(([valor, c]) => ({ valor, ...c }))
  }, [todos])
  // Cada cambio de búsqueda, categoría o marca vuelve a la primera página.
  const setCategoria = (valor?: string) => { setCategoriaElegida(valor); setPagina(1) }
  const setMarca = (valor?: string) => { setMarcaElegida(valor); setPagina(1) }

  // Todas las marcas con su cantidad según la categoría; TarjetasMarca las ordena (más repuestos primero) y las pliega.
  const marcas = useMemo(() => resumirMarcas(todos, categoria), [todos, categoria])
  const enCategoria = categoria ? todos.filter((r) => String(r.idCategoria) === categoria).length : todos.length
  const visibles = todos.filter((r) => (!categoria || String(r.idCategoria) === categoria) && (!marca || r.marca === marca))
  const etiquetaCategoria = categorias.find((c) => c.valor === categoria)?.label
  const hayFiltros = !!(busqueda || categoria || marca)
  const totalPaginas = Math.max(1, Math.ceil(visibles.length / TAM_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const enPagina = visibles.slice((paginaActual - 1) * TAM_PAGINA, paginaActual * TAM_PAGINA)

  // "Lo que ya pediste": ítems de pedidos anteriores, del más reciente al más antiguo y sin repetir.
  const yaPedidos = useMemo(() => {
    const recientes = [...(pedidos.data ?? [])].sort((a, b) => String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")) || String(b.id).localeCompare(String(a.id), "es", { numeric: true }))
    const vistos = new Map<string, { descripcion: string; cantidad: number; unidad?: string }>()
    for (const p of recientes) {
      for (const i of p.items ?? []) {
        const clave = i.descripcion.trim().toLowerCase()
        if (clave && !vistos.has(clave)) vistos.set(clave, { descripcion: i.descripcion.trim(), cantidad: i.cantidad, unidad: i.unidad ?? undefined })
      }
    }
    return [...vistos.values()]
  }, [pedidos.data])
  const pedidosMostrados = todosLosPedidos ? yaPedidos : yaPedidos.slice(0, 3)

  // Carrito en móvil: barra fija abajo que abre el pedido en un panel inferior.
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const barraCarrito = useRef<HTMLButtonElement>(null)
  const estuvoAbierto = useRef(false)
  const cerrarCarrito = () => setCarritoAbierto(false)
  useEffect(() => {
    // Al cerrar el panel, el foco vuelve a la barra que lo abrió.
    if (!carritoAbierto) {
      if (estuvoAbierto.current) barraCarrito.current?.focus()
      estuvoAbierto.current = false
      return
    }
    estuvoAbierto.current = true
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") setCarritoAbierto(false) }
    document.addEventListener("keydown", alPulsar)
    return () => document.removeEventListener("keydown", alPulsar)
  }, [carritoAbierto])
  const enPedido = useMemo(() => new Map(carrito.filter((i) => i.idProducto).map((i) => [i.idProducto, i.cantidad])), [carrito])
  const totalCarrito = estimado(carrito)

  function limpiarFiltros() {
    setTexto("")
    setBusqueda("")
    setCategoria(undefined)
    setMarca(undefined)
  }

  const subirFoto = useMutation({
    mutationFn: ({ archivo }: { clave: string; archivo: File }) => portalApi.subirFotoSolicitud(archivo),
    onSuccess: (url, { clave }) => setCarrito((c) => c.map((i) => (i.clave === clave ? { ...i, urlFoto: url } : i))),
  })

  const enviar = useMutation({
    mutationFn: () => repuestosApi.pedirCotizacion(carrito),
    onSuccess: (r) => {
      setCarrito([])
      setCarritoAbierto(false)
      avisar(`Recibimos tu pedido ${r.codigoSolicitud}`)
      navigate("/portal/pedidos")
    },
  })

  function agregarRepuesto(r: RepuestoPortal) {
    setCarrito((c) =>
      agregar(c, {
        clave: String(r.idProducto), idProducto: r.idProducto, descripcion: r.nombre, marca: r.marca ?? undefined,
        numeroParte: r.numeroParte ?? undefined, unidad: r.unidad ?? undefined, precio: r.precioReferencial ?? undefined, cantidad: 1,
      }),
    )
    avisar(`${r.nombre} agregado a tu pedido`)
  }

  function volverAPedir(i: { descripcion: string; cantidad: number; unidad?: string }) {
    setCarrito((c) => agregar(c, { clave: `texto:${i.descripcion.toLowerCase()}`, descripcion: i.descripcion, unidad: i.unidad, cantidad: i.cantidad }))
    avisar(`${i.descripcion} agregado a tu pedido`)
  }

  return (
    <div className="mx-auto max-w-7xl pb-24 lg:pb-0">
      <HeroRepuestos
        resumen={!busqueda && !repuestos.isPending && !repuestos.isError && todos.length > 0 ? { repuestos: todos.length, marcas: marcas.length, categorias: categorias.length } : undefined}
      >
        <form
          role="search"
          className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/80 p-2 shadow-lg shadow-[#1E3A5F]/10 backdrop-blur sm:flex-row dark:border-white/10 dark:bg-[#0B1830]/70 dark:shadow-black/30"
          onSubmit={(e) => { e.preventDefault(); setBusqueda(texto.trim()); setPagina(1) }}
        >
          <label htmlFor="repuestos-buscar" className="sr-only">Buscar por nombre o N.º de parte</label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
            <input
              id="repuestos-buscar"
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Busca por nombre o N.º de parte"
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:border-[#2E6BA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-[#0F213D] dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <BotonCargando type="submit" className="h-12 shrink-0 rounded-xl bg-[#2E6BA8] px-7 text-base font-semibold shadow-md shadow-[#2E6BA8]/30 hover:bg-[#1E5A94] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]" cargando={repuestos.isPlaceholderData && repuestos.isFetching} textoCargando="Buscando..." icono={<Search className="mr-1.5 h-4 w-4" aria-hidden="true" />}>
            Buscar
          </BotonCargando>
        </form>
      </HeroRepuestos>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {categorias.length > 1 && (
            <ChipsCategoria opciones={categorias} total={todos.length} valor={categoria} onChange={setCategoria} />
          )}
          {marcas.length > 1 && (
            <TarjetasMarca marcas={marcas} total={enCategoria} valor={marca} onChange={setMarca} />
          )}

          {yaPedidos.length > 0 && (
            <section aria-labelledby="ya-pedidos" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#0F213D]">
              <div className="flex items-center justify-between gap-3">
                <h2 id="ya-pedidos" className="flex items-center gap-2 text-sm font-semibold text-[#183153] dark:text-foreground">
                  <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E6BA8]/10 text-[#2E6BA8] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA]">
                    <History className="h-4 w-4" />
                  </span>
                  Lo que ya pediste
                </h2>
                {yaPedidos.length > 3 && (
                  <button
                    type="button"
                    aria-expanded={todosLosPedidos}
                    onClick={() => setTodosLosPedidos((v) => !v)}
                    className="rounded-md px-2 py-1 text-sm font-medium text-[#2E6BA8] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#93C5FD]"
                  >
                    {todosLosPedidos ? "Ver menos" : `Ver todos (${yaPedidos.length})`}
                  </button>
                )}
              </div>
              <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                {pedidosMostrados.map((i) => (
                  <li key={i.descripcion} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{i.descripcion}</span>
                      <span className="text-xs text-muted-foreground">{i.cantidad} {i.unidad ?? "und."}</span>
                    </span>
                    <button type="button" onClick={() => volverAPedir(i)} aria-label={`Volver a pedir ${i.descripcion}`}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#2E6BA8] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#93C5FD]">
                      Volver a pedir
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="repuestos-resultados" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="repuestos-resultados" className="mr-auto text-lg font-semibold text-[#183153] dark:text-foreground">
                Repuestos
                {!repuestos.isPending && !repuestos.isError && (
                  <span className="ml-2 text-sm font-normal tabular-nums text-muted-foreground">{visibles.length} {visibles.length === 1 ? "resultado" : "resultados"}</span>
                )}
              </h2>
              {busqueda && <FiltroActivo texto={`«${busqueda}»`} etiqueta={`Quitar búsqueda ${busqueda}`} onQuitar={() => { setTexto(""); setBusqueda(""); setPagina(1) }} />}
              {etiquetaCategoria && <FiltroActivo texto={etiquetaCategoria} etiqueta={`Quitar categoría ${etiquetaCategoria}`} onQuitar={() => setCategoria(undefined)} />}
              {marca && <FiltroActivo texto={marca} etiqueta={`Quitar marca ${marca}`} onQuitar={() => setMarca(undefined)} />}
              {hayFiltros && visibles.length > 0 && (
                <button type="button" onClick={limpiarFiltros} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Limpiar filtros
                </button>
              )}
            </div>

            {repuestos.isPending ? (
              <ListaEsqueleto variante="repuesto" etiqueta="Cargando repuestos..." />
            ) : repuestos.isError ? (
              <ErrorBanner message="No pudimos cargar los repuestos." error={repuestos.error} onRetry={() => repuestos.refetch()} />
            ) : visibles.length === 0 ? (
              <EstadoVacioIlustrado
                ilustracion={hayFiltros ? "busqueda" : "repuestos"}
                titulo="No encontramos ese repuesto"
                descripcion="Pídelo con su marca y N.º de parte, o con una foto o plano."
                accion={
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {hayFiltros && (
                      <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                    <Link to="/portal/solicitud" className="text-sm font-semibold text-accent hover:underline">¿No lo encuentras? Pídelo aquí</Link>
                  </div>
                }
              />
            ) : (
              <>
                <ul aria-label="Lista de repuestos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {enPagina.map((r, indice) => (
                    <TarjetaProducto
                      key={r.idProducto}
                      repuesto={r}
                      enPedido={enPedido.get(r.idProducto) ?? 0}
                      onAgregar={() => agregarRepuesto(r)}
                      style={retardoEntrada(indice)}
                    />
                  ))}
                </ul>
                <PaginacionCatalogo pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
              </>
            )}
          </section>

          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 dark:border-white/15 dark:bg-white/[0.03] sm:flex-row sm:items-center">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#B45309] dark:text-[#FACC15]">
              <PackageSearch className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              <span className="block font-semibold text-foreground">¿No lo encuentras?</span>
              Te lo conseguimos con su marca y N.º de parte, o con una foto o plano.
            </p>
            <Link to="/portal/solicitud" className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto">
              Pídelo con su N.º de parte o una foto <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <CarritoCotizacion
          items={carrito}
          enviando={enviar.isPending}
          error={
            enviar.isError ? mensajeError(enviar.error, "No se pudo enviar tu pedido. Intenta otra vez.")
              : subirFoto.isError ? mensajeError(subirFoto.error, "No se pudo subir la foto.")
              : undefined
          }
          onCantidad={(clave, cantidad) => setCarrito((c) => c.map((i) => (i.clave === clave ? { ...i, cantidad } : i)))}
          onQuitar={(clave) => setCarrito((c) => c.filter((i) => i.clave !== clave))}
          onEditar={(clave, cambios) => setCarrito((c) => c.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)))}
          onSubirFoto={(clave, archivo) => subirFoto.mutate({ clave, archivo })}
          subiendoFoto={subirFoto.isPending ? subirFoto.variables?.clave : undefined}
          onEnviar={() => enviar.mutate()}
          abiertoMovil={carritoAbierto}
          onCerrarMovil={cerrarCarrito}
        />
      </div>

      {/* Móvil: fondo del panel del pedido y barra fija con el resumen. */}
      {carritoAbierto && <div aria-hidden="true" onClick={cerrarCarrito} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden" />}
      <div hidden={carritoAbierto} className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgb(0_0_0/0.18)] backdrop-blur lg:hidden">
        <button
          ref={barraCarrito}
          type="button"
          onClick={() => setCarritoAbierto(true)}
          aria-expanded={carritoAbierto}
          aria-controls="carrito-cotizacion"
          className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-xl bg-primary px-4 py-3 text-left text-primary-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {carrito.length > 0 && (
              <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FACC15] px-1 text-[11px] font-bold text-[#183153] tabular-nums">
                {carrito.length}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Ver tu pedido de cotización</span>
            <span className="block text-xs text-primary-foreground/80">
              {carrito.length === 0
                ? "Aún no agregas repuestos"
                : `${carrito.length} ${carrito.length === 1 ? "repuesto" : "repuestos"}${totalCarrito != null ? ` · ${formatCurrency(totalCarrito, "PEN")} referencial` : ""}`}
            </span>
          </span>
          <ChevronUp className="h-5 w-5 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** Filtro aplicado, con botón para quitarlo. */
function FiltroActivo({ texto, etiqueta, onQuitar }: { texto: string; etiqueta: string; onQuitar: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-full border border-accent/40 bg-accent/10 pl-3 pr-1 text-sm">
      <span className="max-w-[12rem] truncate">{texto}</span>
      <button type="button" onClick={onQuitar} aria-label={etiqueta} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  )
}
