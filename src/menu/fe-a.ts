import { Percent, SlidersHorizontal, TrendingUp, UserCog } from 'lucide-react'
import type { ItemMenu } from './tipos'

/** Solo el Jefe Administrativo (permisos.ts: esAdmin). */
const soloJefeAdministrativo: ItemMenu['visible'] = (p) => p.esAdmin

/** Opciones del menu de FE-A - Acceso, configuracion, ubicacion, feriados y avisos (Karla). Solo este bloque edita este archivo. */
export const menuFeA: ItemMenu[] = [
  { grupo: 'Administración', label: 'Usuarios', path: '/usuarios', icon: UserCog, visible: soloJefeAdministrativo },
  { grupo: 'Administración', label: 'IGV', path: '/configuracion/igv', icon: Percent, visible: soloJefeAdministrativo },
  { grupo: 'Administración', label: 'Márgenes', path: '/configuracion/margenes', icon: TrendingUp, visible: soloJefeAdministrativo },
  // RF-87: solo el Jefe Administrativo (permisos.ts: editarParametros).
  { grupo: 'Administración', label: 'Parámetros', path: '/configuracion/parametros', icon: SlidersHorizontal, visible: (p) => p.editarParametros },
]