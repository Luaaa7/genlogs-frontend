import { useCotizacionCart } from "@/hooks/useCotizacionCart"
import { cn } from "@/lib/utils/utils"

/**
 * Aviso discreto del ingreso y el registro: el visitante eligió repuestos en la landing y, al
 * entrar con su cuenta, se le llevará a enviarlos. Sin repuestos elegidos no se muestra.
 */
export function AvisoCarritoPublico({ className }: { className?: string }) {
  const { total } = useCotizacionCart()
  if (total === 0) return null
  return (
    <p role="status" className={cn("rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground", className)}>
      Inicia sesión o regístrate con tu RUC para enviar {total === 1 ? "el repuesto seleccionado" : `los ${total} repuestos seleccionados`}.
    </p>
  )
}
