import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, Copy, FileText, Info, Plus, Trash2, X } from "lucide-react"
import { useCrearSolicitud } from "../hooks/useCrearSolicitud"
import {
  guardarBorrador,
  itemABorrador,
  itemsDesdePrecargados,
  leerBorrador,
  limpiarBorrador,
} from "../lib/borradorSolicitud"
import {
  MAX_ASUNTO,
  UNIDADES_SUGERIDAS,
  asuntoAutomatico,
  itemVacio,
  pesoEnMb,
  validarArchivo,
  validarItem,
  type ErroresItem,
  type ItemPedidoForm,
  type ModoItem,
} from "../lib/itemPedido"
import { portalApi } from "@/api/portalApi"
import { carritoAPrecargados, vaciarCarrito } from "@/lib/carritoPublico"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Campo } from "@/components/ui/campo"
import { describedBy } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { cn } from "@/lib/utils/utils"
import type { SolicitudItemRequest } from "@/api/contratos"

/** Texto opcional: si está vacío no se manda (el contrato no usa null). */
const textoOpcional = (valor: string) => valor.trim() || undefined

/** Máximo del detalle en el backend (SolicitudRequest). */
const MAX_DETALLE = 4000

/** Máximo de ítems por solicitud en el backend. */
const MAX_ITEMS = 50

const enlaceDiscreto =
  "text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"

interface EstadoInicial {
  asunto: string
  asuntoEditado: boolean
  detalle: string
  notaAbierta: boolean
  items: ItemPedidoForm[]
  precargados: number
  avisoArchivos: boolean
}

/**
 * Con qué arranca el formulario. Prioridad:
 *  1. Repuestos que llegan en location.state (carrito de /portal/repuestos) o, si no hay, los del carrito
 *     de cotización de la landing (genlogs_public_cart), en una navegación NUEVA.
 *  2. El borrador de sessionStorage (recarga de la página, o la misma navegación ya editada).
 *  3. Un repuesto vacío.
 * location.key no cambia al recargar, pero sí en cada navegación nueva: así se distingue una recarga
 * (gana el borrador, con lo que el cliente ya editó) de volver a entrar desde el carrito (ganan los repuestos).
 */
function estadoInicial(claveNavegacion: string, estado: unknown): EstadoInicial {
  const borrador = leerBorrador()
  let precargados = itemsDesdePrecargados((estado as { repuestos?: unknown } | null)?.repuestos)
  if (precargados.length === 0) precargados = itemsDesdePrecargados(carritoAPrecargados())

  if (precargados.length > 0 && borrador?.claveNavegacion !== claveNavegacion) {
    return { asunto: "", asuntoEditado: false, detalle: "", notaAbierta: false, items: precargados, precargados: precargados.length, avisoArchivos: false }
  }
  if (borrador) {
    return {
      asunto: borrador.asunto,
      asuntoEditado: borrador.asuntoEditado,
      detalle: borrador.detalle,
      notaAbierta: borrador.notaAbierta || borrador.detalle.trim() !== "",
      items: borrador.items.length > 0 ? borrador.items.map((item) => ({ ...itemVacio(), ...item })) : [itemVacio()],
      precargados: borrador.precargados,
      avisoArchivos: borrador.teniaAdjunto,
    }
  }
  return { asunto: "", asuntoEditado: false, detalle: "", notaAbierta: false, items: [itemVacio()], precargados: 0, avisoArchivos: false }
}

/**
 * Pedido del cliente (D-01): por cada ítem (repuesto, fabricación o servicio), el cliente elige si tiene el
 * N.º de parte (con marca), una foto/plano, o si es un servicio. GTIN opcional. El asunto se sugiere solo, el detalle es una nota opcional y el
 * formulario se guarda como borrador en sessionStorage mientras se escribe.
 */
