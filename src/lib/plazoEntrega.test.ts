import { describe, expect, it } from "vitest"
import { PLAZO_SEGUN_COTIZACION, textoPlazoEntrega } from "./plazoEntrega"

describe("textoPlazoEntrega", () => {
  it("muestra el plazo que devuelve la API, sin espacios sobrantes", () => {
    expect(textoPlazoEntrega("5 a 7 días hábiles")).toBe("5 a 7 días hábiles")
    expect(textoPlazoEntrega("  3 días  ")).toBe("3 días")
  })

  it.each([[""], ["   "], [null], [undefined]])(
    "si viene %j usa «Plazo según cotización»",
    (valor) => {
      expect(textoPlazoEntrega(valor)).toBe(PLAZO_SEGUN_COTIZACION)
      expect(PLAZO_SEGUN_COTIZACION).toBe("Plazo según cotización")
    },
  )
})
