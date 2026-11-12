import { describe, expect, it } from "vitest"
import { calcularCostoPuestoLima } from "./costoPuestoLima"

describe("calcularCostoPuestoLima", () => {
  it("convierte dólares y suma flete, seguro y aduana (igual que el backend)", () => {
    expect(calcularCostoPuestoLima({ precio: 100, codigoMoneda: "USD", tipoCambio: 3.75, flete: 50, seguro: 10, aduana: 20 })).toBe(455)
  })

  it("en soles no necesita tipo de cambio", () => {
    expect(calcularCostoPuestoLima({ precio: 250, codigoMoneda: "PEN", flete: 15 })).toBe(265)
  })

  it("redondea a 2 decimales", () => {
    expect(calcularCostoPuestoLima({ precio: 18.5, codigoMoneda: "USD", tipoCambio: 3.7512 })).toBe(69.4)
  })

  it("sin precio o en dólares sin tipo de cambio no calcula", () => {
    expect(calcularCostoPuestoLima({ codigoMoneda: "PEN" })).toBeNull()
    expect(calcularCostoPuestoLima({ precio: 100, codigoMoneda: "USD" })).toBeNull()
  })
})
