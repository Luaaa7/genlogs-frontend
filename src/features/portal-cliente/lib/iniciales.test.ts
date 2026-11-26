import { describe, expect, it } from "vitest"
import { iniciales } from "./iniciales"

describe("iniciales del avatar", () => {
  it("toma la primera letra del primer y del último nombre", () => {
    expect(iniciales("Luana Barrientos")).toBe("LB")
    expect(iniciales("María del Carmen Quispe Rojas")).toBe("MR")
  })
  it("con un solo nombre usa una letra", () => {
    expect(iniciales("Cliente")).toBe("C")
  })
  it("ignora espacios sobrantes y pasa a mayúsculas", () => {
    expect(iniciales("  ana  perez ")).toBe("AP")
  })
  it("sin nombre devuelve texto vacío (el avatar muestra un icono)", () => {
    expect(iniciales("")).toBe("")
    expect(iniciales("   ")).toBe("")
  })
})
