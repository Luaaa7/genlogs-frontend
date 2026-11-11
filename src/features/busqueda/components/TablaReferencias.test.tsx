import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Referencia } from "@/api/sourcingApi"
import { TablaReferencias } from "./TablaReferencias"

const ref = (urlReferencia: string | null): Referencia => ({
  idSourcing: 1, idSolicitudItem: null, fuente: "EBAY", metodo: "NUMERO_PARTE", titulo: "Filtro",
  marca: null, numeroParte: "1R-0750", precioRef: 10, codigoMoneda: "USD", costoPuestoLima: null,
  urlReferencia, urlImagenRef: null, estado: "CAPTURADO", editadoAMano: false, creadoEn: "2026-11-11T10:00:00",
})

describe("TablaReferencias: enlaces", () => {
  it("enlaza las direcciones http(s) en otra pestaña", () => {
    render(<TablaReferencias referencias={[ref("https://www.ebay.com/itm/1")]} puedeMarcar={false} onMarcar={() => {}} />)
    const enlace = screen.getByRole("link", { name: /ver en la tienda/i })
    expect(enlace.getAttribute("href")).toBe("https://www.ebay.com/itm/1")
    expect(enlace.getAttribute("rel")).toBe("noopener noreferrer")
  })

  it.each(["javascript:alert(1)", "data:text/html,hola", "/ruta/relativa"])("no enlaza %s: muestra solo el texto", (url) => {
    render(<TablaReferencias referencias={[ref(url)]} puedeMarcar={false} onMarcar={() => {}} />)
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.getByText(url)).toBeTruthy()
  })
})
