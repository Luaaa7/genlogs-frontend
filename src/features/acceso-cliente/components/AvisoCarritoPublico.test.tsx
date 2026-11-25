import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { agregarAlCarrito } from "@/lib/carritoPublico"
import { AvisoCarritoPublico } from "./AvisoCarritoPublico"

const filtro = { id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" }
const rodamiento = { id: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS" }

describe("AvisoCarritoPublico", () => {
  beforeEach(() => localStorage.clear())

  it("sin repuestos elegidos no muestra nada", () => {
    const { container } = render(<AvisoCarritoPublico />)
    expect(container.textContent).toBe("")
  })

  it("con varios repuestos dice cuántos se enviarán", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)
    render(<AvisoCarritoPublico />)
    expect(screen.getByRole("status").textContent).toBe(
      "Inicia sesión o regístrate con tu RUC para enviar los 2 repuestos seleccionados.",
    )
  })

  it("con un solo repuesto va en singular", () => {
    agregarAlCarrito({ ...filtro, cantidad: 5 })
    render(<AvisoCarritoPublico />)
    expect(screen.getByRole("status").textContent).toBe(
      "Inicia sesión o regístrate con tu RUC para enviar el repuesto seleccionado.",
    )
  })
})
