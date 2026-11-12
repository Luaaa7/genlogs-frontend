import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { PackageSearch, Search } from "lucide-react"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { FiltroChips } from "@/components/ui/FiltroChips"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { inputFormClass } from "@/components/ui/campoEstilos"
import { rutaRegistro } from "@/api/contratos/registro"
import type { RepuestoPublico } from "@/api/publicApi"
import { mensajeError } from "@/lib/errores"
import { useCategoriasVitrina, useRepuestosPublicos } from "../hooks/useVitrinaPublica"
import { guardarPedidoPendiente, tokenCliente } from "../lib/pedidoPendiente"
import { enviarSolicitudLanding } from "../lib/enviarSolicitudLanding"
import { TarjetaRepuesto } from "./TarjetaRepuesto"

/** Al volver del registro, la solicitud rápida envía el pedido guardado (D-30). */
const VOLVER = "/#solicitud"

/**
 * Vitrina de la landing (Fase 3, RF-82): destacados, categorías con conteo, marcas en
 * texto y buscador, SIN precio. "Cotizar" crea una solicitud (canal VITRINA); sin
 * cuenta pide registro con RUC y vuelve aquí (D-16, D-30).
 */
export function VitrinaLanding() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoria] = useState<string>()
  const [marca, setMarca] = useState<string>()
  const [cotizados, setCotizados] = useState<number[]>([])

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

  const cotizar = useMutation({
    mutationFn: ({ r, token }: { r: RepuestoPublico; token: string }) => enviarSolicitudLanding(pedidoDe(r), token),
    onSuccess: (_, { r }) => setCotizados((ids) => [...ids, r.idProducto]),
  })

  function alCotizar(r: RepuestoPublico) {
    const token = tokenCliente()
    if (token) {
      cotizar.mutate({ r, token })
      return
    }
    guardarPedidoPendiente(pedidoDe(r))
    navigate(rutaRegistro(VOLVER))
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
          <h2 id="vitrina-titulo" className="mt-2 text-3xl font-bold">Encuentra tu repuesto.</h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Pide la cotización y te confirmamos precio y plazo. Para cotizar te pediremos crear tu acceso con el RUC de tu empresa.
        </p>
      </div>

      <form
        role="search"
        className="mt-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setBusqueda(texto.trim())
        }}
      >
        <label htmlFor="vitrina-buscar" className="sr-only">Buscar por nombre o N.º de parte</label>
        <input
          id="vitrina-buscar"
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre o N.º de parte, por ejemplo 1R-0750"
          className={inputFormClass}
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Buscar
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        {opcionesCategoria.length > 1 && (
          <FiltroChips etiqueta="Filtrar por categoría" opciones={opcionesCategoria} valor={categoria} onChange={setCategoria} />
        )}
        {marcas.length > 0 && (
          <FiltroChips
            etiqueta="Filtrar por marca"
            opciones={[{ label: "Todas las marcas" }, ...marcas.map((m) => ({ valor: m, label: m }))]}
            valor={marca}
            onChange={setMarca}
          />
        )}
      </div>

      {cotizar.isError && (
        <div className="mt-6">
          <ErrorBanner message={mensajeError(cotizar.error, "No se pudo enviar tu pedido. Intenta otra vez.")} />
        </div>
      )}

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {lista.map((r) => (
                <TarjetaRepuesto
                  key={r.idProducto}
                  repuesto={r}
                  cotizando={cotizar.isPending && cotizar.variables?.r.idProducto === r.idProducto}
                  cotizado={cotizados.includes(r.idProducto)}
                  onCotizar={() => alCotizar(r)}
                />
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              ¿No está lo que buscas?{" "}
              <a href="#solicitud" className="font-semibold text-accent hover:underline">Pídelo aquí</a>
            </p>
          </>
        )}
      </div>
    </section>
  )
}

function pedidoDe(r: RepuestoPublico) {
  return {
    marca: r.marca ?? "",
    numeroParte: r.numeroParte ?? "",
    descripcion: r.nombre,
    cantidad: 1,
    idProducto: r.idProducto,
  }
}
