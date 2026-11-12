import { afterEach, describe, expect, it, vi } from "vitest"
import { axiosClient } from "@/api/axiosClient"
import { repuestosApi } from "./repuestosApi"

describe("repuestosApi", () => {
  afterEach(() => vi.restoreAllMocks())

  it("lista los repuestos del portal", async () => {
    const get = vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: [] })
    await repuestosApi.listar("1R-0750")
    expect(get).toHaveBeenCalledWith("/portal/repuestos", { params: { q: "1R-0750" } })
  })

  it("el carrito crea UNA solicitud con canal VITRINA y todos los ítems", async () => {
    const post = vi.spyOn(axiosClient, "post").mockResolvedValueOnce({ data: { codigoSolicitud: "SOL-1" } })
    await repuestosApi.pedirCotizacion([
      { clave: "1", idProducto: 1, descripcion: "Filtro", marca: "CAT", numeroParte: "1R-0750", unidad: "Unidad", precio: 10, cantidad: 2 },
      { clave: "texto:plancha", descripcion: "Plancha de desgaste", urlFoto: "/uploads/plancha.jpg", cantidad: 1 },
    ])
    expect(post).toHaveBeenCalledWith("/solicitudes", {
      canal: "VITRINA",
      asunto: "Pedido de 2 repuestos desde la vitrina",
      items: [
        { descripcion: "Filtro", cantidad: 2, unidad: "Unidad", marcaTexto: "CAT", numeroParte: "1R-0750", idProducto: 1 },
        { descripcion: "Plancha de desgaste", cantidad: 1, urlFoto: "/uploads/plancha.jpg" },
      ],
    })
  })
})
