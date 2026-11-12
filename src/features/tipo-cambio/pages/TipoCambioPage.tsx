import { useState } from 'react'
import { AlertTriangle, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { avisar } from '@/lib/avisos'
import { usePermisos } from '@/lib/permisos'
import { cn } from '@/lib/utils/utils'
import type { TipoCambioDia } from '@/api/contratos/parametros'
import { useCorregirTipoCambio, useTipoCambio } from '../hooks/useTipoCambio'
import { aNumero, fechaDia, formatoValor, textoFuente, validarTipoCambio } from '../lib/tipoCambio'

const AYUDA = 'Soles por 1 dólar, valor de venta. Hasta 4 decimales.'

/**
 * Tipo de cambio del día (RF-86, D-19). El sistema lo consulta cada día en
 * Factiliza (SUNAT); el Jefe Administrativo puede corregir el de hoy si la
 * consulta falló o el valor no es correcto. Cada cotización guarda el que usó.
 */
export function TipoCambioPage() {
  const tipoCambio = useTipoCambio()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Tipo de cambio"
        descripcion="Dólar del día que usan las cotizaciones y la búsqueda de repuestos. Se consulta solo cada mañana en SUNAT."
      />

      {tipoCambio.isLoading ? (
        <p role="status" className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Cargando el tipo de cambio…</p>
      ) : tipoCambio.isError ? (
        <ErrorBanner message="No se pudo cargar el tipo de cambio. Revisa tu conexión e inténtalo de nuevo." />
      ) : (
        <>
          <ValorActual dia={tipoCambio.data ?? null} />
          <Corregir key={tipoCambio.data ? `${tipoCambio.data.fecha}:${tipoCambio.data.valor}` : 'vacio'} dia={tipoCambio.data ?? null} />
        </>
      )}

      <p className="text-sm text-muted-foreground">
        Cambiar el valor solo afecta a lo que se cotice desde ahora: las cotizaciones ya hechas conservan el tipo de cambio con el que se calcularon.
      </p>
    </div>
  )
}

function ValorActual({ dia }: { dia: TipoCambioDia | null }) {
  if (!dia) {
    return (
      <section className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm text-warning-text">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>Todavía no hay ningún tipo de cambio registrado. Escribe el de hoy para que se pueda cotizar en dólares.</p>
      </section>
    )
  }
  return (
    <section aria-labelledby="tc-actual" className="rounded-xl border border-border bg-card p-5">
      <h2 id="tc-actual" className="sr-only">Tipo de cambio vigente</h2>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted" aria-hidden="true">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
        </span>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            S/ {formatoValor(dia.valor)}
            <span className="ml-2 text-base font-normal text-muted-foreground">por 1 {dia.codigoMoneda === 'USD' ? 'dólar' : dia.codigoMoneda}</span>
          </p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{fechaDia(dia.fecha)}</p>
        </div>
        <span className={cn(
          'ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium',
          dia.fuente === 'MANUAL' ? 'bg-accent/15 text-foreground' : 'bg-muted text-muted-foreground',
        )}>
          {textoFuente(dia.fuente)}
        </span>
      </div>
      {!dia.esDeHoy && (
        <p role="status" className="mt-4 flex gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning-text">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Hoy todavía no hay tipo de cambio: se está usando el último guardado. Si la consulta a SUNAT no llega, corrígelo abajo.
        </p>
      )}
    </section>
  )
}

function Corregir({ dia }: { dia: TipoCambioDia | null }) {
  const { editarTipoCambio } = usePermisos()
  const corregir = useCorregirTipoCambio()
  const [valor, setValor] = useState(dia ? formatoValor(dia.valor) : '')
  const [error, setError] = useState<string | null>(null)

  if (!editarTipoCambio) return null

  const sinCambios = !!dia && dia.esDeHoy && aNumero(valor) === Number(dia.valor)

  function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    const problema = validarTipoCambio(valor)
    if (problema) {
      setError(problema)
      return
    }
    corregir.mutate(aNumero(valor), {
      onSuccess: () => {
        avisar('Tipo de cambio de hoy guardado')
        setError(null)
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(msg ?? 'No se pudo guardar el tipo de cambio. Inténtalo de nuevo.')
      },
    })
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="tc-corregir" className="rounded-xl border border-border bg-card p-5">
      <h2 id="tc-corregir" className="text-base font-semibold text-foreground">Corregir el de hoy</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Úsalo si la consulta automática falló o el valor no es el correcto. Queda registrado como corrección manual.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Campo id="tc-valor" label="Tipo de cambio (S/ por US$ 1)" ayuda={AYUDA} error={error ?? undefined}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground" aria-hidden="true">S/</span>
            <input
              id="tc-valor"
              inputMode="decimal"
              value={valor}
              onChange={(e) => { setValor(e.target.value.replace(/[^0-9.,]/g, '')); setError(null) }}
              aria-invalid={!!error}
              aria-describedby={describedBy('tc-valor', { error: error ?? undefined, ayuda: AYUDA })}
              className={cn(inputFormClass, 'w-36 text-right tabular-nums')}
            />
          </div>
        </Campo>
        <Button type="submit" disabled={corregir.isPending || sinCambios}>
          {corregir.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
