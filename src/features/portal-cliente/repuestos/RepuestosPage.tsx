import { textoPlazoEntrega } from "@/lib/plazoEntrega"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Clock, History, Package, Plus, Search } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { FiltroChips } from "@/components/ui/FiltroChips"
import { inputFormClass } from "@/components/ui/campoEstilos"
import { avisar } from "@/lib/avisos"
import { mensajeError } from "@/lib/errores"
import { formatCurrency } from "@/lib/formatters/currency"
import { usePedidos } from "../hooks/usePedidos"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { ENTRADA_TARJETA, TARJETA_ELEVABLE, retardoEntrada } from "../lib/estilosTarjeta"
import { BotonCargando } from "../components/BotonCargando"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { portalApi } from "@/api/portalApi"
import { repuestosApi, type RepuestoPortal } from "./repuestosApi"
import { MARCAS_VISIBLES, TAM_PAGINA, marcasPorCantidad } from "./lib/catalogo"
import { agregar, guardarCarrito, leerCarrito, type ItemCarrito } from "./lib/carrito"
import { CarritoCotizacion } from "./components/CarritoCotizacion"
import { PaginacionCatalogo } from "./components/PaginacionCatalogo"

const TIPO = { OEM: "Original (OEM)", ALTERNATIVO: "Alternativo compatible" } as const

/**
 * "Repuestos" del portal (RF-82): repuestos publicados con precio referencial y
 * plazo, carrito de cotización, "Lo que ya pediste" con "Volver a pedir" y
 * "¿No lo encuentras?". El carrito no compra: crea una solicitud (canal VITRINA).
 */
