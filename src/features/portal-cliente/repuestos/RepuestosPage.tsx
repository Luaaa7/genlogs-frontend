import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Clock, History, Package, Plus, Search } from "lucide-react"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { FiltroChips } from "@/components/ui/FiltroChips"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { inputFormClass } from "@/components/ui/campoEstilos"
import { avisar } from "@/lib/avisos"
import { mensajeError } from "@/lib/errores"
import { formatCurrency } from "@/lib/formatters/currency"
import { usePedidos } from "../hooks/usePedidos"
import { repuestosApi, type RepuestoPortal } from "./repuestosApi"
import { agregar, guardarCarrito, leerCarrito, type ItemCarrito } from "./lib/carrito"
import { CarritoCotizacion } from "./components/CarritoCotizacion"

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
  const [categoria, setCategoria] = useState<string>()
  const [marca, setMarca] = useState<string>()
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
  const marcas = useMemo(() => [...new Set(todos.map((r) => r.marca).filter((m): m is string => !!m))].sort(), [todos])
  const visibles = todos.filter((r) => (!categoria || String(r.idCategoria) === categoria) && (!marca || r.marca === marca))

  // "Lo que ya pediste": ítems de pedidos anteriores, sin repetir.
  const yaPedidos = useMemo(() => {
    const vistos = new Map<string, { descripcion: string; cantidad: number; unidad?: string }>()
    for (const p of pedidos.data ?? []) {
      for (const i of p.items ?? []) {
        const clave = i.descripcion.trim().toLowerCase()
        if (clave && !vistos.has(clave)) vistos.set(clave, { descripcion: i.descripcion.trim(), cantidad: i.cantidad, unidad: i.unidad ?? undefined })
      }
    }
    return [...vistos.values()].slice(0, 6)
  }, [pedidos.data])

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
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p>
        <h1 className="mt-2 text-3xl font-bold">Repuestos</h1>
        <p className="mt-2 text-muted-foreground">Arma tu pedido y te enviamos la cotización con precio y plazo confirmados.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <form role="search" className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setBusqueda(texto.trim()) }}>
            <label htmlFor="repuestos-buscar" className="sr-only">Buscar por nombre o N.º de parte</label>
            <input id="repuestos-buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre o N.º de parte" className={inputFormClass} />
            <button type="submit" className="inline-flex shrink-0 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Search className="mr-1.5 h-4 w-4" aria-hidden="true" /> Buscar
            </button>
          </form>
          {categorias.length > 1 && (
            <FiltroChips etiqueta="Filtrar por categoría" opciones={[{ label: "Todas" }, ...categorias]} valor={categoria} onChange={setCategoria} />
          )}
          {marcas.length > 1 && (
            <FiltroChips etiqueta="Filtrar por marca" opciones={[{ label: "Todas las marcas" }, ...marcas.map((m) => ({ valor: m, label: m }))]} valor={marca} onChange={setMarca} />
          )}

          {repuestos.isPending ? (
            <CargandoSpinner texto="Cargando repuestos..." />
          ) : repuestos.isError ? (
            <ErrorBanner message="No pudimos cargar los repuestos." error={repuestos.error} onRetry={() => repuestos.refetch()} />
          ) : visibles.length === 0 ? (
            <EstadoVacio
              icono={<Package className="h-5 w-5" />}
              titulo="No encontramos ese repuesto"
              descripcion="Pídelo con su marca y N.º de parte, o con una foto o plano."
              accion={<Link to="/portal/solicitud" className="text-sm font-semibold text-accent hover:underline">¿No lo encuentras? Pídelo aquí</Link>}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((r) => (
                <li key={r.idProducto} className="flex flex-col rounded-xl border border-border bg-card p-4">
                  <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-muted">
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
                      <Clock className="h-3 w-3" aria-hidden="true" /> {r.plazoEntrega}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold tabular-nums">
                    {r.precioReferencial != null ? formatCurrency(r.precioReferencial, "PEN") : "Precio a consultar"}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">referencial</span>
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
          )}

          {yaPedidos.length > 0 && (
            <section aria-labelledby="ya-pedidos" className="rounded-xl border border-border bg-card p-5">
              <h2 id="ya-pedidos" className="flex items-center gap-2 font-semibold">
                <History className="h-5 w-5 text-accent" aria-hidden="true" /> Lo que ya pediste
              </h2>
              <ul className="mt-3 divide-y divide-border">
                {yaPedidos.map((i) => (
                  <li key={i.descripcion} className="flex items-center justify-between gap-3 py-2 text-sm">
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
          <p className="text-sm text-muted-foreground">
            ¿No lo encuentras? <Link to="/portal/solicitud" className="font-semibold text-accent hover:underline">Pídelo con su N.º de parte o una foto</Link>
          </p>
        </div>

        <CarritoCotizacion
          items={carrito}
          enviando={enviar.isPending}
          error={enviar.isError ? mensajeError(enviar.error, "No se pudo enviar tu pedido. Intenta otra vez.") : undefined}
          onCantidad={(clave, cantidad) => setCarrito((c) => c.map((i) => (i.clave === clave ? { ...i, cantidad } : i)))}
          onQuitar={(clave) => setCarrito((c) => c.filter((i) => i.clave !== clave))}
          onEnviar={() => enviar.mutate()}
        />
      </div>
    </div>
  )
}
