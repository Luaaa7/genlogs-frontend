import { Package, Search, Store } from 'lucide-react'
import { vitrinaHabilitada } from '@/lib/interruptores'
import type { ItemMenu } from './tipos'

/** Opciones del menu de FE-D - Landing, busqueda y vitrina interna (Nicole). Solo este bloque edita este archivo. */
export const menuFeD: ItemMenu[] = vitrinaHabilitada
  ? [
      { grupo: 'Operación', label: 'Búsqueda de repuestos', path: '/busqueda', icon: Search, visible: (p) => p.puedeVer('busqueda') },
      { grupo: 'Maestros', label: 'Vitrina', path: '/vitrina/productos', icon: Store, visible: (p) => p.esInterno && p.puedeVer('vitrina') },
      // Menú del portal: ClienteLayout (FE-B) todavía no lee las opciones 'Portal' de MENU_BLOQUES.
      { grupo: 'Portal', label: 'Repuestos', path: '/portal/repuestos', icon: Package, visible: (p) => p.esCliente },
    ]
  : []
