import { SlidersHorizontal } from 'lucide-react'
import type { ItemMenu } from './tipos'

/** Opciones del menu de FE-A - Acceso, configuracion, ubicacion, feriados y avisos (Karla). Solo este bloque edita este archivo. */
export const menuFeA: ItemMenu[] = [
  // RF-87: solo el Jefe Administrativo (permisos.ts: editarParametros).
  { grupo: 'Administración', label: 'Parámetros', path: '/configuracion/parametros', icon: SlidersHorizontal, visible: (p) => p.editarParametros },
]
