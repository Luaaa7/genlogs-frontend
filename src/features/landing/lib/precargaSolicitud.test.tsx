import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { limpiarPrecarga, publicarPrecarga, usePrecargaSolicitud } from "./precargaSolicitud"

describe("precargaSolicitud (v3.4)", () => {
  afterEach(() => limpiarPrecarga())

  it("empieza vacía y recibe lo que publica el catálogo", () => {
    const { result } = renderHook(() => usePrecargaSolicitud())
    expect(result.current).toBeNull()
    act(() => publicarPrecarga({ descripcion: "Anemómetro Digital" }))
    expect(result.current).toEqual({ descripcion: "Anemómetro Digital" })
  })

  it("publicar el mismo producto otra vez crea un valor nuevo (para volver a cargarlo)", () => {
    const { result } = renderHook(() => usePrecargaSolicitud())
    act(() => publicarPrecarga({ descripcion: "Anemómetro Digital" }))
    const primero = result.current
    act(() => publicarPrecarga({ descripcion: "Anemómetro Digital" }))
    expect(result.current).toEqual(primero)
    expect(result.current).not.toBe(primero)
  })
})
