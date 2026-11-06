import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useEscalaMargenes, useGuardarEscalaMargenes } from "../hooks/useMargenes"
import { PageHeader } from "@/components/ui/PageHeader"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Button } from "@/components/ui/button"
import { Tabla, TablaCard, Td, Th, filaClass } from "@/components/ui/tabla"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import { inputFormClass } from "@/components/ui/campoEstilos"
import { avisar } from "@/lib/avisos"
import { MARGEN_MAXIMO, precioDesdeCosto, type EscalaMargenes } from "@/lib/margenes"

/** Fila editable: todo como texto mientras se escribe. */
interface FilaProducto { desde: string; hasta: string; sugerido: string; minimo: string }
interface FilaServicio { idCategoriaServicio: number | null; nombre: string; sugerido: string; minimo: string }

const celda = `${inputFormClass} h-9 text-right tabular-nums`
const num = (s: string) => Number(s.replace(",", "."))
const texto = (n: number | null) => (n === null ? "" : String(n))

/**
 * Escala de márgenes (solo ADMINISTRADOR). Al cotizar, el sistema sugiere el
 * margen según el costo del producto o la categoría del servicio y avisa si
 * queda por debajo del mínimo.
 */
export function ConfiguracionMargenesPage() {
  const escala = useEscalaMargenes()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Márgenes"
        descripcion="Margen sugerido y mínimo para cotizar: por rango de costo en productos y por categoría en servicios."
      />

      <section className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>
          El margen se calcula <strong className="text-foreground">sobre el precio de venta</strong>:
          precio = costo ÷ (1 − margen). Por ejemplo, un repuesto que cuesta PEN 100 con 35 % de margen se cotiza a{" "}
          <strong className="tabular-nums text-foreground">PEN {precioDesdeCosto(100, 35).toFixed(2)}</strong>.
          Si al cotizar el margen baja del mínimo, el sistema muestra un aviso.
        </p>
      </section>

      {escala.isLoading ? (
        <TablaCard>
          <Tabla titulo="Cargando escala" minWidth={480}>
            <tbody><TableSkeletonRows columns={4} rows={5} /></tbody>
          </Tabla>
        </TablaCard>
      ) : escala.isError || !escala.data ? (
        <ErrorBanner message="No se pudo cargar la escala de márgenes. Revisa tu conexión e inténtalo de nuevo." />
      ) : (
        <EditorEscala key={escala.dataUpdatedAt} inicial={escala.data} />
      )}
    </div>
  )
}

