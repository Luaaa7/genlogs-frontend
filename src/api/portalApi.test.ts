import { describe, expect, it, vi } from "vitest"
import { axiosClient } from "./axiosClient"
import { portalApi } from "./portalApi"

describe("portalApi", () => {
  it("consulta pedidos usando la ruta del portal", async () => {
    const get = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: { pedidos: [{ id: "p-1", fecha: "2026-01-01", estado: "PENDIENTE" }] } })
    await expect(portalApi.listarPedidos()).resolves.toHaveLength(1)
    expect(get).toHaveBeenCalledWith("/portal/pedidos")
  })

  it("envía una nueva solicitud con el contrato esperado", async () => {
    const post = vi.spyOn(axiosClient, "post").mockResolvedValueOnce({ data: { id: "p-2" } })
    const payload = { asunto: "Rodamientos", descripcion: "Requerimos diez unidades." }
    await expect(portalApi.crearSolicitud(payload)).resolves.toEqual({ id: "p-2" })
    expect(post).toHaveBeenCalledWith("/portal/solicitudes", payload)
  })
})
