import { beforeEach, describe, expect, it } from "vitest"
import { borrarPedidoPendiente, guardarPedidoPendiente, leerPedidoPendiente } from "./pedidoPendiente"

describe("pedidoPendiente (D-30)", () => {
  beforeEach(() => localStorage.clear())

  it("guarda y lee el pedido", () => {
    guardarPedidoPendiente({ marca: "CAT", numeroParte: "1R-0750", descripcion: "Filtro", cantidad: 2 })
    expect(leerPedidoPendiente()).toMatchObject({ marca: "CAT", numeroParte: "1R-0750", descripcion: "Filtro", cantidad: 2 })
  })

  it("descarta un pedido de hace más de un día", () => {
    guardarPedidoPendiente({ marca: "", numeroParte: "", descripcion: "Filtro", cantidad: 1 })
    expect(leerPedidoPendiente(Date.now() + 25 * 60 * 60 * 1000)).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it("ignora datos dañados", () => {
    localStorage.setItem("genlogs-pedido-pendiente", "{no es json")
    expect(leerPedidoPendiente()).toBeNull()
    localStorage.setItem("genlogs-pedido-pendiente", JSON.stringify({ descripcion: "", cantidad: 1, guardadoEn: Date.now() }))
    expect(leerPedidoPendiente()).toBeNull()
  })

  it("borrar deja el navegador limpio", () => {
    guardarPedidoPendiente({ marca: "", numeroParte: "", descripcion: "Filtro", cantidad: 1 })
    borrarPedidoPendiente()
    expect(leerPedidoPendiente()).toBeNull()
  })
})
