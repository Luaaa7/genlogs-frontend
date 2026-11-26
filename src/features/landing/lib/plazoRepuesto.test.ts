import { describe, expect, it } from "vitest"
import { PLAZO_SEGUN_COTIZACION, textoPlazoRepuesto } from "./plazoRepuesto"

describe("textoPlazoRepuesto", () => {
  it("reemplaza el texto fijo «24 a 48 horas» por «Plazo según cotización»", () => {
    expect(textoPlazoRepuesto("24 a 48 horas")).toBe(PLAZO_SEGUN_COTIZACION)
    expect(textoPlazoRepuesto("  24 a 48 h ")).toBe(PLAZO_SEGUN_COTIZACION)
  })

  it("sin plazo desde la API muestra «Plazo según cotización»", () => {
    expect(textoPlazoRepuesto(null)).toBe(PLAZO_SEGUN_COTIZACION)
    expect(textoPlazoRepuesto(undefined)).toBe(PLAZO_SEGUN_COTIZACION)
    expect(textoPlazoRepuesto("   ")).toBe(PLAZO_SEGUN_COTIZACION)
  })

  it("si la API trae un plazo propio, lo muestra", () => {
    expect(textoPlazoRepuesto("5 a 7 días hábiles")).toBe("5 a 7 días hábiles")
    expect(textoPlazoRepuesto(" 10 días hábiles ")).toBe("10 días hábiles")
  })
})