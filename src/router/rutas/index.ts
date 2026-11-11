import type { RouteObject } from 'react-router-dom'
import { rutasFeA } from './fe-a'
import { rutasFeB } from './fe-b'
import { rutasFeC } from './fe-c'
import { rutasFeD } from './fe-d'
import { rutasFeE } from './fe-e'

const BLOQUES = [rutasFeA, rutasFeB, rutasFeC, rutasFeD, rutasFeE]

/** Todas las rutas de los bloques, agrupadas por layout (Paso 0). */
export const RUTAS_BLOQUES: { internas: RouteObject[]; portal: RouteObject[]; publicas: RouteObject[] } = {
  internas: BLOQUES.flatMap((b) => b.internas),
  portal: BLOQUES.flatMap((b) => b.portal),
  publicas: BLOQUES.flatMap((b) => b.publicas),
}