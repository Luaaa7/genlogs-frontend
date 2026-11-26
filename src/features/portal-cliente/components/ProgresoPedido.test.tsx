import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ProgresoPedido } from "./ProgresoPedido"

const etapas = () => within(screen.getByRole("list", { name: "Avance del pedido SOL-1" })).getAllByRole("listitem")

describe("ProgresoPedido (barra de 4 etapas en la tarjeta)", () => {
  it("muestra las 4 etapas del BPMN en orden", () => {
    render(<ProgresoPedido estado="PENDIENTE" etiqueta="Avance del pedido SOL-1" />)
    expect(etapas().map((e) => e.textContent?.replace(/\(.*\)/, ""))).toEqual(["Recibida", "En búsqueda", "En espera de proveedor", "Cotizada"])
  })

  it("marca lo completado, lo que está en curso y lo pendiente", () => {
    render(<ProgresoPedido estado="EN_ESPERA_TERCERO" etiqueta="Avance del pedido SOL-1" />)
    const [recibida, busqueda, espera, cotizada] = etapas()
    expect(recibida.textContent).toContain("(completada)")
    expect(busqueda.textContent).toContain("(completada)")
    expect(espera.getAttribute("aria-current")).toBe("step")
    expect(espera.textContent).toContain("(en curso)")
    expect(cotizada.textContent).toContain("(pendiente)")
  })

  it("cotizada deja la última etapa en curso", () => {
    render(<ProgresoPedido estado="COTIZADA" etiqueta="Avance del pedido SOL-1" />)
    expect(etapas()[3].getAttribute("aria-current")).toBe("step")
  })

  it.each(["CANCELADA", "RECHAZADA"])("%s no muestra barra", (estado) => {
    render(<ProgresoPedido estado={estado} etiqueta="Avance del pedido SOL-1" />)
    expect(screen.queryByRole("list")).toBeNull()
  })

  describe("punto indicador de la etapa actual", () => {
    const puntos = () => screen.queryAllByTestId("punto-activo")

    it("hay un solo punto, dentro de la etapa en curso, oculto a los lectores de pantalla", () => {
      render(<ProgresoPedido estado="EN_REVISION" etiqueta="Avance del pedido SOL-1" />)
      expect(puntos()).toHaveLength(1)
      expect(etapas()[1].contains(puntos()[0])).toBe(true)
      expect(puntos()[0].getAttribute("aria-hidden")).toBe("true")
    })

    it("pulsa con un animate-ping discreto, que se apaga con movimiento reducido", () => {
      render(<ProgresoPedido estado="EN_REVISION" etiqueta="Avance del pedido SOL-1" />)
      const onda = puntos()[0].firstElementChild as HTMLElement
      expect(onda.className).toContain("animate-ping")
      expect(onda.className).toContain("motion-reduce:animate-none")
      expect(onda.className).toContain("opacity-40")
    })

    it("en la etapa final (Cotizada) el punto queda fijo: ya no hay nada por esperar", () => {
      render(<ProgresoPedido estado="COTIZADA" etiqueta="Avance del pedido SOL-1" />)
      expect(puntos()).toHaveLength(1)
      expect(puntos()[0].innerHTML).not.toContain("animate-ping")
    })

    it.each(["CANCELADA", "RECHAZADA"])("%s no muestra punto", (estado) => {
      render(<ProgresoPedido estado={estado} etiqueta="Avance del pedido SOL-1" />)
      expect(puntos()).toHaveLength(0)
    })
  })
})
