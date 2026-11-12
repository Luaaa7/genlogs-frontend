import { useState } from "react"

/** Paginación en el navegador para listas que el servidor entrega completas.
 *  Vuelve a la primera página cuando cambia la cantidad de elementos (búsqueda, filtros). */
export function usePaginacionLocal<T>(elementos: T[], tamanoInicial = 10) {
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(tamanoInicial)
  const total = elementos.length
  const totalPaginas = Math.max(1, Math.ceil(total / tamano))
  const firma = `${total}:${tamano}`
  const [firmaVista, setFirmaVista] = useState(firma)
  if (firma !== firmaVista) {
    setFirmaVista(firma)
    setPagina(0)
  }

  const paginaSegura = Math.min(pagina, totalPaginas - 1)
  const visibles = elementos.slice(paginaSegura * tamano, paginaSegura * tamano + tamano)

  return {
    visibles,
    pagina: paginaSegura,
    totalPaginas,
    total,
    tamano,
    enPagina: visibles.length,
    onPagina: setPagina,
    onTamano: setTamano,
  }
}