export function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mutation = useCrearSolicitud()
  const [inicial] = useState(() => estadoInicial(location.key, location.state))
  const [asunto, setAsunto] = useState(inicial.asunto)
  const [asuntoEditado, setAsuntoEditado] = useState(inicial.asuntoEditado)
  const [detalle, setDetalle] = useState(inicial.detalle)
  const [notaAbierta, setNotaAbierta] = useState(inicial.notaAbierta)
  const [items, setItems] = useState<ItemPedidoForm[]>(inicial.items)
  const [avisoArchivos, setAvisoArchivos] = useState(inicial.avisoArchivos)
  const [erroresItems, setErroresItems] = useState<ErroresItem[]>([])
  const [error, setError] = useState("")
  const [subiendo, setSubiendo] = useState(false)
  const tarjetas = useRef(new Map<string, HTMLElement>())
  const notaRef = useRef<HTMLTextAreaElement>(null)
  const enfocarNota = useRef(false)
  const enviado = useRef(false)

  // Mientras el cliente no escriba el asunto, sigue a la descripción del primer repuesto.
  const asuntoMostrado = asuntoEditado ? asunto : asuntoAutomatico(items)

  // Borrador: todo lo escrito, sin los archivos (el navegador no puede conservarlos al recargar).
  useEffect(() => {
    if (enviado.current) return
    guardarBorrador({
      asunto: asuntoMostrado,
      asuntoEditado,
      detalle,
      notaAbierta,
      items: items.map(itemABorrador),
      teniaAdjunto: items.some((item) => item.foto && !item.urlFoto),
      precargados: inicial.precargados,
      claveNavegacion: location.key,
    })
  }, [asuntoMostrado, asuntoEditado, detalle, notaAbierta, items, inicial.precargados, location.key])

  useEffect(() => {
    if (notaAbierta && enfocarNota.current) {
      enfocarNota.current = false
      notaRef.current?.focus()
    }
  }, [notaAbierta])

  function cambiarItem(indice: number, cambios: Partial<ItemPedidoForm>) {
    // Si cambia la foto, la URL subida antes ya no sirve.
    const ajustes = "foto" in cambios ? { ...cambios, urlFoto: null } : cambios
    setItems((actuales) => actuales.map((item, i) => (i === indice ? { ...item, ...ajustes } : item)))
    // Un archivo recién elegido se valida al instante (formato y peso), sin esperar al envío.
    if ("foto" in cambios) {
      const errorArchivo = cambios.foto ? validarArchivo(cambios.foto) : undefined
      setErroresItems((actuales) =>
        items.map((_, i) => {
          const errores = { ...actuales[i] }
          if (i === indice) {
            if (errorArchivo) errores.foto = errorArchivo
            else delete errores.foto
          }
          return errores
        }),
      )
    }
  }

  function cambiarModo(indice: number, modo: ModoItem) {
    const actual = items[indice]
    // «Servicio» sugiere la unidad SERV (si seguía en UND); al salir de servicio, SERV vuelve a UND.
    let unidad = actual.unidad
    if (modo === "servicio" && unidad.trim() === "UND") unidad = "SERV"
    else if (modo !== "servicio" && actual.modo === "servicio" && unidad.trim() === "SERV") unidad = "UND"
    cambiarItem(indice, { modo, unidad })
    // Los errores del modo anterior ya no aplican a este ítem.
    setErroresItems((actuales) => items.map((_, i) => (i === indice ? {} : (actuales[i] ?? {}))))
  }

  function quitarItem(indice: number) {
    setItems((actuales) => actuales.filter((_, i) => i !== indice))
    setErroresItems((actuales) => actuales.filter((_, i) => i !== indice))
  }

  function duplicarItem(indice: number) {
    if (items.length >= MAX_ITEMS) return
    // Copia todo (modo, textos, archivo) con un id propio, justo debajo del original.
    const copia: ItemPedidoForm = { ...items[indice], id: itemVacio().id }
    setItems((actuales) => [...actuales.slice(0, indice + 1), copia, ...actuales.slice(indice + 1)])
    setErroresItems((actuales) => {
      const alineados = items.map((_, i) => actuales[i] ?? {})
      return [...alineados.slice(0, indice + 1), {}, ...alineados.slice(indice + 1)]
    })
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const errores = items.map(validarItem)
    setErroresItems(errores)
    const primerConError = errores.findIndex((e) => Object.keys(e).length > 0)
    if (primerConError >= 0) {
      setError("Revisa los datos de los ítems marcados.")
      tarjetas.current.get(items[primerConError].id)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    if (!asuntoMostrado.trim()) {
      setError("Escribe el asunto de la solicitud.")
      return
    }

    let detalleItems: SolicitudItemRequest[]
    try {
      setSubiendo(true)
      detalleItems = []
      for (const [i, item] of items.entries()) {
        let urlFoto = item.urlFoto
        if (item.foto && !urlFoto) {
          urlFoto = await portalApi.subirFotoSolicitud(item.foto)
          const subida = urlFoto
          // Se guarda para no volver a subirla si falla la creación y el cliente reintenta.
          setItems((actuales) => actuales.map((it, j) => (j === i ? { ...it, urlFoto: subida } : it)))
        }
        detalleItems.push({
          descripcion: item.descripcion.trim(),
          cantidad: Number(item.cantidad),
          unidad: textoOpcional(item.unidad),
          // En modo «servicio» la marca y el N.º de parte no se ven: no se mandan aunque hayan quedado escritos.
          marcaTexto: item.modo === "servicio" ? undefined : textoOpcional(item.marca),
          // En modo «foto» el N.º de parte tampoco se ve.
          numeroParte: item.modo === "parte" ? textoOpcional(item.numeroParte) : undefined,
          gtin: textoOpcional(item.gtin),
          urlFoto: urlFoto ?? undefined,
          idProducto: item.idProducto,
        })
      }
    } catch {
      setError("No se pudo subir la foto o plano. Revisa tu conexión e intenta nuevamente.")
      return
    } finally {
      setSubiendo(false)
    }

    mutation.mutate(
      { canal: "PORTAL", asunto: asuntoMostrado.trim(), descripcion: textoOpcional(detalle), items: detalleItems },
      {
        onSuccess: () => {
          enviado.current = true
          limpiarBorrador()
          // El carrito de la landing se vacía solo cuando la solicitud ya se envió.
          vaciarCarrito()
          navigate("/portal/pedidos")
        },
      },
    )
  }

  const enviando = subiendo || mutation.isPending

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p>
        <h1 className="mt-2 text-3xl font-bold">Nueva solicitud</h1>
        <p className="mt-2 text-muted-foreground">
          Agrega los repuestos, fabricaciones o servicios que necesitas cotizar. Indica la marca y el N.º de parte si los
          tienes; si no, adjunta una foto o plano.
        </p>
      </div>

      <form onSubmit={enviar} noValidate className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
        {inicial.precargados > 0 && (
          <div role="status" className="flex items-start gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p>
              {inicial.precargados === 1
                ? "Se precargó 1 repuesto de tu selección."
                : `Se precargaron ${inicial.precargados} repuestos de tu selección.`}{" "}
              Revisa los datos antes de enviar.
            </p>
          </div>
        )}
        {avisoArchivos && (
          <div role="status" className="flex items-start gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="min-w-0 flex-1">
              Recuperamos lo que habías escrito. Por seguridad del navegador, las fotos o planos no se conservan al
              recargar la página: vuelve a adjuntarlos antes de enviar.
            </p>
            <button
              type="button"
              onClick={() => setAvisoArchivos(false)}
              aria-label="Cerrar aviso"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div>
          <Label htmlFor="solicitud-asunto">Asunto</Label>
          <Input
            id="solicitud-asunto"
            name="asunto"
            className="mt-2"
            placeholder="Ej. Repuestos para mantenimiento"
            maxLength={MAX_ASUNTO}
            required
            value={asuntoMostrado}
            onChange={(e) => {
              setAsunto(e.target.value)
              setAsuntoEditado(true)
            }}
          />
        </div>

        {notaAbierta ? (
          <div>
            <Label htmlFor="solicitud-descripcion">Detalle de la solicitud</Label>
            <textarea
              id="solicitud-descripcion"
              name="descripcion"
              ref={notaRef}
              rows={4}
              maxLength={MAX_DETALLE}
              placeholder="Indica equipo, unidad minera o fecha requerida"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ) : (
          <button
            type="button"
            className={enlaceDiscreto}
            onClick={() => {
              enfocarNota.current = true
              setNotaAbierta(true)
            }}
          >
            + Agregar una nota (opcional)
          </button>
        )}

        <fieldset className="min-w-0 space-y-4">
          <legend className="text-lg font-semibold">Ítems a cotizar</legend>
          {items.map((item, i) => (
            <ItemRepuesto
              key={item.id}
              numero={i + 1}
              item={item}
              errores={erroresItems[i] ?? {}}
              puedeQuitar={items.length > 1}
              puedeDuplicar={items.length < MAX_ITEMS}
              registrar={(elemento) => {
                if (elemento) tarjetas.current.set(item.id, elemento)
                else tarjetas.current.delete(item.id)
              }}
              onCambiar={(cambios) => cambiarItem(i, cambios)}
              onCambiarModo={(modo) => cambiarModo(i, modo)}
              onQuitar={() => quitarItem(i)}
              onDuplicar={() => duplicarItem(i)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={items.length >= MAX_ITEMS}
            onClick={() => setItems((actuales) => [...actuales, itemVacio()])}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar otro ítem
          </Button>
        </fieldset>

        {error && <ErrorBanner message={error} />}
        {mutation.isError && (
          <ErrorBanner message="No se pudo enviar la solicitud. Intenta nuevamente." onRetry={() => mutation.reset()} />
        )}
        <Button type="submit" disabled={enviando} className="w-full">
          {subiendo ? "Subiendo fotos..." : mutation.isPending ? "Enviando..." : "Enviar solicitud"}
        </Button>
      </form>
    </div>
  )
}

const OPCIONES_MODO: { valor: ModoItem; texto: string }[] = [
  { valor: "parte", texto: "Tengo el N.º de parte" },
  { valor: "foto", texto: "Tengo una foto" },
  { valor: "servicio", texto: "Es un servicio / fabricación" },
]

interface ItemRepuestoProps {
  numero: number
  item: ItemPedidoForm
  errores: ErroresItem
  puedeQuitar: boolean
  puedeDuplicar: boolean
  /** Entrega la tarjeta al formulario para llevar la vista hasta el primer repuesto con error. */
  registrar: (elemento: HTMLElement | null) => void
  onCambiar: (cambios: Partial<ItemPedidoForm>) => void
  onCambiarModo: (modo: ModoItem) => void
  onQuitar: () => void
  onDuplicar: () => void
}

/** Archivo elegido: nombre, peso y miniatura (imagen) o icono de documento (PDF), con «Quitar». */
function TarjetaArchivo({
  archivo,
  numero,
  botonQuitarRef,
  onQuitar,
}: {
  archivo: File
  numero: number
  botonQuitarRef: React.Ref<HTMLButtonElement>
  onQuitar: () => void
}) {
  const esImagen = archivo.type.startsWith("image/")
  const [vista, setVista] = useState<string | null>(null)

  // La vista previa se crea al elegir el archivo y se revoca al quitarlo, reemplazarlo o salir de la página.
  useEffect(() => {
    if (!esImagen || typeof URL.createObjectURL !== "function") return
    const url = URL.createObjectURL(archivo)
    // El objeto URL es un recurso externo: se crea aquí y se revoca en la limpieza, por eso va en el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVista(url)
    return () => {
      URL.revokeObjectURL(url)
      setVista(null)
    }
  }, [archivo, esImagen])

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-muted/40 p-2">
      {esImagen && vista ? (
        <img src={vista} alt={`Vista previa de ${archivo.name}`} className="h-14 w-14 shrink-0 rounded-md border border-border object-cover" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
          <FileText className="h-6 w-6" data-testid="icono-documento" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{archivo.name}</p>
        <p className="text-sm text-muted-foreground">{pesoEnMb(archivo.size)}</p>
      </div>
      <Button ref={botonQuitarRef} type="button" variant="ghost" size="sm" aria-label={`Quitar archivo del ítem ${numero}`} onClick={onQuitar}>
        Quitar
      </Button>
    </div>
  )
}

function ItemRepuesto({ numero, item, errores, puedeQuitar, puedeDuplicar, registrar, onCambiar, onCambiarModo, onQuitar, onDuplicar }: ItemRepuestoProps) {
  const [adjuntoAbierto, setAdjuntoAbierto] = useState(false)
  // «Más datos» arranca abierto solo si el repuesto ya trae un GTIN (borrador o precarga).
  const [masDatosAbierto, setMasDatosAbierto] = useState(() => item.gtin.trim() !== "")
  // Al pasar del input a la tarjeta (o al revés) el elemento con foco desaparece: el foco se entrega al nuevo.
  const foco = useRef<"quitar" | "entrada" | null>(null)
  const botonQuitarRef = useRef<HTMLButtonElement>(null)
  const entradaRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (foco.current === "quitar") botonQuitarRef.current?.focus()
    else if (foco.current === "entrada") entradaRef.current?.focus()
    foco.current = null
  }, [item.foto])
  const id = (campo: string) => `${item.id}-${campo}`
  const nombre = (campo: string) => `Ítem ${numero}: ${campo}`
  const aria = (campo: keyof ItemPedidoForm, ayuda?: string) => ({
    "aria-invalid": errores[campo] ? true : undefined,
    "aria-describedby": describedBy(id(campo), { error: errores[campo], ayuda }),
  })
  const AYUDA_FOTO = "JPG, PNG, WEBP o PDF, hasta 10 MB."

  const esParte = item.modo === "parte"
  const esServicio = item.modo === "servicio"
  // Un adjunto ya elegido nunca queda escondido: lo que se ve es lo que se envía.
  const adjuntoVisible = adjuntoAbierto || Boolean(item.foto) || Boolean(item.urlFoto)
  // Un GTIN con error se muestra aunque el cliente haya cerrado «Más datos».
  const masDatosVisible = masDatosAbierto || Boolean(errores.gtin)

  const campoFoto = (
    <Campo
      key="foto"
      className="sm:col-span-6"
      id={id("foto")}
      label="Foto o plano"
      obligatorio={item.modo === "foto" && item.idProducto === undefined}
      opcional={item.modo !== "foto" || item.idProducto !== undefined}
      ayuda={item.urlFoto && !item.foto ? "Ya hay una foto o plano cargado. Puedes reemplazarlo." : AYUDA_FOTO}
      error={errores.foto}
    >
      {item.foto ? (
        <TarjetaArchivo
          archivo={item.foto}
          numero={numero}
          botonQuitarRef={botonQuitarRef}
          onQuitar={() => {
            foco.current = "entrada"
            onCambiar({ foto: null })
          }}
        />
      ) : (
        <Input
          ref={entradaRef}
          id={id("foto")}
          aria-label={nombre("foto o plano")}
          {...aria("foto", AYUDA_FOTO)}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const elegido = e.target.files?.[0] ?? null
            if (elegido) foco.current = "quitar"
            onCambiar({ foto: elegido })
          }}
        />
      )}
    </Campo>
  )

  return (
    <div ref={registrar} role="group" aria-label={`Ítem ${numero}`} className="min-w-0 rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Ítem {numero}</h3>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" aria-label={`Duplicar ítem ${numero}`} disabled={!puedeDuplicar} onClick={onDuplicar}>
            <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Duplicar
          </Button>
          {puedeQuitar && (
            <Button type="button" variant="ghost" size="sm" aria-label={`Eliminar ítem ${numero}`} onClick={onQuitar}>
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 [&>*]:min-w-0">
        <Campo className="sm:col-span-4" id={id("descripcion")} label="Descripción" error={errores.descripcion}>
          <Input
            id={id("descripcion")}
            aria-label={nombre("descripción")}
            {...aria("descripcion")}
            value={item.descripcion}
            onChange={(e) => onCambiar({ descripcion: e.target.value })}
            placeholder={esServicio ? "Ej. Fabricación de chute en acero" : "Ej. Filtro de aceite del motor"}
          />
        </Campo>
        <Campo className="sm:col-span-1" id={id("cantidad")} label="Cantidad" error={errores.cantidad}>
          <Input
            id={id("cantidad")}
            aria-label={nombre("cantidad")}
            {...aria("cantidad")}
            type="number"
            min="0.01"
            step="0.01"
            value={item.cantidad}
            onChange={(e) => onCambiar({ cantidad: e.target.value })}
          />
        </Campo>
        <Campo className="sm:col-span-1" id={id("unidad")} label="Unidad">
          <Input
            id={id("unidad")}
            aria-label={nombre("unidad")}
            list={id("unidades")}
            value={item.unidad}
            onChange={(e) => onCambiar({ unidad: e.target.value })}
          />
          <datalist id={id("unidades")}>
            {UNIDADES_SUGERIDAS.map((unidad) => (
              <option key={unidad} value={unidad} />
            ))}
          </datalist>
        </Campo>

        <div
          role="radiogroup"
          aria-label={nombre("cómo identificas el ítem")}
          className="grid grid-cols-1 gap-1 sm:grid-cols-3 rounded-lg bg-muted p-1 sm:col-span-6"
        >
          {OPCIONES_MODO.map(({ valor, texto }) => (
            <label
              key={valor}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-center text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring",
                item.modo === valor ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={id("modo")}
                value={valor}
                checked={item.modo === valor}
                aria-label={nombre(texto)}
                onChange={() => onCambiarModo(valor)}
              />
              {texto}
            </label>
          ))}
        </div>

        {esParte ? (
          <>
            <Campo key="marca" className="sm:col-span-3" id={id("marca")} label="Marca" obligatorio error={errores.marca}>
              <Input
                id={id("marca")}
                aria-label={nombre("marca")}
                {...aria("marca")}
                value={item.marca}
                onChange={(e) => onCambiar({ marca: e.target.value })}
                placeholder="Ej. Caterpillar"
              />
            </Campo>
            <Campo key="numeroParte" className="sm:col-span-3" id={id("numeroParte")} label="N.º de parte" obligatorio error={errores.numeroParte}>
              <Input
                id={id("numeroParte")}
                aria-label={nombre("N.º de parte")}
                {...aria("numeroParte")}
                value={item.numeroParte}
                onChange={(e) => onCambiar({ numeroParte: e.target.value })}
                placeholder="Ej. 1R-0750"
              />
            </Campo>
            {adjuntoVisible ? (
              campoFoto
            ) : (
              <div key="adjuntar" className="sm:col-span-6">
                <button type="button" className={enlaceDiscreto} onClick={() => setAdjuntoAbierto(true)}>
                  + Adjuntar también foto o plano PDF (opcional)
                </button>
              </div>
            )}
          </>
        ) : esServicio ? (
          campoFoto
        ) : (
          <>
            <Campo key="marca" className="sm:col-span-6" id={id("marca")} label="Marca" opcional error={errores.marca}>
              <Input
                id={id("marca")}
                aria-label={nombre("marca")}
                {...aria("marca")}
                value={item.marca}
                onChange={(e) => onCambiar({ marca: e.target.value })}
                placeholder="Ej. Caterpillar"
              />
            </Campo>
            {campoFoto}
          </>
        )}

        <div className="sm:col-span-6">
          <button
            type="button"
            className={cn(enlaceDiscreto, "inline-flex items-center gap-1")}
            aria-expanded={masDatosVisible}
            aria-controls={id("mas-datos")}
            onClick={() => setMasDatosAbierto((abierto) => !abierto)}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform motion-reduce:transition-none", masDatosVisible && "rotate-180")} aria-hidden="true" />
            Más datos (opcional)
          </button>
          {masDatosVisible && (
            <div id={id("mas-datos")} className="mt-3">
              <Campo id={id("gtin")} label="GTIN" error={errores.gtin}>
                <Input
                  id={id("gtin")}
                  aria-label={nombre("GTIN (opcional)")}
                  {...aria("gtin")}
                  inputMode="numeric"
                  value={item.gtin}
                  onChange={(e) => onCambiar({ gtin: e.target.value })}
                  placeholder="Código de barras"
                />
              </Campo>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
