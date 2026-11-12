import { describe, expect, it } from "vitest"
import { puedeDecidir, tonoEstadoCotizacion } from "./cotizacionPortal"

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
