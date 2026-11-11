import { describe, expect, it, vi } from "vitest"
import { axiosClient } from "./axiosClient"
import { sourcingApi } from "./sourcingApi"

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

  it("cambia el estado con PATCH", async () => {
    const patch = vi.spyOn(axiosClient, "patch").mockResolvedValueOnce({ data: {} })
    await sourcingApi.cambiarEstado(7, "DESCARTADO")
    expect(patch).toHaveBeenCalledWith("/sourcing/7/estado", { estado: "DESCARTADO" })
  })
})
