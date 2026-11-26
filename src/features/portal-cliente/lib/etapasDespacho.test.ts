import { describe, expect, it } from "vitest"
import { etapasDelDespacho } from "./etapasDespacho"

describe("etapasDelDespacho", () => {
  it("sin aduana para los demás: el portal no conoce el origen y no la supone", () => {
    expect(etapasDelDespacho("EN_TRANSITO")).toEqual(["REGISTRADO", "EN_PREPARACION", "EN_TRANSITO", "ENTREGADO"])
  })
  it("con aduana solo cuando el despacho está en esa etapa", () => {
    expect(etapasDelDespacho("EN_ADUANA")).toEqual(["REGISTRADO", "EN_PREPARACION", "EN_ADUANA", "EN_TRANSITO", "ENTREGADO"])
  })
})
