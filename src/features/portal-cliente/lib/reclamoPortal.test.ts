import { describe, expect, it } from "vitest"
import { ETAPAS_RECLAMO, etapaDelReclamo } from "./reclamoPortal"

describe("etapaDelReclamo", () => {
  it("ubica cada estado en su etapa", () => {
    expect(ETAPAS_RECLAMO.map(etapaDelReclamo)).toEqual([0, 1, 2, 3])
  })
  it("anulado o desconocido no tiene etapa", () => {
    expect(etapaDelReclamo("ANULADO")).toBe(-1)
    expect(etapaDelReclamo("OTRO")).toBe(-1)
  })
})
