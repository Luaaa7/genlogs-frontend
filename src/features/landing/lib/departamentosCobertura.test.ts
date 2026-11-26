import { describe, expect, it } from "vitest"
import { departamentoDe, nombreDepartamento, normalizarTexto } from "./departamentosCobertura"
import { DEPARTAMENTOS_PERU } from "./mapaPeru"

describe("departamentosCobertura", () => {
  it("el mapa trae los 25 departamentos, cada uno con su contorno", () => {
    expect(DEPARTAMENTOS_PERU).toHaveLength(25)
    expect(new Set(DEPARTAMENTOS_PERU.map((d) => d.id)).size).toBe(25)
    expect(DEPARTAMENTOS_PERU.every((d) => d.d.startsWith("M") && d.d.length > 20)).toBe(true)
  })

  it("normaliza tildes, mayúsculas y signos", () => {
    expect(normalizarTexto("  Áncash - Huari ")).toBe("ancash huari")
    expect(normalizarTexto("JUNÍN")).toBe("junin")
  })

  it.each([
    ["Arequipa", "arequipa"],
    ["AREQUIPA", "arequipa"],
    ["Áncash", "ancash"],
    ["Junín", "junin"],
    ["Huánuco", "huanuco"],
    ["Cuzco", "cusco"],
    ["Madre de Dios", "madre-de-dios"],
    ["La Libertad", "la-libertad"],
    ["Arequipa - Caylloma", "arequipa"],
    ["Callao", "callao"],
  ])("la región «%s» es el departamento %s", (region, id) => {
    expect(departamentoDe(region)).toBe(id)
  })

  it("sin región o con una que no es un departamento devuelve null", () => {
    expect(departamentoDe(null)).toBeNull()
    expect(departamentoDe(undefined)).toBeNull()
    expect(departamentoDe("")).toBeNull()
    expect(departamentoDe("Sierra central")).toBeNull()
  })

  it("el nombre para mostrar lleva tildes", () => {
    expect(nombreDepartamento("ancash")).toBe("Áncash")
    expect(nombreDepartamento("san-martin")).toBe("San Martín")
  })
})
