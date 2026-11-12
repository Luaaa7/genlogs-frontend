import { Info } from 'lucide-react'
import { useAvisoAltoValor } from '../hooks/useAvisoAltoValor'

/** Aviso informativo. No aprueba ni bloquea nada. */
export function AvisoAltoValor({ id }: { id: number }) {
  const aviso = useAvisoAltoValor(id)
  if (!aviso) return null
  return (
    <div role="status" className="flex items-start gap-2 rounded-lg bg-info/10 px-4 py-3 text-sm text-info">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">{aviso.titulo}</p>
        {aviso.mensaje && <p className="mt-0.5">{aviso.mensaje}</p>}
      </div>
    </div>
  )
}
