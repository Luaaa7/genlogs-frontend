import type { ReactNode } from 'react'
import { TIPOS_DOCUMENTO, infoTipoDocumento, type TipoDocumentoId } from '../constants/tiposDocumento'
import { cn } from '@/lib/utils/utils'

/** Ícono del tipo de documento en su cuadro de color (para tarjetas y listas). */
export function IconoTipoDocumento({ id, className }: { id: number | undefined; className?: string }) {
  const info = infoTipoDocumento(id)
  const Icono = info.icono
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg', info.iconoClass, className ?? 'h-9 w-9')}>
      <Icono className="h-[55%] w-[55%]" aria-hidden="true" />
    </span>
  )
}

interface Props {
  value: TipoDocumentoId
  onChange: (id: TipoDocumentoId) => void
  /** Nombre del grupo para lectores de pantalla. */
  ariaLabel?: string
  /** Prefijo de los ids de pestaña y panel (debe ser único en la página). */
  idBase: string
  disabled?: boolean
  /** Contenido de la pestaña abierta: queda unido a ella, como una carpeta. */
  children: ReactNode
  /** Versión compacta (sin descripción ni chip), para paneles angostos. */
  compacto?: boolean
  /** Clases extra del contenido (p. ej. sin relleno para una tabla). */
  panelClassName?: string
}

/**
 * Pestañas RUC, DNI y Pasaporte con su ícono. La pestaña elegida queda blanca y
 * unida al contenido de abajo, de modo que toda la sección cambia según el tipo
 * de documento. Se usa en el formulario del cliente o proveedor, en el paso
 * Cliente de la cotización y en la página Clientes.
 */
export function PestanasTipoDocumento({ value, onChange, ariaLabel = 'Tipo de documento', idBase, disabled, children, compacto = false, panelClassName }: Props) {
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const paso = e.key === 'ArrowRight' ? 1 : -1
    const siguiente = TIPOS_DOCUMENTO[(indice + paso + TIPOS_DOCUMENTO.length) % TIPOS_DOCUMENTO.length]
    onChange(siguiente.id)
    document.getElementById(`${idBase}-tab-${siguiente.id}`)?.focus()
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Sin overflow-hidden en el contenedor: las listas desplegables del panel no deben cortarse. */}
      <div role="tablist" aria-label={ariaLabel} className="grid grid-cols-3 overflow-hidden rounded-t-xl bg-muted/60">
        {TIPOS_DOCUMENTO.map((t, i) => {
          const activa = t.id === value
          const Icono = t.icono
          return (
            <button
              key={t.id}
              id={`${idBase}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={`${idBase}-panel`}
              tabIndex={activa ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'flex min-w-0 items-center gap-3 border-t-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60',
                compacto ? 'px-3 py-2.5' : 'px-4 py-3.5',
                i < TIPOS_DOCUMENTO.length - 1 && 'border-r border-r-border',
                activa
                  ? cn('bg-card text-foreground', t.bordeClass)
                  : 'border-t-transparent border-b border-b-border text-muted-foreground hover:bg-card/60 hover:text-foreground'
              )}
            >
              <span className={cn('flex shrink-0 items-center justify-center rounded-lg', t.iconoClass, compacto ? 'h-8 w-8' : 'h-11 w-11')}>
                <Icono className={compacto ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{t.label}</span>
                {!compacto && <span className="hidden truncate text-xs text-muted-foreground md:block">{t.descripcion}</span>}
              </span>
              {!compacto && (
                <span className="ml-auto hidden shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground lg:inline">
                  {t.formato}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div id={`${idBase}-panel`} role="tabpanel" aria-labelledby={`${idBase}-tab-${value}`} className={cn(compacto ? 'p-4' : 'p-5', panelClassName)}>
        {children}
      </div>
    </div>
  )
}