function EditorEscala({ inicial }: { inicial: EscalaMargenes }) {
  const guardar = useGuardarEscalaMargenes()
  const [productos, setProductos] = useState<FilaProducto[]>(() =>
    inicial.productos.map((r) => ({
      desde: texto(r.costoDesde),
      hasta: texto(r.costoHasta),
      sugerido: texto(r.margenSugerido),
      minimo: texto(r.margenMinimo),
    })),
  )
  const [servicios, setServicios] = useState<FilaServicio[]>(() =>
    inicial.servicios.map((s) => ({
      idCategoriaServicio: s.idCategoriaServicio,
      nombre: s.nombreCategoria ?? "Cualquier otro servicio",
      sugerido: texto(s.margenSugerido),
      minimo: texto(s.margenMinimo),
    })),
  )
  const [error, setError] = useState<string | null>(null)

  const cambiarProducto = (i: number, campo: keyof FilaProducto, valor: string) =>
    setProductos((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: valor.replace(/[^0-9.,]/g, "") } : f)))
  const cambiarServicio = (i: number, campo: "sugerido" | "minimo", valor: string) =>
    setServicios((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: valor.replace(/[^0-9.,]/g, "") } : f)))

  function agregarRango() {
    setProductos((fs) => {
      const ultimo = fs[fs.length - 1]
      const desde = ultimo ? (ultimo.hasta || ultimo.desde) : "0"
      return [...fs, { desde, hasta: "", sugerido: "", minimo: "" }]
    })
  }

  /** Revisa lo básico aquí; el backend vuelve a validar todo al guardar. */
  function revisar(): string | null {
    const porcentajes = [...productos, ...servicios]
    for (const f of porcentajes) {
      const s = num(f.sugerido)
      const m = num(f.minimo)
      if (!f.sugerido.trim() || !f.minimo.trim() || !Number.isFinite(s) || !Number.isFinite(m)) {
        return "Completa el margen sugerido y el mínimo de todas las filas."
      }
      if (s < 0 || m < 0 || s > MARGEN_MAXIMO || m > MARGEN_MAXIMO) {
        return `Los márgenes deben estar entre 0 y ${MARGEN_MAXIMO} %.`
      }
      if (m > s) return "En cada fila, el margen mínimo no puede ser mayor que el sugerido."
    }
    if (productos.length === 0) return "Agrega al menos un rango de costo para productos."
    for (const [i, f] of productos.entries()) {
      if (!f.desde.trim() || !Number.isFinite(num(f.desde))) return "Completa el costo \"desde\" de cada rango."
      const ultimo = i === productos.length - 1
      if (!f.hasta.trim() && !ultimo) return "Solo el último rango puede quedar sin \"hasta\"."
      if (f.hasta.trim() && num(f.hasta) <= num(f.desde)) return "En cada rango, el \"hasta\" debe ser mayor que el \"desde\"."
      if (!ultimo && num(productos[i + 1].desde) < num(f.hasta)) return "Los rangos de costo se cruzan: revisa el orden."
    }
    return null
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const problema = revisar()
    if (problema) {
      setError(problema)
      return
    }
    guardar.mutate(
      {
        productos: productos.map((f) => ({
          costoDesde: num(f.desde),
          costoHasta: f.hasta.trim() ? num(f.hasta) : null,
          margenSugerido: num(f.sugerido),
          margenMinimo: num(f.minimo),
        })),
        servicios: servicios.map((f) => ({
          idCategoriaServicio: f.idCategoriaServicio,
          nombreCategoria: f.nombre,
          margenSugerido: num(f.sugerido),
          margenMinimo: num(f.minimo),
        })),
      },
      {
        onSuccess: () => avisar("Escala de márgenes guardada"),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(msg ?? "No se pudo guardar la escala. Inténtalo de nuevo.")
        },
      },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <TablaCard>
        <Tabla titulo="Productos por costo unitario (PEN)" minWidth={560}>
          <thead>
            <tr>
              <Th alinear="derecha">Costo desde</Th>
              <Th alinear="derecha">Costo hasta</Th>
              <Th alinear="derecha">Margen sugerido %</Th>
              <Th alinear="derecha">Margen mínimo %</Th>
              <Th><span className="sr-only">Quitar</span></Th>
            </tr>
          </thead>
          <tbody>
            {productos.map((f, i) => (
              <tr key={i} className={filaClass}>
                <Td alinear="derecha">
                  <input aria-label={`Costo desde del rango ${i + 1}`} inputMode="decimal" value={f.desde}
                    onChange={(e) => cambiarProducto(i, "desde", e.target.value)} className={celda} />
                </Td>
                <Td alinear="derecha">
                  <input aria-label={`Costo hasta del rango ${i + 1}`} inputMode="decimal" value={f.hasta}
                    placeholder={i === productos.length - 1 ? "en adelante" : ""}
                    onChange={(e) => cambiarProducto(i, "hasta", e.target.value)} className={celda} />
                </Td>
                <Td alinear="derecha">
                  <input aria-label={`Margen sugerido del rango ${i + 1}`} inputMode="decimal" value={f.sugerido}
                    onChange={(e) => cambiarProducto(i, "sugerido", e.target.value)} className={celda} />
                </Td>
                <Td alinear="derecha">
                  <input aria-label={`Margen mínimo del rango ${i + 1}`} inputMode="decimal" value={f.minimo}
                    onChange={(e) => cambiarProducto(i, "minimo", e.target.value)} className={celda} />
                </Td>
                <Td alinear="derecha">
                  <button
                    type="button"
                    onClick={() => setProductos((fs) => fs.filter((_, j) => j !== i))}
                    disabled={productos.length === 1}
                    aria-label={`Quitar el rango ${i + 1}`}
                    title="Quitar rango"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
        <div className="border-t border-border px-5 py-3">
          <Button type="button" variant="outline" onClick={agregarRango}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar rango
          </Button>
        </div>
      </TablaCard>

      <TablaCard>
        <Tabla titulo="Servicios por categoría" minWidth={480}>
          <thead>
            <tr>
              <Th>Categoría</Th>
              <Th alinear="derecha">Margen sugerido %</Th>
              <Th alinear="derecha">Margen mínimo %</Th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((f, i) => (
              <tr key={f.idCategoriaServicio ?? "defecto"} className={filaClass}>
                <Td className={f.idCategoriaServicio === null ? "font-medium" : undefined}>{f.nombre}</Td>
                <Td alinear="derecha">
                  <input aria-label={`Margen sugerido de ${f.nombre}`} inputMode="decimal" value={f.sugerido}
                    onChange={(e) => cambiarServicio(i, "sugerido", e.target.value)} className={celda} />
                </Td>
                <Td alinear="derecha">
                  <input aria-label={`Margen mínimo de ${f.nombre}`} inputMode="decimal" value={f.minimo}
                    onChange={(e) => cambiarServicio(i, "minimo", e.target.value)} className={celda} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </TablaCard>

      {error && <ErrorBanner message={error} />}

      <div className="flex justify-end">
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando…" : "Guardar escala"}
        </Button>
      </div>
    </form>
  )
}