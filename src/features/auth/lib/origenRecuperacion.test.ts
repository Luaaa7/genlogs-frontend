import { beforeEach, describe, expect, it } from "vitest"
import { CLAVE_ORIGEN, guardarOrigen, leerOrigen, limpiarOrigen, rutaIngreso } from "./origenRecuperacion"

describe("origen de la recuperación de contraseña", () => {
  beforeEach(() => localStorage.clear())

  it("recuerda que la persona empezó desde el portal del cliente", () => {
    expect(leerOrigen()).toBeNull()
    guardarOrigen("portal")
    expect(leerOrigen()).toBe("portal")
  })

  it("cualquier otro origen borra lo recordado", () => {
    guardarOrigen("portal")
    guardarOrigen(null)
    expect(leerOrigen()).toBeNull()
    expect(localStorage.getItem(CLAVE_ORIGEN)).toBeNull()
  })

  it("limpiarOrigen borra lo recordado", () => {
    guardarOrigen("portal")
    limpiarOrigen()
    expect(leerOrigen()).toBeNull()
  })

  it("ignora un valor guardado que no es «portal»", () => {
    localStorage.setItem(CLAVE_ORIGEN, "otra-cosa")
    expect(leerOrigen()).toBeNull()
  })

  it("el portal vuelve a /portal/ingreso y el resto al login del personal", () => {
    expect(rutaIngreso("portal")).toBe("/portal/ingreso")
    expect(rutaIngreso(null)).toBe("/login")
  })
})
