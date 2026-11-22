import { describe, expect, it, vi } from "vitest"
import { axiosClient } from "./axiosClient"
import { sourcingApi } from "./sourcingApi"
import { sourcingMock } from "./sourcingApi.mock"

describe("sourcingApi", () => {
  it("busca con POST /sourcing/buscar", async () => {
    const post = vi.spyOn(axiosClient, "post").mockResolvedValueOnce({ data: { referencias: [] } })
    await sourcingApi.buscar({ numeroParte: "1R-0750", forzar: false })
    expect(post).toHaveBeenCalledWith("/sourcing/buscar", { numeroParte: "1R-0750", forzar: false })
  })

  it("lee el historial por N.º de parte", async () => {
    const get = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: [] })
    await sourcingApi.historial({ numeroParte: "1R-0750" })
    expect(get).toHaveBeenCalledWith("/sourcing/historial", { params: { numeroParte: "1R-0750" } })
  })

  it("puede pedir solo las elegibles, un texto y un límite", async () => {
    const get = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: [] })
    await sourcingApi.historial({ q: "filtro", soloElegibles: true, limite: 20 })
    expect(get).toHaveBeenCalledWith("/sourcing/historial", { params: { q: "filtro", soloElegibles: true, limite: 20 } })
  })

  it("el mock con soloElegibles no devuelve descartadas", async () => {
    vi.useFakeTimers()
    try {
      const pedido = sourcingMock.historial({ q: "1R-0750", soloElegibles: true })
      await vi.runAllTimersAsync()
      const lista = await pedido
      expect(lista.some((r) => r.estado === "DESCARTADO")).toBe(false)
      expect(lista.length).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it("elige desde la cotización con cuerpo vacío, o con el ítem si ya viene", async () => {
    const post = vi.spyOn(axiosClient, "post").mockResolvedValue({ data: { idSourcing: 4, estado: "UTIL" } })
    await sourcingApi.elegirDesdeCotizacion(4, {})
    expect(post).toHaveBeenCalledWith("/sourcing/4/elegir-desde-cotizacion", {})
    await sourcingApi.elegirDesdeCotizacion(4, { idSolicitudItem: 9 })
    expect(post).toHaveBeenCalledWith("/sourcing/4/elegir-desde-cotizacion", { idSolicitudItem: 9 })
    post.mockRestore()
  })

  it("el mock deja ÚTIL solo la elegida", async () => {
    vi.useFakeTimers()
    try {
      const antes = sourcingMock.historial({ numeroParte: "1R-0750" })
      await vi.runAllTimersAsync()
      const lista = await antes
      const otra = lista.find((r) => r.idSourcing === 2)
      const elegida = sourcingMock.elegirDesdeCotizacion(1, {})
      await vi.runAllTimersAsync()
      const marcada = await elegida
      expect(marcada.estado).toBe("UTIL")
      expect(marcada.marcadaUtilDesde).toBe("COTIZACION")
      const despues = sourcingMock.historial({ numeroParte: "1R-0750" })
      await vi.runAllTimersAsync()
      const intacta = (await despues).find((r) => r.idSourcing === 2)
      expect(intacta?.estado).toBe(otra?.estado)
      expect(intacta?.marcadaUtilDesde ?? null).toBe(otra?.marcadaUtilDesde ?? null)
    } finally {
      vi.useRealTimers()
    }
  })

  it("cambia el estado con PATCH", async () => {
    const patch = vi.spyOn(axiosClient, "patch").mockResolvedValueOnce({ data: {} })
    await sourcingApi.cambiarEstado(7, "DESCARTADO")
    expect(patch).toHaveBeenCalledWith("/sourcing/7/estado", { estado: "DESCARTADO" })
  })
})
