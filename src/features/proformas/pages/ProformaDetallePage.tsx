// src/features/proformas/pages/ProformaDetallePage.tsx
import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileText } from "lucide-react"
import { mensajeErrorProforma } from "@/api/proformasApi"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/formatters/currency"
import { formatearFechaCorta } from "@/lib/formatters/fechaLocal"
import { formatearNumeroOrdenCompra } from "@/lib/formatters/numeroOrdenCompra"
import { formatearTamanio } from "@/lib/validators/archivo.schema"
import { EstadoProformaBadge } from "../components/EstadoProformaBadge"
import { useProforma } from "../hooks/useProformas"

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando proforma">
      <Skeleton className="h-8 w-64" />
      <Skeleton variant="rectangular" className="h-40 w-full" />
      <Skeleton variant="rectangular" className="h-28 w-full" />
    </div>
  )
}

export function ProformaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const idProforma = Number(id)
  const idValido = Number.isInteger(idProforma) && idProforma > 0

  const { data: proforma, isLoading, isError, error, refetch } = useProforma(idProforma)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Link
        to="/proformas"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a proformas
      </Link>

      {!idValido && (
        <p role="alert" className="text-sm text-destructive">
          El identificador de la proforma no es válido.
        </p>
      )}

      {idValido && isLoading && <DetalleSkeleton />}

      {idValido && isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <span className="text-destructive">
            {mensajeErrorProforma(error, "No se pudo cargar la proforma.")}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {proforma && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Orden de compra</p>
              <h1 className="font-mono text-2xl font-semibold">
                {formatearNumeroOrdenCompra(proforma.numeroOrdenCompra, `Proforma #${proforma.id}`)}
              </h1>
            </div>
            <EstadoProformaBadge estado={proforma.estadoProforma} />
          </header>

          <Tarjeta titulo="Resumen">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Dato titulo="N.° de orden de compra">
                <span className="font-mono">{formatearNumeroOrdenCompra(proforma.numeroOrdenCompra)}</span>
              </Dato>
              <Dato titulo="Cotización">
                <Link
                  to={`/cotizaciones/${proforma.cotizacionId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {proforma.cotizacionCodigo ?? `#${proforma.cotizacionId}`}
                </Link>
              </Dato>
              <Dato titulo="Cliente">{proforma.clienteNombre ?? "—"}</Dato>
              <Dato titulo="Moneda">{proforma.moneda}</Dato>
              <Dato titulo="Fecha de emisión">
                {formatearFechaCorta(proforma.fechaEmision ?? proforma.fechaCreacion)}
              </Dato>
              <Dato titulo="Fecha de vencimiento">{formatearFechaCorta(proforma.fechaVencimiento)}</Dato>
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Importes">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Dato titulo="Subtotal">
                <span className="tabular-nums">{formatCurrency(proforma.subtotal, proforma.moneda)}</span>
              </Dato>
              <Dato titulo="IGV">
                <span className="tabular-nums">{formatCurrency(proforma.igv, proforma.moneda)}</span>
              </Dato>
              <Dato titulo="Total">
                <span className="text-base font-semibold tabular-nums">
                  {formatCurrency(proforma.total, proforma.moneda)}
                </span>
              </Dato>
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Observaciones">
            {proforma.observaciones ? (
              <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed">{proforma.observaciones}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sin observaciones.</p>
            )}
          </Tarjeta>

       <Tarjeta titulo="Adjuntos">
            {proforma.adjuntos.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {proforma.adjuntos.map((adjunto) => (
                  <li key={adjunto.id ?? adjunto.url}>
                    {/* Aquí faltaba abrir la etiqueta <a */}
                    <a
                      href={adjunto.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-medium">{adjunto.nombreArchivo}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatearTamanio(adjunto.tamanioBytes)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Esta proforma no tiene archivos adjuntos.</p>
            )}
          </Tarjeta>
        </>
      )}
    </div>
  )
}