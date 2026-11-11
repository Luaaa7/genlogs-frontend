import { describe, expect, it } from "vitest"
import { ETAPAS_PEDIDO, etapaDelPedido, etiquetaEstado, esEstadoFinalSinCotizar } from "./estadoPedido"

describe("estados del pedido que ve el cliente", () => {
  it("la barra tiene 4 etapas en orden", () => {
    expect(ETAPAS_PEDIDO.map((e) => e.etiqueta)).toEqual(["Recibida", "En búsqueda", "En espera de proveedor", "Cotizada"])
  })

  it("ubica cada estado del backend en su etapa", () => {
    expect(etapaDelPedido("PENDIENTE")).toBe(0)
    expect(etapaDelPedido("EN_REVISION")).toBe(1)
    expect(etapaDelPedido("EN_ESPERA_TERCERO")).toBe(2)
    expect(etapaDelPedido("COTIZADA")).toBe(3)
  })

  it("cancelada o no cotizada no tienen etapa en la barra", () => {
    expect(etapaDelPedido("CANCELADA")).toBe(-1)
    expect(etapaDelPedido("RECHAZADA")).toBe(-1)
    expect(esEstadoFinalSinCotizar("CANCELADA")).toBe(true)
    expect(esEstadoFinalSinCotizar("RECHAZADA")).toBe(true)
    expect(esEstadoFinalSinCotizar("EN_REVISION")).toBe(false)
  })

  it("muestra nombres claros para el cliente", () => {
    expect(etiquetaEstado("PENDIENTE")).toBe("Recibida")
    expect(etiquetaEstado("EN_ESPERA_TERCERO")).toBe("En espera de proveedor")
    expect(etiquetaEstado("RECHAZADA")).toBe("No se pudo cotizar")
    expect(etiquetaEstado("CANCELADA")).toBe("Cancelada")
  })

  it("un estado desconocido se muestra legible y no rompe la barra", () => {
    expect(etiquetaEstado("ESTADO_NUEVO")).toBe("Estado nuevo")
    expect(etapaDelPedido("ESTADO_NUEVO")).toBe(0)
  })
})
