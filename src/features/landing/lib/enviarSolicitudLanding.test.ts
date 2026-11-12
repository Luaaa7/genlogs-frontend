import { afterEach, describe, expect, it, vi } from "vitest"
import axios from "axios"
import { axiosClient } from "@/api/axiosClient"
import { enviarSolicitudLanding } from "./enviarSolicitudLanding"

describe("enviarSolicitudLanding", () => {
  afterEach(() => vi.restoreAllMocks())

  it("envía al endpoint único con canal LANDING y el token del cliente, sin los interceptores internos", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValueOnce({ data: { idSolicitud: 5, codigoSolicitud: "SOL-5", estado: "PENDIENTE" } })
    const interno = vi.spyOn(axiosClient, "post")

    const r = await enviarSolicitudLanding({ marca: " CAT ", numeroParte: "1R-0750", descripcion: "Filtro de combustible", cantidad: 2 }, "tok-cliente")

    expect(r.codigoSolicitud).toBe("SOL-5")
    expect(interno).not.toHaveBeenCalled()
    const [ruta, cuerpo, config] = post.mock.calls[0]
    expect(ruta).toBe("/solicitudes")
    expect(cuerpo).toEqual({
      canal: "LANDING",
      asunto: "CAT 1R-0750",
      descripcion: "Filtro de combustible",
      items: [{ descripcion: "Filtro de combustible", cantidad: 2, marcaTexto: "CAT", numeroParte: "1R-0750" }],
    })
    expect(config?.headers).toMatchObject({ Authorization: "Bearer tok-cliente" })
    expect(config?.baseURL).toBe(axiosClient.defaults.baseURL)
  })

  it("sin N.º de parte usa la descripción como asunto y no manda campos vacíos", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValueOnce({ data: {} })
    await enviarSolicitudLanding({ marca: "", numeroParte: "", descripcion: "Plancha de desgaste", cantidad: 1 }, "t")
    expect(post.mock.calls[0][1]).toEqual({
      canal: "LANDING",
      asunto: "Plancha de desgaste",
      descripcion: "Plancha de desgaste",
      items: [{ descripcion: "Plancha de desgaste", cantidad: 1 }],
    })
  })
})
