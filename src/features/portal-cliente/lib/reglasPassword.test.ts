import { describe, expect, it } from "vitest"
import { bytesUtf8, passwordValida, reglasPassword } from "./reglasPassword"

describe("reglasPassword", () => {
  it("acepta de 8 a 72 bytes con mayúscula, minúscula y número", () => {
    expect(passwordValida("Clave1234", "ana@portal.pe")).toBe(true)
    expect(passwordValida("Aa1" + "x".repeat(69), "ana@portal.pe")).toBe(true)
  })

  it("mide el tope en bytes: las tildes y la ñ cuentan doble", () => {
    expect(bytesUtf8("ñ")).toBe(2)
    const conEnes = "ñ".repeat(40) + "Aa1"
    expect(conEnes.length).toBeLessThan(72)
    expect(passwordValida(conEnes, "ana@portal.pe")).toBe(false)
    expect(reglasPassword(conEnes, "ana@portal.pe").find((r) => r.id === "maximo")?.cumple).toBe(false)
  })

  it("marca la regla que falta", () => {
    const faltan = reglasPassword("clave", "ana@portal.pe").filter((r) => !r.cumple).map((r) => r.id)
    expect(faltan).toEqual(expect.arrayContaining(["minimo", "mayuscula", "numero"]))
  })

  it("rechaza la contraseña igual al correo, sin distinguir mayúsculas", () => {
    expect(passwordValida("Ana1@Portal.pe", "ana1@portal.pe")).toBe(false)
  })
})