import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { sourcingApi, type Referencia } from '@/api/sourcingApi'
import { Button } from '@/components/ui/button'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { mensajeError } from '@/lib/errores'

const NO_ELEGIBLES = new Set(['CAPTURADO', 'DESCARTADO', 'CONVERTIDO'])

function enlaceSeguro(url: string | null): url is string {
  return !!url && /^https?:\/\/\S+$/i.test(url)
}

/** Busca referencias por número de parte. Solo se elige una en estado Útil. */
export function HistorialItemPanel({ onElegir }: { onElegir: (referencia: Referencia) => void }) {
  const [parte, setParte] = useState('')
  const [lista, setLista] = useState<Referencia[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)

  async function buscar() {
    const numeroParte = parte.trim()
    if (!numeroParte) return
    setBuscando(true)
    setError(null)
    try {
      setLista(await sourcingApi.historial({ numeroParte }))
    } catch (e) {
      setLista(null)
      setError(mensajeError(e, 'No se pudo consultar el historial.'))
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-foreground" htmlFor="historial-parte">
        Número de parte
        <input
          id="historial-parte"
          value={parte}
          onChange={(e) => setParte(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void buscar() } }}
          className={`${inputFormClass} mt-1`}
        />
      </label>
      <Button type="button" variant="outline" onClick={() => void buscar()} disabled={buscando || parte.trim() === ''}>
        {buscando ? 'Buscando…' : 'Buscar en el historial'}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {lista && lista.length === 0 && <p className="text-sm text-muted-foreground">No hay referencias con ese número de parte.</p>}
      {lista && lista.length > 0 && (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {lista.map((r) => {
            const nombre = r.titulo ?? r.numeroParte ?? 'Referencia'
            const elegible = r.estado === 'UTIL'
            return (
              <li key={r.idSourcing} className="rounded-md border border-border px-3 py-2 text-sm">
                {elegible ? (
                  <button type="button" className="text-left font-medium text-foreground hover:underline" onClick={() => onElegir(r)}>
                    {nombre}
                  </button>
                ) : (
                  <span className="text-muted-foreground">{nombre}</span>
                )}
                <span className="ml-2 text-xs text-muted-foreground">{NO_ELEGIBLES.has(r.estado) ? r.estado : 'Útil'}</span>
                {enlaceSeguro(r.urlReferencia) && (
                  <a href={r.urlReferencia} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-xs text-accent">
                    Ver en la tienda
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
