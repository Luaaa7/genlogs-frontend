import { useId, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, BadgeCheck, CheckCircle2, EyeOff, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { FileUploader } from "@/components/ui/FileUploader"
import { PageHeader } from "@/components/ui/PageHeader"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { inputFormClass } from "@/components/ui/campoEstilos"
import type { FuenteImagen } from "@/api/vitrinaApi"
import { avisar } from "@/lib/avisos"
import { mensajeError } from "@/lib/errores"
import { formatCurrency } from "@/lib/formatters/currency"
import { usePermisos } from "@/lib/permisos"
import { useAccionVitrina, useAgregarImagen, useProductoVitrina } from "../hooks/useVitrina"
import { ESTADOS_VITRINA, TIPOS_REPUESTO } from "../estados"

const FUENTES: Record<FuenteImagen, string> = {
  RECEPCION: "Tomada en la recepción",
  PROVEEDOR: "Del proveedor (con permiso)",
  CLIENTE: "Del cliente",
}

/**
 * Detalle de un producto de la vitrina: foto propia verificada y publicar (RF-79, D-26).
 * Margen fuera de rango → solo el Jefe Administrativo publica, desde esta misma pantalla.
 */
export function ProductoVitrinaPage() {
  const id = Number(useParams().id)
  const uid = useId()
  const permisos = usePermisos()
  const esAsistente = permisos.puedeCrear("vitrina")
  const esJefe = permisos.rol === "JEFE_ADMINISTRATIVO"
  const { data: p, isPending, isError, error, refetch } = useProductoVitrina(id)
  const agregarImagen = useAgregarImagen(id)
  const accion = useAccionVitrina(id)
  const [fuente, setFuente] = useState<FuenteImagen | "">("")
  const [confirmarRetiro, setConfirmarRetiro] = useState(false)

  if (isPending) return <CargandoSpinner texto="Cargando producto..." />
  if (isError || !p) return <ErrorBanner message="No se pudo cargar el producto." error={error} onRetry={() => refetch()} />

  const estado = ESTADOS_VITRINA[p.estado]
  const puedePublicar = p.estado !== "PUBLICADO" && p.estado !== "RETIRADO" && (p.requiereJefe ? esJefe : esAsistente || esJefe)
  const motivoNoPublica = !p.tieneImagenVerificada ? "Sube una foto propia para poder publicar." : null

  function ejecutar(a: "publicar" | "ocultar" | "retirar" | "verificar", mensaje: string) {
    accion.mutate(a, { onSuccess: () => avisar(mensaje) })
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/vitrina/productos" className="inline-flex w-fit items-center gap-1.5 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Vitrina de repuestos
      </Link>
      <PageHeader
        titulo={p.nombre}
        descripcion={<><span className="font-mono">{p.codigo}</span> · {p.categoria ?? "Sin categoría"} · {p.unidad ?? "Sin unidad"}</>}
        acciones={<EstadoBadge tono={estado.tono}>{estado.label}</EstadoBadge>}
      />

      {p.requiereJefe && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-text">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {esJefe
            ? `El margen (${p.margen ?? "?"} %) está fuera de rango. Revísalo y, si estás de acuerdo, publícalo.`
            : `El margen (${p.margen ?? "?"} %) está fuera de rango: solo el Jefe Administrativo puede publicarlo. Ya se le avisó.`}
        </p>
      )}
      {accion.isError && <ErrorBanner message={mensajeError(accion.error, "No se pudo completar la acción.")} />}

      <section aria-labelledby={`${uid}-datos`} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
        <h2 id={`${uid}-datos`} className="sr-only">Datos del repuesto</h2>
        <Dato titulo="Marca" valor={p.marca ?? "—"} />
        <Dato titulo="N.º de parte" valor={p.numeroParte ?? "—"} />
        <Dato titulo="Tipo" valor={TIPOS_REPUESTO[p.tipoRepuesto]} />
        <Dato titulo="Origen" valor={p.origen === "IMPORTADO" ? "Importado (5 a 7 días hábiles)" : "Nacional (24 a 48 h)"} />
        <Dato titulo="Precio referencial" valor={p.precioReferencial != null ? formatCurrency(p.precioReferencial, "PEN") : "—"} />
        {permisos.verMargenes && (
          <Dato
            titulo="Costo y margen"
            valor={`${p.costoPuestoLima != null ? formatCurrency(p.costoPuestoLima, "PEN") : "—"} · ${p.margen != null ? `${p.margen} %` : "—"}`}
          />
        )}
      </section>

      <section aria-labelledby={`${uid}-fotos`} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 id={`${uid}-fotos`} className="font-semibold">Fotos</h2>
          <p className="text-sm text-muted-foreground">
            Solo fotos propias: de la recepción, del proveedor con permiso o del cliente. Nunca fotos de la tienda.
          </p>
        </div>
        {p.imagenes.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.imagenes.map((img) => (
              <li key={img.idImagen} className="overflow-hidden rounded-lg border border-border">
                <img src={img.url} alt={`Foto de ${p.nombre}`} className="h-28 w-full object-cover" />
                <p className="flex items-center gap-1 px-2 py-1 text-xs">
                  {img.verificada && <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />}
                  {img.verificada ? "Verificada" : "Sin verificar"}
                  {img.principal && <span className="ml-auto text-muted-foreground">Principal</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
        {esAsistente && p.estado !== "RETIRADO" && (
          <div className="flex flex-col gap-3">
            <div className="flex max-w-sm flex-col gap-1.5">
              <label htmlFor={`${uid}-fuente`} className="text-sm font-medium">¿De dónde es la foto?</label>
              <select id={`${uid}-fuente`} className={inputFormClass} value={fuente} onChange={(e) => setFuente(e.target.value as FuenteImagen | "")}>
                <option value="">Elige…</option>
                {(Object.keys(FUENTES) as FuenteImagen[]).map((f) => <option key={f} value={f}>{FUENTES[f]}</option>)}
              </select>
            </div>
            {fuente ? (
              <FileUploader
                tipo="imagen"
                label="Subir foto propia"
                helperText="Al subirla confirmas que es real y corresponde a este repuesto."
                onUploaded={(res) =>
                  agregarImagen.mutate(
                    { urlImagen: res.url, fuente, principal: p.imagenes.length === 0 },
                    { onSuccess: () => avisar("Foto agregada y verificada") },
                  )
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">Elige primero de dónde es la foto.</p>
            )}
            {agregarImagen.isError && <ErrorBanner message={mensajeError(agregarImagen.error, "No se pudo guardar la foto.")} />}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {puedePublicar && (
          <Button onClick={() => ejecutar("publicar", "Publicado en la vitrina")} disabled={!!motivoNoPublica || accion.isPending}>
            {accion.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            Publicar
          </Button>
        )}
        {puedePublicar && motivoNoPublica && <span className="text-sm text-muted-foreground">{motivoNoPublica}</span>}
        {esAsistente && p.estado === "PUBLICADO" && (
          <Button variant="outline" onClick={() => ejecutar("verificar", "Marcado como verificado hoy")} disabled={accion.isPending}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Sigue disponible
          </Button>
        )}
        {(esAsistente || esJefe) && p.estado === "PUBLICADO" && (
          <Button variant="outline" onClick={() => ejecutar("ocultar", "Ocultado de la vitrina")} disabled={accion.isPending}>
            <EyeOff className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ocultar
          </Button>
        )}
        {(esAsistente || esJefe) && p.estado !== "RETIRADO" && (
          <Button variant="ghost" onClick={() => setConfirmarRetiro(true)} disabled={accion.isPending}>
            Retirar de la vitrina
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmarRetiro}
        title={`¿Retirar «${p.nombre}» de la vitrina?`}
        description="No se borra (queda en el historial), pero ya no se podrá volver a publicar."
        confirmLabel="Retirar"
        variant="destructive"
        isLoading={accion.isPending}
        onConfirm={() => {
          setConfirmarRetiro(false)
          ejecutar("retirar", "Retirado de la vitrina")
        }}
        onCancel={() => setConfirmarRetiro(false)}
      />
    </div>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="mt-0.5 font-medium">{valor}</p>
    </div>
  )
}
