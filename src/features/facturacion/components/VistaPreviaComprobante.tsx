import { facturacionApi } from '@/api/facturacionApi'
import { VistaPreviaPdf } from '@/components/ui/VistaPreviaPdf'

interface Props {
  idFactura: number
  codigo: string
  onClose: () => void
  /** Si se pasa, aparece el botón "Enviar al cliente" (solo para quien puede enviar). */
  onEnviar?: () => void
}

/** Vista previa del comprobante (PDF): descargar, imprimir y enviar al cliente. */
export function VistaPreviaComprobante({ idFactura, codigo, onClose, onEnviar }: Props) {
  return (
    <VistaPreviaPdf
      titulo={`Comprobante ${codigo}`}
      nombreArchivo={codigo}
      cargar={() => facturacionApi.descargarPdf(idFactura)}
      onClose={onClose}
      onEnviar={onEnviar}
    />
  )
}
