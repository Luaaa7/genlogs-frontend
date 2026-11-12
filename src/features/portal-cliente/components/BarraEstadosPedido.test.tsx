import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { BarraEstadosPedido } from "./BarraEstadosPedido"

describe("BarraEstadosPedido (P9: solo estados, sin fechas ni horas)", () => {
  it("marca la etapa actual y las anteriores como completadas", () => {
    render(<BarraEstadosPedido estado="EN_ESPERA_TERCERO" />)

    const pasos = screen.getAllByRole("listitem")
    expect(pasos).toHaveLength(4)
    expect(pasos[2].getAttribute("aria-current")).toBe("step")
    expect(pasos[0].textContent).toMatch(/Recibida.*completada/i)
    expect(pasos[1].textContent).toMatch(/En búsqueda.*completada/i)
    expect(pasos[3].textContent).toMatch(/Cotizada.*pendiente/i)
  })

  it("no muestra fechas, horas ni cuenta regresiva", () => {
    const { container } = render(<BarraEstadosPedido estado="EN_REVISION" />)
    expect(container.textContent).not.toMatch(/\d{1,2}[:/]\d{2}|hora|día|vence/i)
  })

  it("si el pedido se canceló muestra el aviso en lugar de la barra", () => {
    render(<BarraEstadosPedido estado="CANCELADA" />)
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
    expect(screen.getByRole("status").textContent).toMatch(/cancelada/i)
  })

  it("si no se pudo cotizar lo explica en lugar de la barra", () => {
    render(<BarraEstadosPedido estado="RECHAZADA" />)
    expect(screen.getByRole("status").textContent).toMatch(/no se pudo cotizar/i)
  })
})
