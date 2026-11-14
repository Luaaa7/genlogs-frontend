import { Globe } from 'lucide-react'
import type { ItemMenu } from './tipos'

/** Opciones del menu de FE-B - Portal del cliente y fuentes de búsqueda (Luana). Solo este bloque edita este archivo. */
export const menuFeB: ItemMenu[] = [
  // L3 (v3.3, BPMN 9-A): el Jefe configura las tiendas; el Asistente Logístico solo ve su estado.
  { grupo: 'Administración', label: 'Fuentes de búsqueda', path: '/configuracion/fuentes', icon: Globe, visible: (p) => p.verFuentes },
]
