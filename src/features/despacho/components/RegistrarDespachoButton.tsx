import { mensajeError } from '@/lib/errores'
import { usePermisos } from '@/lib/permisos'
import { useCrearDespacho } from '../hooks/useDespachos'

/** El asistente logístico registra el despacho de una orden. El API decide si se puede. */
export function RegistrarDespachoButton({ idOrdenCompra }: { idOrdenCompra: number }) {
  const { puedeCrear } = usePermisos()
  const crear = useCrearDespacho()
  if (!puedeCrear('despacho')) return null
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={crear.isPending || crear.isSuccess}
        onClick={() => crear.mutate(idOrdenCompra)}
        className="rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        Registrar despacho
      </button>
      {crear.isError && <p role="alert" className="max-w-48 text-right text-xs text-destructive">{mensajeError(crear.error)}</p>}
    </span>
  )
}
