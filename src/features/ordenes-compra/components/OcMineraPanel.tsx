import { useState } from 'react'
import { TAMANIO_MAXIMO_BYTES } from '@/lib/constants/uploads'
import { mensajeError } from '@/lib/errores'
import { validarArchivo } from '@/lib/validators/archivo.schema'
import { Ventana } from '@/components/ui/Ventana'
import { usePermisos } from '@/lib/permisos'
import type { OrdenCompra } from '@/types/ordenCompra.types'
import { useConfirmarOcMinera, useSubirArchivoOrdenCompra } from '../hooks/useOrdenesCompra'
import { OcMineraForm } from './OcMineraForm'

const REGLAS_PDF = {
  tipo: 'documento' as const,
  mimesPermitidos: ['application/pdf'],
  tamanioMaximoBytes: TAMANIO_MAXIMO_BYTES.documento,
}

/** Subida del PDF y datos leídos. Se abre desde la lista, sin ruta propia. */
export function OcMineraPanel({ orden, onCerrar }: { orden: OrdenCompra; onCerrar: () => void }) {
  const puedeEditar = usePermisos().puedeCrear('pedidosOc')
  const numero = orden.numeroOrdenCompra ?? orden.numero ?? ''
  const subir = useSubirArchivoOrdenCompra()
  const confirmar = useConfirmarOcMinera(orden.idOrdenCompra ?? orden.id ?? 0)
  const [progreso, setProgreso] = useState<number | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)

  const alElegir = (archivo?: File) => {
    if (!archivo) return
    const validacion = validarArchivo(archivo, REGLAS_PDF)
    if (!validacion.valido) {
      setErrorArchivo(validacion.error ?? 'El archivo no es válido.')
      setProgreso(null)
      return
    }
    setErrorArchivo(null)
    setProgreso(0)
    subir.mutate(
      { id: orden.idOrdenCompra ?? orden.id ?? 0, archivo, onProgress: setProgreso },
      {
        onSuccess: () => setProgreso(null),
        onError: (err) => {
          setProgreso(null)
          setErrorArchivo(mensajeError(err, 'No se pudo subir el PDF de la OC.'))
        },
      },
    )
  }

  return (
    <Ventana
      titulo="OC de la minera"
      descripcion={`Orden interna ${numero}`}
      onCerrar={onCerrar}
      cerrable={!subir.isPending && !confirmar.isPending}
    >
      <div className="flex flex-col gap-5">
        {puedeEditar && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-foreground" htmlFor="oc-pdf">
              PDF de la OC
              <input
                id="oc-pdf"
                type="file"
                accept="application/pdf,.pdf"
                className="mt-1 block w-full text-sm"
                disabled={subir.isPending}
                onChange={(e) => {
                  alElegir(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            {progreso !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Subiendo… {progreso}%</p>
                <div role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progreso}%` }} />
                </div>
              </div>
            )}
            {errorArchivo && <p role="alert" className="text-sm text-destructive">{errorArchivo}</p>}
            <p className="text-xs text-muted-foreground">
              {orden.ocLeidaAuto ? 'El PDF se leyó solo. Revisa los datos antes de confirmar.' : 'Si la lectura viene vacía, completa los tres datos a mano.'}
            </p>
          </div>
        )}
        <OcMineraForm
          key={`${orden.idOrdenCompra}-${orden.numeroOcCliente ?? ''}-${orden.montoOcCliente ?? ''}-${orden.fechaEmisionCliente ?? ''}`}
          orden={orden}
          puedeEditar={puedeEditar}
          confirmando={confirmar.isPending}
          error={confirmar.error ? mensajeError(confirmar.error, 'No se pudo confirmar la OC.') : null}
          onConfirmar={(body) => confirmar.mutate(body)}
        />
      </div>
    </Ventana>
  )
}
