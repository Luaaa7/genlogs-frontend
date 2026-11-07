import { useState } from 'react'
import { CheckCircle2, Download, Loader2 } from 'lucide-react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { cotizacionesApi } from '@/api/cotizacionesApi'

interface Props {
  id: number
  codigo: string
  onVer: () => void
  onOtra: () => void
}

/** Aviso de éxito al crear la cotización, con lo siguiente que se suele hacer. */
export function CotizacionCreadaModal({ id, codigo, onVer, onOtra }: Props) {
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState(false)

  async function descargar() {
    setDescargando(true)
    setError(false)
    try {
      const pdf = await cotizacionesApi.descargarCotizacionPDF(id)
      const url = URL.createObjectURL(pdf)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `${codigo}.pdf`
      enlace.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <Ventana
      titulo="Cotización registrada"
      onCerrar={onVer}
      ancho="max-w-md"
      acciones={
        <>
          <Button type="button" variant="ghost" onClick={onOtra}>Crear otra</Button>
          <Button type="button" variant="outline" onClick={() => void descargar()} disabled={descargando}>
            {descargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
            Descargar PDF
          </Button>
          <Button type="button" onClick={onVer}>Ver cotización</Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="text-sm text-foreground">
          La cotización <strong className="tabular-nums">{codigo}</strong> se guardó correctamente como borrador.
        </p>
        {error && <p role="alert" className="text-sm text-destructive">No se pudo descargar el PDF. Inténtalo desde el detalle.</p>}
      </div>
    </Ventana>
  )
}
