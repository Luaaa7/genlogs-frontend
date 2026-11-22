export interface Cifra {
  id: string
  /** Texto tal como se muestra, por ejemplo "120+". null mientras no se compruebe: no se muestra. */
  valor: string | null
  etiqueta: string
  /** De dónde sale el dato (para revisarlo antes de cambiarlo). */
  fuente: string
  /** Fecha del conteo, dd/mm/aaaa. */
  fecha: string
}

/**
 * Cifras de la Portada (v3.4, K1). Solo datos reales y comprobables (Luana, 19/11):
 * los conteos los pasa Ale desde Supabase. Una cifra sin valor no se muestra.
 */
export const CIFRAS: Cifra[] = [
  { id: "repuestos", valor: null, etiqueta: "repuestos en catálogo", fuente: "Supabase (Ale)", fecha: "21/11/2026" },
  { id: "unidades", valor: null, etiqueta: "unidades mineras atendidas", fuente: "Supabase (Ale)", fecha: "21/11/2026" },
  { id: "clientes", valor: null, etiqueta: "empresas cliente", fuente: "Supabase (Ale)", fecha: "21/11/2026" },
  { id: "cotizaciones", valor: null, etiqueta: "cotizaciones atendidas", fuente: "Supabase (Ale)", fecha: "21/11/2026" },
]

export function cifrasConValor(cifras: Cifra[] = CIFRAS): Cifra[] {
  return cifras.filter((c) => c.valor !== null && c.valor.trim() !== "")
}
