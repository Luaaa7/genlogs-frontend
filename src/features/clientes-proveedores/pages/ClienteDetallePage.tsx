import { Link, useParams } from 'react-router-dom'
import { AlertCircle, Building2, FileText, MapPin } from 'lucide-react'
import { useCliente } from '../hooks/useClientes'
import { ContactoClienteList } from '../components/ContactoClienteList'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EstadoBadge } from '@/components/ui/EstadoBadge'

export default function ClienteDetallePage() {
  const id = Number(useParams().id)
  const { data: cliente, isLoading, isError, refetch } = useCliente(id)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-hidden="true">
        <Skeleton className="h-8 w-72" />
        <Skeleton variant="rectangular" className="h-32" />
        <Skeleton variant="rectangular" className="h-48" />
      </div>
    )
  }

  if (isError || !cliente) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold">No se pudo cargar el cliente</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/clientes">Volver a clientes</Link></Button>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const t = cliente.tercero
  const unidades = cliente.empresasMineras ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={t.razonSocial}
        descripcion={<><span className="tabular-nums">{t.tipoDocumento} {t.numeroDocumento}</span>{t.nombreComercial ? ` · ${t.nombreComercial}` : ''}</>}
        acciones={
          <Button asChild>
            <Link to="/cotizaciones/nueva"><FileText className="mr-2 h-4 w-4" aria-hidden="true" />Nueva cotización</Link>
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <section aria-labelledby="datos-t" className="rounded-xl border border-border bg-card p-5">
            <h2 id="datos-t" className="mb-4 text-base font-semibold">Datos del cliente</h2>
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 text-sm">
              <div><dt className="text-[13px] text-muted-foreground">Dirección</dt><dd className="mt-1">{t.direccion || '—'}</dd></div>
              <div><dt className="text-[13px] text-muted-foreground">Distrito</dt><dd className="mt-1">{t.distritoNombre || '—'}</dd></div>
              <div><dt className="text-[13px] text-muted-foreground">Teléfono</dt><dd className="mt-1 tabular-nums">{t.telefono || '—'}</dd></div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Correo</dt>
                <dd className="mt-1">{t.email || t.correo ? <a href={`mailto:${t.email || t.correo}`} className="rounded text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t.email || t.correo}</a> : '—'}</dd>
              </div>
              <div><dt className="text-[13px] text-muted-foreground">Situación</dt><dd className="mt-1">{cliente.situacion || '—'}</dd></div>
              <div><dt className="text-[13px] text-muted-foreground">Estado</dt><dd className="mt-1"><EstadoBadge tono={cliente.status === 'A' ? 'success' : 'neutral'}>{cliente.status === 'A' ? 'Activo' : 'Inactivo'}</EstadoBadge></dd></div>
            </dl>
          </section>

          <section aria-labelledby="contactos-t" className="rounded-xl border border-border bg-card p-5">
            <h2 id="contactos-t" className="mb-4 text-base font-semibold">Contactos</h2>
            <ContactoClienteList clienteId={cliente.idCliente ?? cliente.id} contactos={cliente.contactos ?? []} />
          </section>
        </div>

        <section aria-labelledby="unidades-t" className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="unidades-t" className="text-base font-semibold">Unidades mineras <span className="font-normal tabular-nums text-muted-foreground">({unidades.length})</span></h2>
            {unidades.length > 0 && (
              <Link to="/empresas-mineras" className="rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver en el mapa</Link>
            )}
          </div>
          {unidades.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" aria-hidden="true" />Sin unidades mineras asociadas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {unidades.map((u) => (
                <li key={u.idEmpresaMinera ?? u.id} className="py-2.5">
                  <p className="text-sm font-medium">{u.nombreUnidadMinera ?? u.nombre}</p>
                  <p className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {u.latitud != null && u.longitud != null ? `${u.latitud.toFixed(4)}, ${u.longitud.toFixed(4)}` : 'Sin coordenadas'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
