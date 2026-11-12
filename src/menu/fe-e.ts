import { ListChecks } from 'lucide-react'
import type { ItemMenu } from './tipos'

/** Opciones del menu de FE-E - Finanzas, servicios y dashboard (Mell). Solo este bloque edita este archivo. */
export const menuFeE: ItemMenu[] = [
  {
    grupo: 'Operación',
    label: 'Acciones correctivas',
    path: '/acciones',
    icon: ListChecks,
    visible: (p) => p.puedeVer('dashboard'),
  },
]
