import { describe, expect, it } from "vitest"
import { separarNombreCompleto, unirNombreCompleto } from "./nombreCompleto"

describe("unirNombreCompleto", () => {
  it("une nombres y apellidos sin espacios de más", () => {
    expect(unirNombreCompleto("  Rosa  ", " Quispe Mamani ")).toBe("Rosa Quispe Mamani")
  })
  it("si falta una parte no deja espacios sueltos", () => {
    expect(unirNombreCompleto("Rosa", "  ")).toBe("Rosa")
  })
})

describe("separarNombreCompleto", () => {
  it.each([
    ["", "", ""],
    ["Gina", "Gina", ""],
    ["Gina Paz", "Gina", "Paz"],
    ["Juan Perez Soto", "Juan", "Perez Soto"],
    ["Luana Gabriela Barrientos Espinoza", "Luana Gabriela", "Barrientos Espinoza"],
    ["  Rosa   Elena  María  Quispe  Mamani ", "Rosa Elena María", "Quispe Mamani"],
  ])("«%s» se reparte en nombres y apellidos", (completo, nombres, apellidos) => {
    expect(separarNombreCompleto(completo)).toEqual({ nombres, apellidos })
  })
})
