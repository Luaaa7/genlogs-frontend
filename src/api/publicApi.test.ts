import { describe, expect, it, vi } from "vitest"
import { axiosClient } from "./axiosClient"
import { publicApi } from "./publicApi"

describe("publicApi", () => {
  it("normaliza el catálogo cuando el backend devuelve una lista", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: [{ id: 1, nombre: "Filtro" }] })
    await expect(publicApi.listarCatalogo()).resolves.toEqual([{ id: 1, nombre: "Filtro" }])
  })

  it("normaliza cobertura con envoltorio content", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValueOnce({ data: { content: [{ id: 2, nombre: "Sur" }] } })
    await expect(publicApi.listarCobertura()).resolves.toEqual([{ id: 2, nombre: "Sur" }])
  })
})
