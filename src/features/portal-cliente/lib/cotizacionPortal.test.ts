import { describe, expect, it } from "vitest"
import { cantidadConUnidad, estaAceptada, puedeDecidir, tonoEstadoCotizacion } from "./cotizacionPortal"

const hoy = new Date("2026-11-12T10:00:00")

describe("puedeDecidir (aprobar o rechazar desde el portal)", () => {
  it("sí, si está enviada o en negociación y sigue vigente", () => {
    expect(puedeDecidir({ estado: "Enviada", fechaValidez: "2026-11-20" }, hoy)).toBe(true)
    expect(puedeDecidir({ estado: "En negociación", fechaValidez: "2026-11-12" }, hoy)).toBe(true)
  })

  it("no, si ya venció la fecha de validez", () => {
    expect(puedeDecidir({ estado: "Enviada", fechaValidez: "2026-11-11" }, hoy)).toBe(false)
  })

  it("no, si ya se aprobó, rechazó, anuló o venció", () => {
    for (const estado of ["Aprobada", "Rechazada", "Anulada", "Vencida"]) {
      expect(puedeDecidir({ estado, fechaValidez: "2026-11-20" }, hoy)).toBe(false)
    }
  })

  it("usa el código del backend cuando viene (más seguro que el nombre)", () => {
    expect(puedeDecidir({ estado: "Lista para ti", codigoEstado: "ENVIADA", fechaValidez: null }, hoy)).toBe(true)
    expect(puedeDecidir({ estado: "Enviada", codigoEstado: "APROBADA", fechaValidez: null }, hoy)).toBe(false)
  })

  it("si el backend manda puedeDecidir, manda ese valor", () => {
    expect(puedeDecidir({ estado: "Enviada", puedeDecidir: false, fechaValidez: "2026-11-20" }, hoy)).toBe(false)
    expect(puedeDecidir({ estado: "Aprobada", puedeDecidir: true, fechaValidez: "2026-11-01" }, hoy)).toBe(true)
  })

  it("el día de validez inclusive se puede decidir y cierra a las 00:00 de Lima del día siguiente", () => {
    expect(puedeDecidir({ estado: "Enviada", fechaValidez: "2026-11-12" }, new Date("2026-11-12T23:30:00-05:00"))).toBe(true)
    expect(puedeDecidir({ estado: "Enviada", fechaValidez: "2026-11-12" }, new Date("2026-11-13T00:00:00-05:00"))).toBe(false)
  })
})

describe("tonoEstadoCotizacion", () => {
  it("colorea por significado, no por texto exacto", () => {
    expect(tonoEstadoCotizacion("Aprobada")).toBe("success")
    expect(tonoEstadoCotizacion("Rechazada")).toBe("destructive")
    expect(tonoEstadoCotizacion("Vencida")).toBe("neutral")
    expect(tonoEstadoCotizacion("Enviada")).toBe("warning")
  })
})

describe("cantidadConUnidad (singular y plural)", () => {
  it.each([
    [1, "Unidad", "1 Unidad"],
    [2, "Unidad", "2 Unidades"],
    [60, "Unidad", "60 Unidades"],
    [0, "Unidad", "0 Unidades"],
    [2, "Juego", "2 Juegos"],
    [2, "Par", "2 Pares"],
    [3, "Caja", "3 Cajas"],
    [2, "Galón", "2 Galones"],
    [2, "Juego de llaves", "2 Juegos de llaves"],
    [2, "UNIDAD", "2 UNIDADES"],
    [2, "unidad", "2 unidades"],
  ])("%s %s → %s", (cantidad, unidad, esperado) => {
    expect(cantidadConUnidad(cantidad, unidad)).toBe(esperado)
  })

  it.each([[2, "UND"], [5, "kg"], [4, "und."], [3, "m"]])("la abreviatura %s %s no se pluraliza", (cantidad, unidad) => {
    expect(cantidadConUnidad(cantidad, unidad)).toBe(`${cantidad} ${unidad}`)
  })

  it("sin unidad muestra solo la cantidad", () => {
    expect(cantidadConUnidad(3)).toBe("3")
    expect(cantidadConUnidad(3, "  ")).toBe("3")
  })
})

describe("estaAceptada", () => {
  it.each(["Aceptada por el cliente", "Aprobada", "APROBADA"])("«%s» sí", (estado) => {
    expect(estaAceptada({ estado })).toBe(true)
  })
  it("por código del estado", () => {
    expect(estaAceptada({ estado: "x", codigoEstado: "ACEPTADA" })).toBe(true)
  })
  it.each(["Enviada", "Rechazada", "Anulada", "Vencida"])("«%s» no", (estado) => {
    expect(estaAceptada({ estado })).toBe(false)
  })
})
