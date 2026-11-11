import { Search } from 'lucide-react'
import { vitrinaHabilitada } from '@/lib/interruptores'
import type { ItemMenu } from './tipos'

/** Opciones del menu de FE-D - Landing, busqueda y vitrina interna (Nicole). Solo este bloque edita este archivo. */
export const menuFeD: ItemMenu[] = vitrinaHabilitada
  ? [{ grupo: 'Operación', label: 'Búsqueda de repuestos', path: '/busqueda', icon: Search, visible: (p) => p.puedeVer('busqueda') }]
  : []
