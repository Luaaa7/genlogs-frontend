import { describe, expect, it } from "vitest"
import { aDecimal, aNumero } from "./numeroDecimal"

describe("aNumero", () => {
  it.each([
    ["18,50", 18.5], ["18.50", 18.5], ["1.234,56", 1234.56], ["1,234.56", 1234.56],
    ["1,234", 1234], ["3,7512", 3.7512], [" 250 ", 250], ["0", 0],
  ])("%s → %d", (texto, esperado) => {
    expect(aNumero(texto)).toBe(esperado)
  })

  it.each(["", "  ", "abc", "12a", "US$ 5"])("%s no es número", (texto) => {
    expect(aNumero(texto)).toBeUndefined()
  })
})

describe("aDecimal (tipo de cambio)", () => {
  it.each([["3,751", 3.751], ["3.751", 3.751], ["3,75", 3.75], ["3", 3], [" 3,7512 ", 3.7512]])("%s → %d", (texto, esperado) => {
    expect(aDecimal(texto)).toBe(esperado)
  })

  it.each(["", "abc", "3,7,5", "1.234,56", "-3"])("%s no es una tasa válida", (texto) => {
    expect(aDecimal(texto)).toBeUndefined()
  })
})
