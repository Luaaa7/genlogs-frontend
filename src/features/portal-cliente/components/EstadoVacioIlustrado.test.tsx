import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EstadoVacioIlustrado, type IlustracionVacia } from "./EstadoVacioIlustrado"

const TIPOS: IlustracionVacia[] = ["pedidos", "cotizaciones", "comprobantes", "despachos", "repuestos", "busqueda"]

describe("EstadoVacioIlustrado", () => {
  it.each(TIPOS)("«%s» dibuja una ilustración vectorial en azul acero y ámbar, oculta a los lectores", (tipo) => {
    render(<EstadoVacioIlustrado ilustracion={tipo} titulo="Nada por aquí" />)
    const dibujo = screen.getByTestId("ilustracion-vacia")
    expect(dibujo.tagName.toLowerCase()).toBe("svg")
    expect(dibujo.getAttribute("aria-hidden")).toBe("true")
    expect(dibujo.innerHTML).toMatch(/1E3A5F|2E6BA8/i)
    expect(dibujo.innerHTML).toMatch(/FACC15/i)
    expect(dibujo.querySelector("text")).toBeNull()
  })

  it("muestra título, descripción y la acción rápida", () => {
    const alHacerClic = vi.fn()
    render(
      <EstadoVacioIlustrado
        ilustracion="busqueda"
        titulo="No hay pedidos para mostrar"
        descripcion="Prueba con otro estado."
        accion={<button type="button" onClick={alHacerClic}>Ver todos los pedidos</button>}
      />,
    )
    expect(screen.getByRole("heading", { level: 2, name: "No hay pedidos para mostrar" })).toBeTruthy()
    expect(screen.getByText("Prueba con otro estado.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Ver todos los pedidos" }))
    expect(alHacerClic).toHaveBeenCalled()
  })

  it("entra con un fade suave que se apaga con movimiento reducido", () => {
    const { container } = render(<EstadoVacioIlustrado ilustracion="pedidos" titulo="Vacío" />)
    const raiz = container.firstElementChild as HTMLElement
    expect(raiz.className).toContain("animate-[tarjeta-entra_")
    expect(raiz.className).toContain("motion-reduce:animate-none")
  })
})
