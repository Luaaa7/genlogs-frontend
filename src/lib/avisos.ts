/**
 * Avisos breves de éxito ("Cliente guardado", "Cotización enviada a …").
 * Se llama `avisar("…")` desde cualquier pantalla; el componente <Avisos />
 * (montado una sola vez en main.tsx) los muestra y desaparecen a los 4 s.
 */
export interface Aviso {
  id: number
  texto: string
}

type Oyente = (avisos: Aviso[]) => void

let avisos: Aviso[] = []
let siguienteId = 1
const oyentes = new Set<Oyente>()

function emitir() {
  for (const oyente of oyentes) oyente(avisos)
}

export function quitarAviso(id: number) {
  avisos = avisos.filter((a) => a.id !== id)
  emitir()
}

/** Muestra un aviso de éxito durante 4 segundos (como máximo 3 a la vez). */
export function avisar(texto: string) {
  const id = siguienteId++
  avisos = [...avisos.slice(-2), { id, texto }]
  emitir()
  setTimeout(() => quitarAviso(id), 4000)
}

export function suscribirAvisos(oyente: Oyente) {
  oyentes.add(oyente)
  oyente(avisos)
  return () => {
    oyentes.delete(oyente)
  }
}