import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import { useCrearSolicitud } from "../hooks/useCrearSolicitud"
import { itemVacio, validarItem, type ErroresItem, type ItemPedidoForm } from "../lib/itemPedido"
import { portalApi } from "@/api/portalApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Campo } from "@/components/ui/campo"
import { describedBy } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import type { SolicitudItemRequest } from "@/api/contratos"

/** Texto opcional: si está vacío no se manda (el contrato no usa null). */
const textoOpcional = (valor: string) => valor.trim() || undefined

/**
 * Pedido del cliente (D-01): por cada repuesto, marca y N.º de parte si los tiene;
 * si no, una foto o plano con la descripción. GTIN opcional.
 */
export function NuevaSolicitudPage() {
  const navigate = useNavigate()
  const mutation = useCrearSolicitud()
  const [items, setItems] = useState<ItemPedidoForm[]>([itemVacio()])
  const [erroresItems, setErroresItems] = useState<ErroresItem[]>([])
  const [error, setError] = useState("")
  const [subiendo, setSubiendo] = useState(false)

  function cambiarItem(indice: number, cambios: Partial<ItemPedidoForm>) {
    // Si cambia la foto, la URL subida antes ya no sirve.
    const ajustes = "foto" in cambios ? { ...cambios, urlFoto: null } : cambios
    setItems((actuales) => actuales.map((item, i) => (i === indice ? { ...item, ...ajustes } : item)))
  }

  function quitarItem(indice: number) {
    setItems((actuales) => actuales.filter((_, i) => i !== indice))
    setErroresItems((actuales) => actuales.filter((_, i) => i !== indice))
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const form = new FormData(event.currentTarget)
    const asunto = String(form.get("asunto") ?? "").trim()
    const descripcion = String(form.get("descripcion") ?? "").trim()
    if (!asunto || descripcion.length < 10) {
      setError("Completa el asunto y describe tu necesidad con al menos 10 caracteres.")
      return
    }

    const errores = items.map(validarItem)
    setErroresItems(errores)
    if (errores.some((e) => Object.keys(e).length > 0)) {
      setError("Revisa los datos de los repuestos marcados.")
      return
    }

    let detalle: SolicitudItemRequest[]
    try {
      setSubiendo(true)
      detalle = []
      for (const [i, item] of items.entries()) {
        let urlFoto = item.urlFoto
        if (item.foto && !urlFoto) {
          urlFoto = await portalApi.subirFotoSolicitud(item.foto)
          const subida = urlFoto
          // Se guarda para no volver a subirla si falla la creación y el cliente reintenta.
          setItems((actuales) => actuales.map((it, j) => (j === i ? { ...it, urlFoto: subida } : it)))
        }
        detalle.push({
          descripcion: item.descripcion.trim(),
          cantidad: Number(item.cantidad),
          unidad: textoOpcional(item.unidad),
          marcaTexto: textoOpcional(item.marca),
          numeroParte: textoOpcional(item.numeroParte),
          gtin: textoOpcional(item.gtin),
          urlFoto: urlFoto ?? undefined,
        })
      }
    } catch {
      setError("No se pudo subir la foto o plano. Revisa tu conexión e intenta nuevamente.")
      return
    } finally {
      setSubiendo(false)
    }

    mutation.mutate({ canal: "PORTAL", asunto, descripcion, items: detalle }, { onSuccess: () => navigate("/portal/pedidos") })
  }

  const enviando = subiendo || mutation.isPending

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p>
        <h1 className="mt-2 text-3xl font-bold">Nueva solicitud</h1>
        <p className="mt-2 text-muted-foreground">
          Por cada repuesto, indica la marca y el N.º de parte si los tienes. Si no, adjunta una foto o plano.
        </p>
      </div>

      <form onSubmit={enviar} noValidate className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <Label htmlFor="solicitud-asunto">Asunto</Label>
          <Input id="solicitud-asunto" name="asunto" className="mt-2" placeholder="Ej. Repuestos para mantenimiento" required />
        </div>
        <div>
          <Label htmlFor="solicitud-descripcion">Detalle de la solicitud</Label>
          <textarea
            id="solicitud-descripcion"
            name="descripcion"
            rows={4}
            required
            placeholder="Indica el equipo, ubicación y fecha requerida."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Repuestos</legend>
          {items.map((item, i) => (
            <ItemRepuesto
              key={item.id}
              numero={i + 1}
              item={item}
              errores={erroresItems[i] ?? {}}
              puedeQuitar={items.length > 1}
              onCambiar={(cambios) => cambiarItem(i, cambios)}
              onQuitar={() => quitarItem(i)}
            />
          ))}
          <Button type="button" variant="outline" onClick={() => setItems((actuales) => [...actuales, itemVacio()])}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar otro repuesto
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

interface ItemRepuestoProps {
  numero: number
  item: ItemPedidoForm
  errores: ErroresItem
  puedeQuitar: boolean
  onCambiar: (cambios: Partial<ItemPedidoForm>) => void
  onQuitar: () => void
}

function ItemRepuesto({ numero, item, errores, puedeQuitar, onCambiar, onQuitar }: ItemRepuestoProps) {
  const id = (campo: string) => `${item.id}-${campo}`
  const nombre = (campo: string) => `Repuesto ${numero}: ${campo}`
  const aria = (campo: keyof ItemPedidoForm, ayuda?: string) => ({
    "aria-invalid": errores[campo] ? true : undefined,
    "aria-describedby": describedBy(id(campo), { error: errores[campo], ayuda }),
  })
  const AYUDA_FOTO = "Obligatoria si no tienes el N.º de parte. JPG, PNG, WEBP o PDF, hasta 10 MB."

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Repuesto {numero}</h3>
        {puedeQuitar && (
          <Button type="button" variant="ghost" size="sm" aria-label={`Quitar repuesto ${numero}`} onClick={onQuitar}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        <Campo className="sm:col-span-4" id={id("descripcion")} label="Descripción" error={errores.descripcion}>
          <Input
            id={id("descripcion")}
            aria-label={nombre("descripción")}
            {...aria("descripcion")}
            value={item.descripcion}
            onChange={(e) => onCambiar({ descripcion: e.target.value })}
            placeholder="Ej. Filtro de aceite del motor"
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
            value={item.unidad}
            onChange={(e) => onCambiar({ unidad: e.target.value })}
          />
        </Campo>
        <Campo className="sm:col-span-2" id={id("marca")} label="Marca" error={errores.marca}>
          <Input
            id={id("marca")}
            aria-label={nombre("marca")}
            {...aria("marca")}
            value={item.marca}
            onChange={(e) => onCambiar({ marca: e.target.value })}
            placeholder="Ej. Caterpillar"
          />
        </Campo>
        <Campo className="sm:col-span-2" id={id("numeroParte")} label="N.º de parte" error={errores.numeroParte}>
          <Input
            id={id("numeroParte")}
            aria-label={nombre("N.º de parte")}
            {...aria("numeroParte")}
            value={item.numeroParte}
            onChange={(e) => onCambiar({ numeroParte: e.target.value })}
            placeholder="Ej. 1R-0750"
          />
        </Campo>
        <Campo className="sm:col-span-2" id={id("gtin")} label="GTIN" opcional error={errores.gtin}>
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
        <Campo className="sm:col-span-6" id={id("foto")} label="Foto o plano" ayuda={AYUDA_FOTO} error={errores.foto}>
          <Input
            id={id("foto")}
            aria-label={nombre("foto o plano")}
            {...aria("foto", AYUDA_FOTO)}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => onCambiar({ foto: e.target.files?.[0] ?? null })}
          />
        </Campo>
      </div>
    </div>
  )
}
