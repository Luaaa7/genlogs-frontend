import type { ItemMenu } from './tipos'
import { menuFeA } from './fe-a'
import { menuFeB } from './fe-b'
import { menuFeC } from './fe-c'
import { menuFeD } from './fe-d'
import { menuFeE } from './fe-e'

export type { ItemMenu, GrupoMenu } from './tipos'

/** Opciones de menu de todos los bloques, en orden A -> E (Paso 0). */
export const MENU_BLOQUES: ItemMenu[] = [...menuFeA, ...menuFeB, ...menuFeC, ...menuFeD, ...menuFeE]