export function RepuestosPage() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoriaElegida] = useState<string>()
  const [marca, setMarcaElegida] = useState<string>()
  const [pagina, setPagina] = useState(1)
  const [todasLasMarcas, setTodasLasMarcas] = useState(false)
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

  const marcas = useMemo(() => marcasPorCantidad(todos).map((m) => m.marca), [todos])
  // Marcas con más repuestos primero; sin expandir solo las primeras, más la elegida si quedó fuera.
  const marcasMostradas = todasLasMarcas || marcas.length <= MARCAS_VISIBLES
    ? marcas
    : [...marcas.slice(0, MARCAS_VISIBLES), ...(marca && !marcas.slice(0, MARCAS_VISIBLES).includes(marca) ? [marca] : [])]
  const visibles = todos.filter((r) => (!categoria || String(r.idCategoria) === categoria) && (!marca || r.marca === marca))
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

  const subirFoto = useMutation({
    mutationFn: ({ archivo }: { clave: string; archivo: File }) => portalApi.subirFotoSolicitud(archivo),
    onSuccess: (url, { clave }) => setCarrito((c) => c.map((i) => (i.clave === clave ? { ...i, urlFoto: url } : i))),
  })

  const enviar = useMutation({
    mutationFn: () => repuestosApi.pedirCotizacion(carrito),
    onSuccess: (r) => {
      setCarrito([])
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <EncabezadoPortal titulo="Repuestos" descripcion="Arma tu pedido y te enviamos la cotización con precio y plazo confirmados." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <form role="search" className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setBusqueda(texto.trim()); setPagina(1) }}>
            <label htmlFor="repuestos-buscar" className="sr-only">Buscar por nombre o N.º de parte</label>
            <input id="repuestos-buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre o N.º de parte" className={inputFormClass} />
            <BotonCargando type="submit" className="shrink-0 font-semibold" cargando={repuestos.isPlaceholderData && repuestos.isFetching} textoCargando="Buscando..." icono={<Search className="mr-1.5 h-4 w-4" aria-hidden="true" />}>
              Buscar
            </BotonCargando>
          </form>
          {categorias.length > 1 && (
            <FiltroChips etiqueta="Filtrar por categoría" opciones={[{ label: "Todas" }, ...categorias]} valor={categoria} onChange={setCategoria} />
          )}
          {marcas.length > 1 && (
            <div className="flex flex-col items-start gap-2">
              <FiltroChips etiqueta="Filtrar por marca" opciones={[{ label: "Todas las marcas" }, ...marcasMostradas.map((m) => ({ valor: m, label: m }))]} valor={marca} onChange={setMarca} />
              {marcas.length > MARCAS_VISIBLES && (
                <button
                  type="button"
                  aria-expanded={todasLasMarcas}
                  onClick={() => setTodasLasMarcas((v) => !v)}
                  className="inline-flex h-8 items-center rounded-full border border-dashed border-border px-3 text-[13px] font-medium text-accent hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {todasLasMarcas ? "Ver menos marcas" : `Ver todas las marcas (${marcas.length})`}
                </button>
              )}
            </div>
          )}

          {yaPedidos.length > 0 && (
            <section aria-labelledby="ya-pedidos" className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 id="ya-pedidos" className="flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4 text-accent" aria-hidden="true" /> Lo que ya pediste
                </h2>
                {yaPedidos.length > 3 && (
                  <button
                    type="button"
                    aria-expanded={todosLosPedidos}
                    onClick={() => setTodosLosPedidos((v) => !v)}
                    className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {todosLosPedidos ? "Ver menos" : `Ver todos (${yaPedidos.length})`}
                  </button>
                )}
              </div>
              <ul className="mt-1 divide-y divide-border">
                {pedidosMostrados.map((i) => (
                  <li key={i.descripcion} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                    <span>{i.descripcion} <span className="text-muted-foreground">· {i.cantidad} {i.unidad ?? "und."}</span></span>
                    <button type="button" onClick={() => volverAPedir(i)} aria-label={`Volver a pedir ${i.descripcion}`}
                      className="shrink-0 rounded-md px-2 py-1 font-medium text-accent hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Volver a pedir
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {repuestos.isPending ? (
            <ListaEsqueleto variante="repuesto" etiqueta="Cargando repuestos..." />
          ) : repuestos.isError ? (
            <ErrorBanner message="No pudimos cargar los repuestos." error={repuestos.error} onRetry={() => repuestos.refetch()} />
          ) : visibles.length === 0 ? (
            <EstadoVacioIlustrado
              ilustracion={busqueda || categoria || marca ? "busqueda" : "repuestos"}
              titulo="No encontramos ese repuesto"
              descripcion="Pídelo con su marca y N.º de parte, o con una foto o plano."
              accion={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {(busqueda || categoria || marca) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTexto("")
                        setBusqueda("")
                        setCategoria(undefined)
                        setMarca(undefined)
                      }}
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
                <li key={r.idProducto} style={retardoEntrada(indice)} className={`flex flex-col rounded-xl border border-border bg-card p-4 ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}>
                  <div className={`flex ${r.urlImagen ? "h-32" : "h-24"} items-center justify-center overflow-hidden rounded-lg bg-muted`}>
                    {r.urlImagen ? (
                      <img src={r.urlImagen} alt={r.nombre} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-9 w-9 text-accent" aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-accent">{r.categoria}</p>
                  <h2 className="mt-1 font-semibold leading-snug">{r.nombre}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[r.marca, r.numeroParte].filter(Boolean).join(" · ") || " "}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border px-2 py-0.5">{TIPO[r.tipoRepuesto]}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                      <Clock className="h-3 w-3" aria-hidden="true" /> {textoPlazoEntrega(r.plazoEntrega)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tabular-nums">
                    {r.precioReferencial != null ? formatCurrency(r.precioReferencial, "PEN") : "Precio a consultar"}
                    {r.precioReferencial != null && <span className="ml-1 text-xs font-normal text-muted-foreground">referencial</span>}
                  </p>
                  <div className="mt-auto pt-4">
                    <button type="button" onClick={() => agregarRepuesto(r)} aria-label={`Agregar ${r.nombre} al pedido`}
                      className="inline-flex w-full items-center justify-center rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Agregar al pedido
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <PaginacionCatalogo pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </>
          )}

          <p className="text-sm text-muted-foreground">
            ¿No lo encuentras? <Link to="/portal/solicitud" className="font-semibold text-accent hover:underline">Pídelo con su N.º de parte o una foto</Link>
          </p>
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
        />
      </div>
    </div>
  )
}
