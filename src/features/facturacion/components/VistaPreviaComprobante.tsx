import { facturacionApi } from '@/api/facturacionApi'
import { VistaPreviaPdf } from '@/components/ui/VistaPreviaPdf'
import { textoOcMinera } from '../lib/ocMinera'

interface Props {
  idFactura: number
  codigo: string
  /** N.º de OC de la minera. Si no viene, no se muestra el rótulo. */
  numeroOcCliente?: string | null
  onClose: () => void
  /** Si se pasa, aparece el botón "Enviar al cliente" (solo para quien puede enviar). */
  onEnviar?: () => void
}

/** Vista previa del comprobante (PDF): descargar, imprimir y enviar al cliente. */
export function VistaPreviaComprobante({ idFactura, codigo, numeroOcCliente, onClose, onEnviar }: Props) {
  return (
    <VistaPreviaPdf
      titulo={`Comprobante ${codigo}`}
      nombreArchivo={codigo}
      nota={textoOcMinera(numeroOcCliente)}
      cargar={() => facturacionApi.descargarPdf(idFactura)}
      onClose={onClose}
      onEnviar={onEnviar}
    />
  )
}
