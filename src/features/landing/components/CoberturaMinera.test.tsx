import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCobertura } from "../hooks/useCobertura"
import { CoberturaMinera, UNIDADES_INICIALES } from "./CoberturaMinera"

vi.mock("../hooks/useCobertura", () => ({ useCobertura: vi.fn() }))

function zonas(cantidad: number) {
  return Array.from({ length: cantidad }, (_, i) => ({ id: i + 1, nombre: `Unidad ${i + 1}`, region: `Región ${i + 1}`, descripcion: null }))
}

function conCobertura(cantidad: number) {
  vi.mocked(useCobertura).mockReturnValue({ data: zonas(cantidad), isPending: false, isError: false, refetch: vi.fn() } as never)
}

describe("CoberturaMinera (v3.4)", () => {
  beforeEach(() => vi.mocked(useCobertura).mockReset())

  it("con más de 6 unidades muestra 6 y un botón para ver el resto", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
    expect(screen.queryByText("Unidad 7")).toBeNull()
    const boton = screen.getByRole("button", { name: "Ver todas las unidades mineras" })
    expect(boton.getAttribute("aria-expanded")).toBe("false")
  })

  it("«Ver todas las unidades mineras» muestra todas y «Ver menos» vuelve a las 6", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    fireEvent.click(screen.getByRole("button", { name: "Ver todas las unidades mineras" }))
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9)
    expect(screen.getByRole("button", { name: "Ver menos" }).getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "Ver menos" }))
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
  })

  it("con 6 unidades o menos no hay botón", () => {
    conCobertura(UNIDADES_INICIALES)
    render(<CoberturaMinera />)
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("sin unidades invita a contactar", () => {
    conCobertura(0)
    render(<CoberturaMinera />)
    expect(screen.getByText(/Contáctanos para conocer nuestra cobertura actual/)).toBeTruthy()
  })
})
