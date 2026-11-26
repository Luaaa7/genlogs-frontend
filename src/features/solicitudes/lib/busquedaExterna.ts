/** Lo que se busca de un ítem: su número de parte y, si no tiene, su nombre. */
export function terminoDeBusqueda(item: { numeroParte?: string | null; descripcion: string }): string {
  return item.numeroParte?.trim() || item.descripcion.trim()
}

/** Buscadores externos para ubicar un repuesto. El término viaja codificado en la URL. */
export function enlacesBusqueda(termino: string): Array<{ nombre: string; url: string }> {
  const q = encodeURIComponent(termino)
  return [
    { nombre: 'Google', url: `https://www.google.com/search?q=${q}` },
    { nombre: 'eBay', url: `https://www.ebay.com/sch/i.html?_nkw=${q}` },
    { nombre: 'Amazon', url: `https://www.amazon.com/s?k=${q}` },
    { nombre: 'Alibaba', url: `https://www.alibaba.com/trade/search?SearchText=${q}` },
  ]
}
