import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { Paginacion } from "./Paginacion"
import { paginasVisibles } from "../lib/paginasVisibles"

describe("paginasVisibles", () => {
  it("con pocas páginas las muestra todas", () => {
    expect(paginasVisibles(2, 5)).toEqual([1, 2, 3, 4, 5])
  })
  it("con muchas páginas resume con puntos suspensivos", () => {
    expect(paginasVisibles(1, 24)).toEqual([1, 2, "…", 24])
    expect(paginasVisibles(12, 24)).toEqual([1, "…", 11, 12, 13, "…", 24])
    expect(paginasVisibles(24, 24)).toEqual([1, "…", 23, 24])
  })
})

describe("Paginacion", () => {
  it("con una sola página no se muestra", () => {
    const { container } = render(<Paginacion pagina={1} total={1} onCambiar={() => {}} />)
    expect(container.innerHTML).toBe("")
  })

  it("marca la página actual y desactiva «Anterior» en la primera", () => {
    render(<Paginacion pagina={1} total={24} onCambiar={() => {}} />)
    expect(screen.getByRole("button", { name: "Página 1" }).getAttribute("aria-current")).toBe("page")
    expect((screen.getByRole("button", { name: /anterior/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("las flechas y los números avisan a qué página ir", () => {
    const onCambiar = vi.fn()
    render(<Paginacion pagina={3} total={24} onCambiar={onCambiar} />)
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }))
    expect(onCambiar).toHaveBeenLastCalledWith(4)
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }))
    expect(onCambiar).toHaveBeenLastCalledWith(2)
    fireEvent.click(screen.getByRole("button", { name: "Página 24" }))
    expect(onCambiar).toHaveBeenLastCalledWith(24)
  })
})