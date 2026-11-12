import { describe, expect, it } from "vitest"
import { rutaIngresoCliente } from "./ingresoCliente"

describe("ruta del ingreso del cliente (D-30)", () => {
  it("lleva la página de regreso en ?volver=", () => {
    expect(rutaIngresoCliente("/portal/solicitud")).toBe("/portal/ingreso?volver=%2Fportal%2Fsolicitud")
    expect(rutaIngresoCliente()).toBe("/portal/ingreso")
  })

  it("no acepta destinos de otro sitio", () => {
    expect(rutaIngresoCliente("https://otro.com")).toBe("/portal/ingreso")
    expect(rutaIngresoCliente("//otro.com")).toBe("/portal/ingreso")
  })
})
