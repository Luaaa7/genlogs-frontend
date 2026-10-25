import { Link, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Ruta que no existe: avisa en lugar de mandar al dashboard sin explicación. */
export function NoEncontradaPage() {
  const { pathname } = useLocation()
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent" aria-hidden="true">
        <SearchX className="h-7 w-7" />
      </span>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Página no encontrada</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          La dirección <span className="break-all font-mono text-foreground">{pathname}</span> no existe o fue movida.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild><Link to="/dashboard">Ir al inicio</Link></Button>
        <Button variant="outline" onClick={() => window.history.back()}>Volver atrás</Button>
      </div>
    </div>
  )
}