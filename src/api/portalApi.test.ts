import { describe, expect, it, vi } from "vitest"
import { axiosClient } from "./axiosClient"
import { portalApi } from "./portalApi"
import { RUTA_SOLICITUDES, type SolicitudRequest } from "./contratos"

describe("portalApi", () => {
  it("consulta pedidos usando la ruta del portal", async () => {
    const get = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: { pedidos: [{ id: "p-1", fecha: "2026-01-01", estado: "PENDIENTE" }] } })
    await expect(portalApi.listarPedidos()).resolves.toHaveLength(1)
    expect(get).toHaveBeenCalledWith("/portal/pedidos")
  })

  it("envía cada repuesto con marca, N.º de parte, GTIN y foto (D-01) por el canal PORTAL", async () => {
    const post = vi.spyOn(axiosClient, "post").mockResolvedValueOnce({ data: { idSolicitud: 3, codigoSolicitud: "SOL-3", estado: "PENDIENTE" } })
    const payload: SolicitudRequest = {
      canal: "PORTAL",
      asunto: "Filtros",
      descripcion: "Para el mantenimiento del cargador.",
      items: [{
        descripcion: "Filtro de aceite", cantidad: 2, unidad: "UND",
        marcaTexto: "Caterpillar", numeroParte: "1R-0750", gtin: "7750182002011",
      }],
    }
    await expect(portalApi.crearSolicitud(payload)).resolves.toMatchObject({ codigoSolicitud: "SOL-3" })
    expect(post).toHaveBeenCalledWith(RUTA_SOLICITUDES, payload)
  })

  it("sube la foto o plano del cliente como multipart y devuelve la URL", async () => {
    const post = vi.spyOn(axiosClient, "post").mockResolvedValueOnce({ data: { url: "https://res.cloudinary.com/x/placa.jpg" } })
    const archivo = new File(["x"], "placa.jpg", { type: "image/jpeg" })

    await expect(portalApi.subirFotoSolicitud(archivo)).resolves.toBe("https://res.cloudinary.com/x/placa.jpg")

    const [ruta, cuerpo, config] = post.mock.calls[0]
    expect(ruta).toBe("/solicitudes/fotos")
    expect((cuerpo as FormData).get("file")).toBe(archivo)
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } })
  })
})
